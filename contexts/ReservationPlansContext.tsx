import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface ReservationPlan {
  id: string;
  name: string;
  price: number;
  reservations: number;
  description: string;
  benefits: string[];
  popular?: boolean;
}

interface PurchasedPlan {
  id: string;
  planId: string;
  userId: string;
  purchaseDate: Date;
  expiryDate: Date;
  reservationsUsed: number;
  status: 'active' | 'expired' | 'pending_payment';
  paymentProofId?: string;
}



const DEFAULT_PLANS: ReservationPlan[] = [
  {
    id: 'k2g-5',
    name: 'Plan K2G-5',
    price: 2500,
    reservations: 6,
    description: '1 Reservation pass for free',
    benefits: [
      'Cost: ₡2500',
      '1 Reservation pass for free',
      'Total of Reservation passes: 6'
    ]
  },
  {
    id: 'k2g-10',
    name: 'Plan K2G-10',
    price: 5000,
    reservations: 11,
    description: '1 Reservation pass for free',
    benefits: [
      'Cost: ₡5000',
      '1 Reservation pass for free',
      'Total of Reservation passes: 11'
    ]
  },
  {
    id: 'k2g-15',
    name: 'Plan K2G-15',
    price: 7500,
    reservations: 17,
    description: '2 Reservation pass for free',
    benefits: [
      'Cost: ₡7500',
      '2 Reservation pass for free',
      'Total of Reservation passes: 17'
    ],
    popular: true
  },
  {
    id: 'k2g-20',
    name: 'Plan K2G-20',
    price: 10000,
    reservations: 23,
    description: '3 Reservation pass for free',
    benefits: [
      'Cost: ₡10000',
      '3 Reservation pass for free',
      'Total of Reservation passes: 23'
    ]
  }
];

export const [ReservationPlansProvider, useReservationPlans] = createContextHook(() => {
  const { user } = useAuth();
  const [plans] = useState<ReservationPlan[]>(DEFAULT_PLANS);
  const [purchasedPlans, setPurchasedPlans] = useState<PurchasedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchasedPlans = useCallback(async () => {
    if (!user) return;
    
    try {
      const plansData = await AsyncStorage.getItem(`purchased_plans_${user.id}`);
      
      if (plansData) {
        const parsedPlans = JSON.parse(plansData).map((p: any) => ({
          ...p,
          purchaseDate: new Date(p.purchaseDate),
          expiryDate: new Date(p.expiryDate)
        }));
        setPurchasedPlans(parsedPlans);
      }
    } catch (error) {
      console.error('Error loading purchased plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPurchasedPlans();
    }
  }, [user]);

  const savePurchasedPlans = useCallback(async (plansToSave: PurchasedPlan[]) => {
    if (!user || !plansToSave || plansToSave.length === 0) return;
    
    try {
      await AsyncStorage.setItem(`purchased_plans_${user.id}`, JSON.stringify(plansToSave));
    } catch (error) {
      console.error('Error saving purchased plans:', error);
    }
  }, [user]);

  const getAvailablePlans = useCallback(() => {
    return plans;
  }, [plans]);

  const getPurchasedPlans = useCallback(() => {
    return purchasedPlans.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
  }, [purchasedPlans]);

  const purchasePlan = useCallback(async (planId: string, paymentMethod: 'sinpe' | 'kash', proofImage: string): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');
    if (!planId?.trim() || planId.length > 50) throw new Error('ID de plan inválido');
    if (!paymentMethod?.trim() || !['sinpe', 'kash'].includes(paymentMethod)) throw new Error('Método de pago inválido');
    if (!proofImage?.trim() || proofImage.length > 10000) throw new Error('Imagen de comprobante inválida');
    
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan no encontrado');
    
    const purchaseId = `plan_purchase_${Date.now()}`;
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days validity
    
    const newPurchase: PurchasedPlan = {
      id: purchaseId,
      planId: plan.id,
      userId: user.id,
      purchaseDate,
      expiryDate,
      reservationsUsed: 0,
      status: 'pending_payment',
      paymentProofId: proofImage
    };
    
    const updatedPlans = [newPurchase, ...purchasedPlans];
    setPurchasedPlans(updatedPlans);
    await savePurchasedPlans(updatedPlans);
    
    // Create payment submission for admin panel
    const paymentData = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: plan.price,
      paymentMethod: paymentMethod,
      proofImage: proofImage,
      status: 'pending',
      createdAt: new Date().toISOString(),
      type: 'reservation_plan',
      planId: plan.id,
      planName: plan.name
    };
    
    // Store in AsyncStorage for admin panel
    const existingPayments = await AsyncStorage.getItem('pendingPayments');
    const payments = existingPayments ? JSON.parse(existingPayments) : [];
    payments.push(paymentData);
    await AsyncStorage.setItem('pendingPayments', JSON.stringify(payments));
    
    return purchaseId;
  }, [user, plans, purchasedPlans, savePurchasedPlans]);

  const useReservation = useCallback(async (planId: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    if (!planId?.trim() || planId.length > 50) throw new Error('ID de plan inválido');
    
    const planIndex = purchasedPlans.findIndex(p => 
      p.id === planId && 
      p.status === 'active' && 
      p.expiryDate > new Date() &&
      p.reservationsUsed < plans.find(plan => plan.id === p.planId)?.reservations!
    );
    
    if (planIndex === -1) {
      throw new Error('Plan no válido o sin reservas disponibles');
    }
    
    const updatedPlans = [...purchasedPlans];
    updatedPlans[planIndex] = {
      ...updatedPlans[planIndex],
      reservationsUsed: updatedPlans[planIndex].reservationsUsed + 1
    };
    
    setPurchasedPlans(updatedPlans);
    await savePurchasedPlans(updatedPlans);
  }, [user, purchasedPlans, plans, savePurchasedPlans]);

  const getActivePlan = useCallback((): PurchasedPlan | null => {
    const activePlans = purchasedPlans.filter(p => 
      p.status === 'active' && 
      p.expiryDate > new Date() &&
      p.reservationsUsed < plans.find(plan => plan.id === p.planId)?.reservations!
    );
    
    return activePlans.length > 0 ? activePlans[0] : null;
  }, [purchasedPlans, plans]);

  const hasActiveReservations = useCallback((): boolean => {
    return getActivePlan() !== null;
  }, [getActivePlan]);

  const refreshPlans = useCallback(async () => {
    await loadPurchasedPlans();
  }, []);

  return useMemo(() => ({
    plans,
    purchasedPlans,
    loading,
    getAvailablePlans,
    getPurchasedPlans,
    purchasePlan,
    useReservation,
    getActivePlan,
    hasActiveReservations,
    refreshPlans
  }), [plans, purchasedPlans, loading, getAvailablePlans, getPurchasedPlans, purchasePlan, useReservation, getActivePlan, hasActiveReservations, refreshPlans]);
});

export type { ReservationPlan, PurchasedPlan };