import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccessibleText } from '@/components/AccessibleText';

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Términos de Uso', headerShown: true }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AccessibleText text="Términos y Condiciones de Uso" style={styles.title} />
        <Text style={styles.lastUpdated}>Última actualización: {new Date().toLocaleDateString('es-CR')}</Text>

        <View style={styles.section}>
          <AccessibleText text="1. Aceptación de los Términos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Al acceder y utilizar la plataforma Kompa2Go, usted acepta estar sujeto a estos Términos y Condiciones de Uso, 
            todas las leyes y regulaciones aplicables de Costa Rica, y acepta que es responsable del cumplimiento de 
            todas las leyes locales aplicables.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="2. Descripción del Servicio" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Kompa2Go es una plataforma digital que conecta usuarios (clientes) con proveedores de servicios de transporte 
            (Kommuters) en Costa Rica. La plataforma facilita la coordinación de viajes compartidos y servicios de transporte 
            privado.
          </Text>
          <Text style={styles.paragraph}>
            Kompa2Go actúa únicamente como intermediario tecnológico y no es responsable de la prestación directa de los 
            servicios de transporte.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="3. Registro y Cuenta de Usuario" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Requisitos de Registro:</Text> Para utilizar nuestros servicios, debe:
          </Text>
          <Text style={styles.listItem}>• Ser mayor de 18 años</Text>
          <Text style={styles.listItem}>• Proporcionar información veraz y actualizada</Text>
          <Text style={styles.listItem}>• Mantener la confidencialidad de su cuenta</Text>
          <Text style={styles.listItem}>• Notificar inmediatamente cualquier uso no autorizado</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 Tipos de Usuario:</Text>
          </Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Clientes (MiKompa):</Text> Usuarios que solicitan servicios de transporte</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Proveedores (2Kompa):</Text> Empresas que ofrecen servicios de transporte</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Kommuters:</Text> Conductores registrados que prestan el servicio</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="4. Obligaciones de los Usuarios" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Clientes:</Text>
          </Text>
          <Text style={styles.listItem}>• Proporcionar información de ubicación precisa</Text>
          <Text style={styles.listItem}>• Respetar al conductor y otros pasajeros</Text>
          <Text style={styles.listItem}>• Pagar las tarifas acordadas</Text>
          <Text style={styles.listItem}>• No transportar materiales peligrosos o ilegales</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 Kommuters:</Text>
          </Text>
          <Text style={styles.listItem}>• Mantener licencia de conducir vigente</Text>
          <Text style={styles.listItem}>• Mantener vehículo en condiciones óptimas</Text>
          <Text style={styles.listItem}>• Cumplir con todas las leyes de tránsito</Text>
          <Text style={styles.listItem}>• Completar verificación de antecedentes después de 20 viajes</Text>
          <Text style={styles.listItem}>• Mantener seguro vehicular vigente</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="5. Tarifas y Pagos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Estructura de Tarifas:</Text> Las tarifas se calculan en base a:
          </Text>
          <Text style={styles.listItem}>• Distancia del viaje</Text>
          <Text style={styles.listItem}>• Tiempo estimado</Text>
          <Text style={styles.listItem}>• Demanda en tiempo real (surge pricing)</Text>
          <Text style={styles.listItem}>• Tipo de vehículo</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 Métodos de Pago:</Text> Aceptamos:
          </Text>
          <Text style={styles.listItem}>• Tarjetas de crédito/débito</Text>
          <Text style={styles.listItem}>• Sinpe Móvil</Text>
          <Text style={styles.listItem}>• Kash</Text>
          <Text style={styles.listItem}>• Efectivo (según disponibilidad del conductor)</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Comisiones:</Text> Kompa2Go retiene una comisión del 15-20% de cada viaje 
            para cubrir costos operativos y mantenimiento de la plataforma.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="6. Cancelaciones y Reembolsos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.1 Cancelación por Cliente:</Text>
          </Text>
          <Text style={styles.listItem}>• Cancelación gratuita dentro de los primeros 2 minutos</Text>
          <Text style={styles.listItem}>• Cargo de ₡1,000 después de 2 minutos</Text>
          <Text style={styles.listItem}>• Cargo completo si el conductor ya llegó al punto de recogida</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.2 Cancelación por Kommuter:</Text>
          </Text>
          <Text style={styles.listItem}>• Penalización en calificación del conductor</Text>
          <Text style={styles.listItem}>• Posible suspensión temporal por cancelaciones frecuentes</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.3 Reembolsos:</Text> Se procesarán dentro de 5-7 días hábiles en casos de:
          </Text>
          <Text style={styles.listItem}>• Cobros duplicados</Text>
          <Text style={styles.listItem}>• Errores del sistema</Text>
          <Text style={styles.listItem}>• Servicio no prestado por causa del conductor</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="7. Programa de Referidos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Recompensas:</Text>
          </Text>
          <Text style={styles.listItem}>• Referidor: ₡20,000 cuando el referido complete 20 viajes</Text>
          <Text style={styles.listItem}>• Referido: ₡10,000 al completar 25 viajes</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Condiciones:</Text>
          </Text>
          <Text style={styles.listItem}>• Los viajes deben ser completados exitosamente</Text>
          <Text style={styles.listItem}>• Sistema anti-fraude valida cada viaje</Text>
          <Text style={styles.listItem}>• Límite de 5 referidos por día</Text>
          <Text style={styles.listItem}>• Recompensas no transferibles ni canjeables por efectivo</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="8. Seguridad y Verificaciones" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.1 Verificación de Antecedentes:</Text> Todos los Kommuters deben completar 
            verificación de antecedentes penales después de 20 viajes completados.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.2 Documentación Requerida:</Text>
          </Text>
          <Text style={styles.listItem}>• Licencia de conducir vigente</Text>
          <Text style={styles.listItem}>• Documentos del vehículo</Text>
          <Text style={styles.listItem}>• Seguro vehicular</Text>
          <Text style={styles.listItem}>• Certificado de antecedentes penales (después de 20 viajes)</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="9. Responsabilidad y Limitaciones" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.1 Limitación de Responsabilidad:</Text> Kompa2Go no será responsable por:
          </Text>
          <Text style={styles.listItem}>• Daños o pérdidas durante el viaje</Text>
          <Text style={styles.listItem}>• Accidentes de tránsito</Text>
          <Text style={styles.listItem}>• Comportamiento de conductores o pasajeros</Text>
          <Text style={styles.listItem}>• Pérdida de objetos personales</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.2 Seguro:</Text> Los Kommuters deben mantener seguro vehicular vigente. 
            Kompa2Go no proporciona cobertura de seguro adicional.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="10. Propiedad Intelectual" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Todos los derechos de propiedad intelectual sobre la plataforma Kompa2Go, incluyendo pero no limitado a 
            software, diseño, logos, marcas y contenido, son propiedad exclusiva de Kompa2Go o sus licenciantes.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="11. Privacidad de Datos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            El uso de sus datos personales está regido por nuestra Política de Privacidad, la cual cumple con la 
            Ley de Protección de la Persona Frente al Tratamiento de sus Datos Personales (Ley N° 8968) de Costa Rica.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="12. Suspensión y Terminación" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Kompa2Go se reserva el derecho de suspender o terminar cuentas que:
          </Text>
          <Text style={styles.listItem}>• Violen estos términos y condiciones</Text>
          <Text style={styles.listItem}>• Realicen actividades fraudulentas</Text>
          <Text style={styles.listItem}>• Tengan comportamiento inapropiado</Text>
          <Text style={styles.listItem}>• Proporcionen información falsa</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="13. Modificaciones" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Kompa2Go se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán 
            notificados a través de la aplicación y entrarán en vigor inmediatamente después de su publicación.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="14. Ley Aplicable y Jurisdicción" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Estos términos se rigen por las leyes de la República de Costa Rica. Cualquier disputa será resuelta 
            en los tribunales competentes de San José, Costa Rica.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="15. Contacto" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Para preguntas sobre estos términos, puede contactarnos en:
          </Text>
          <Text style={styles.listItem}>• Email: legal@kompa2go.com</Text>
          <Text style={styles.listItem}>• Teléfono: +506 2222-2222</Text>
          <Text style={styles.listItem}>• Dirección: San José, Costa Rica</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al utilizar Kompa2Go, usted reconoce haber leído, entendido y aceptado estos Términos y Condiciones de Uso.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  listItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 8,
  },
  footer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  footerText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
    fontWeight: '600',
  },
});
