import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccessibleText } from '@/components/AccessibleText';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Política de Privacidad', headerShown: true }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AccessibleText text="Política de Privacidad" style={styles.title} />
        <Text style={styles.lastUpdated}>Última actualización: {new Date().toLocaleDateString('es-CR')}</Text>

        <View style={styles.section}>
          <AccessibleText text="1. Introducción" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Kompa2Go (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la Compañía&quot;) se compromete a proteger la privacidad de sus usuarios. 
            Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información 
            personal de acuerdo con la Ley de Protección de la Persona Frente al Tratamiento de sus Datos Personales 
            (Ley N° 8968) de Costa Rica.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="2. Información que Recopilamos" style={styles.sectionTitle} />
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.1 Información Personal:</Text>
          </Text>
          <Text style={styles.listItem}>• Nombre completo</Text>
          <Text style={styles.listItem}>• Número de cédula</Text>
          <Text style={styles.listItem}>• Correo electrónico</Text>
          <Text style={styles.listItem}>• Número de teléfono</Text>
          <Text style={styles.listItem}>• Dirección física</Text>
          <Text style={styles.listItem}>• Fecha de nacimiento</Text>
          <Text style={styles.listItem}>• Fotografía de perfil</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.2 Información de Ubicación:</Text>
          </Text>
          <Text style={styles.listItem}>• Ubicación GPS en tiempo real (durante viajes activos)</Text>
          <Text style={styles.listItem}>• Historial de ubicaciones de viajes</Text>
          <Text style={styles.listItem}>• Direcciones guardadas</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.3 Información de Pago:</Text>
          </Text>
          <Text style={styles.listItem}>• Información de tarjetas de crédito/débito (tokenizada)</Text>
          <Text style={styles.listItem}>• Historial de transacciones</Text>
          <Text style={styles.listItem}>• Información de facturación</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.4 Información del Dispositivo:</Text>
          </Text>
          <Text style={styles.listItem}>• Tipo de dispositivo y sistema operativo</Text>
          <Text style={styles.listItem}>• Identificador único del dispositivo</Text>
          <Text style={styles.listItem}>• Dirección IP</Text>
          <Text style={styles.listItem}>• Información de red</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.5 Información de Uso:</Text>
          </Text>
          <Text style={styles.listItem}>• Historial de viajes</Text>
          <Text style={styles.listItem}>• Calificaciones y reseñas</Text>
          <Text style={styles.listItem}>• Preferencias de usuario</Text>
          <Text style={styles.listItem}>• Interacciones con la aplicación</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.6 Información Adicional para Kommuters:</Text>
          </Text>
          <Text style={styles.listItem}>• Licencia de conducir</Text>
          <Text style={styles.listItem}>• Documentos del vehículo</Text>
          <Text style={styles.listItem}>• Seguro vehicular</Text>
          <Text style={styles.listItem}>• Certificado de antecedentes penales</Text>
          <Text style={styles.listItem}>• Información bancaria para pagos</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="3. Cómo Usamos su Información" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Utilizamos su información personal para:
          </Text>
          <Text style={styles.listItem}>• Facilitar y coordinar servicios de transporte</Text>
          <Text style={styles.listItem}>• Procesar pagos y transacciones</Text>
          <Text style={styles.listItem}>• Verificar identidad y antecedentes</Text>
          <Text style={styles.listItem}>• Mejorar la seguridad de la plataforma</Text>
          <Text style={styles.listItem}>• Proporcionar soporte al cliente</Text>
          <Text style={styles.listItem}>• Enviar notificaciones sobre viajes y servicios</Text>
          <Text style={styles.listItem}>• Detectar y prevenir fraude</Text>
          <Text style={styles.listItem}>• Cumplir con obligaciones legales</Text>
          <Text style={styles.listItem}>• Realizar análisis y mejorar nuestros servicios</Text>
          <Text style={styles.listItem}>• Enviar comunicaciones de marketing (con su consentimiento)</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="4. Compartir Información" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Compartimos su información únicamente en las siguientes circunstancias:
          </Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Con Otros Usuarios:</Text>
          </Text>
          <Text style={styles.listItem}>• Nombre, foto y calificación con conductores/pasajeros</Text>
          <Text style={styles.listItem}>• Ubicación de recogida/destino durante viajes activos</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 Con Proveedores de Servicios:</Text>
          </Text>
          <Text style={styles.listItem}>• Procesadores de pago</Text>
          <Text style={styles.listItem}>• Servicios de verificación de antecedentes</Text>
          <Text style={styles.listItem}>• Servicios de almacenamiento en la nube</Text>
          <Text style={styles.listItem}>• Servicios de análisis</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 Por Razones Legales:</Text>
          </Text>
          <Text style={styles.listItem}>• Cumplimiento de leyes y regulaciones</Text>
          <Text style={styles.listItem}>• Respuesta a solicitudes legales</Text>
          <Text style={styles.listItem}>• Protección de derechos y seguridad</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.4 En Caso de Transferencia Empresarial:</Text>
          </Text>
          <Text style={styles.paragraph}>
            En caso de fusión, adquisición o venta de activos, su información puede ser transferida a la nueva entidad.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="5. Almacenamiento y Seguridad" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Ubicación de Datos:</Text> Sus datos se almacenan en servidores seguros 
            ubicados en Costa Rica y en servicios de nube certificados (Firebase/Google Cloud).
          </Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 Medidas de Seguridad:</Text>
          </Text>
          <Text style={styles.listItem}>• Encriptación de datos en tránsito y en reposo</Text>
          <Text style={styles.listItem}>• Autenticación de dos factores</Text>
          <Text style={styles.listItem}>• Controles de acceso estrictos</Text>
          <Text style={styles.listItem}>• Monitoreo continuo de seguridad</Text>
          <Text style={styles.listItem}>• Auditorías de seguridad regulares</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Retención de Datos:</Text> Conservamos su información personal mientras 
            su cuenta esté activa y durante 5 años adicionales después de su cierre para cumplir con obligaciones 
            legales y fiscales.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="6. Sus Derechos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            De acuerdo con la Ley N° 8968, usted tiene derecho a:
          </Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Acceso:</Text> Solicitar una copia de sus datos personales</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Rectificación:</Text> Corregir datos inexactos o incompletos</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Eliminación:</Text> Solicitar la eliminación de sus datos</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Oposición:</Text> Oponerse al procesamiento de sus datos</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Portabilidad:</Text> Recibir sus datos en formato estructurado</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Revocación:</Text> Retirar su consentimiento en cualquier momento</Text>
          
          <Text style={styles.paragraph}>
            Para ejercer estos derechos, contáctenos en privacy@kompa2go.com
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="7. Cookies y Tecnologías Similares" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Utilizamos cookies y tecnologías similares para:
          </Text>
          <Text style={styles.listItem}>• Mantener su sesión activa</Text>
          <Text style={styles.listItem}>• Recordar sus preferencias</Text>
          <Text style={styles.listItem}>• Analizar el uso de la aplicación</Text>
          <Text style={styles.listItem}>• Personalizar su experiencia</Text>
          
          <Text style={styles.paragraph}>
            Puede gestionar las preferencias de cookies en la configuración de su dispositivo.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="8. Privacidad de Menores" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información 
            de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos inmediatamente.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="9. Transferencias Internacionales" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de Costa Rica. En estos casos, 
            nos aseguramos de que existan garantías adecuadas para proteger su información personal de acuerdo con 
            estándares internacionales.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="10. Cambios a esta Política" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios significativos 
            a través de la aplicación o por correo electrónico. La fecha de &quot;Última actualización&quot; al inicio de este 
            documento indica cuándo se realizó la última modificación.
          </Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="11. Autoridad de Protección de Datos" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Si tiene inquietudes sobre cómo manejamos sus datos personales, puede contactar a la Agencia de Protección 
            de Datos de los Habitantes (PRODHAB) de Costa Rica:
          </Text>
          <Text style={styles.listItem}>• Sitio web: www.prodhab.go.cr</Text>
          <Text style={styles.listItem}>• Teléfono: 2527-5400</Text>
          <Text style={styles.listItem}>• Dirección: San José, Costa Rica</Text>
        </View>

        <View style={styles.section}>
          <AccessibleText text="12. Contacto" style={styles.sectionTitle} />
          <Text style={styles.paragraph}>
            Para preguntas sobre esta Política de Privacidad o para ejercer sus derechos, contáctenos en:
          </Text>
          <Text style={styles.listItem}>• Email: privacy@kompa2go.com</Text>
          <Text style={styles.listItem}>• Teléfono: +506 2222-2222</Text>
          <Text style={styles.listItem}>• Dirección: San José, Costa Rica</Text>
          <Text style={styles.listItem}>• Oficial de Protección de Datos: dpo@kompa2go.com</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al utilizar Kompa2Go, usted reconoce haber leído y comprendido esta Política de Privacidad y consiente 
            el procesamiento de sus datos personales según lo descrito.
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
