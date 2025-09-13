import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export interface K2GProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultProducts: K2GProduct[] = [
  {
    id: '1',
    name: 'Automations',
    description: 'Automatización de procesos empresariales y workflows personalizados',
    price: '₡50,000/proyecto',
    category: 'K2G Products',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Webpage Creation',
    description: 'Desarrollo de páginas web profesionales y responsivas',
    price: '₡75,000/sitio',
    category: 'K2G Products',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'App Creation',
    description: 'Desarrollo de aplicaciones móviles nativas y multiplataforma',
    price: '₡150,000/app',
    category: 'K2G Products',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'k2g_products';

export const [K2GProductsProvider, useK2GProducts] = createContextHook(() => {
  const [products, setProducts] = useState<K2GProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      // For now, use in-memory storage since AsyncStorage direct import is restricted
      const stored = localStorage?.getItem?.(STORAGE_KEY);
      if (stored) {
        setProducts(JSON.parse(stored));
      } else {
        setProducts(defaultProducts);
        localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(defaultProducts));
      }
    } catch (error) {
      console.error('Error loading K2G products:', error);
      setProducts(defaultProducts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const saveProducts = useCallback(async (updatedProducts: K2GProduct[]) => {
    if (!updatedProducts || !Array.isArray(updatedProducts)) {
      console.error('Invalid products data');
      return;
    }
    
    try {
      localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error saving K2G products:', error);
    }
  }, []);

  const addProduct = useCallback(async (productData: Omit<K2GProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!productData?.name?.trim() || productData.name.length > 100) {
      throw new Error('Invalid product name');
    }
    
    const newProduct: K2GProduct = {
      ...productData,
      name: productData.name.trim(),
      description: productData.description?.trim() || '',
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedProducts = [...products, newProduct];
    await saveProducts(updatedProducts);
    return newProduct;
  }, [products, saveProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Omit<K2GProduct, 'id' | 'createdAt'>>) => {
    if (!id?.trim()) {
      throw new Error('Invalid product ID');
    }
    
    const updatedProducts = products.map(product => 
      product.id === id 
        ? { 
            ...product, 
            ...updates, 
            name: updates.name?.trim() || product.name,
            description: updates.description?.trim() || product.description,
            updatedAt: new Date().toISOString() 
          }
        : product
    );
    await saveProducts(updatedProducts);
  }, [products, saveProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!id?.trim()) {
      throw new Error('Invalid product ID');
    }
    
    const updatedProducts = products.filter(product => product.id !== id);
    await saveProducts(updatedProducts);
  }, [products, saveProducts]);

  const getActiveProducts = useCallback(() => {
    return products.filter(product => product.isActive);
  }, [products]);

  return useMemo(() => ({
    products,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    getActiveProducts,
    loadProducts,
  }), [products, isLoading, addProduct, updateProduct, deleteProduct, getActiveProducts, loadProducts]);
});