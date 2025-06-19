import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { AppointmentRequestForm } from '@/components/appointments/AppointmentRequestForm';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function NewAppointmentPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Si no hay usuario autenticado después de cargar, redirigir a login
    if (!isLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isLoading, setLocation]);

  // Extraer ID del profesional o cliente de la URL si existe
  // Por ejemplo: /appointments/new?professionalId=123
  const searchParams = new URLSearchParams(window.location.search);
  const professionalId = searchParams.get('professionalId') ? 
    parseInt(searchParams.get('professionalId')!) : undefined;
  const clientId = searchParams.get('clientId') ? 
    parseInt(searchParams.get('clientId')!) : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-equi-green" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-6">Solicitar nueva cita</h1>
      <p className="text-muted-foreground mb-8">
        {user.isProfessional 
          ? 'Crea una solicitud de cita para uno de tus clientes'
          : 'Solicita una cita con uno de nuestros profesionales'}
      </p>

      <AppointmentRequestForm 
        onSuccess={() => setLocation('/appointments')}
        onCancel={() => setLocation('/appointments')}
        initialProfessionalId={professionalId}
        initialClientId={clientId}
      />
    </div>
  );
}