import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Appointment } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { StripePaymentForm } from "@/components/payment/StripePaymentForm";
import AppLayout from "@/components/layout/AppLayout";

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const appointmentId = parseInt(id);
        
        if (isNaN(appointmentId)) {
          setError("ID de cita inválido");
          return;
        }
        
        const response = await apiRequest("GET", `/api/appointments/${appointmentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al cargar la cita");
        }
        
        const appointmentData = await response.json();
        setAppointment(appointmentData);
        
        // Verificar si el usuario actual es el cliente de la cita
        if (user && user.id !== appointmentData.clientId) {
          setError("No tienes permiso para pagar esta cita");
        }
        
        // Verificar si la cita tiene un precio
        if (!appointmentData.price) {
          setError("Esta cita no tiene un precio definido");
        }
      } catch (err: any) {
        console.error("Error cargando cita:", err);
        setError(err.message || "Error al cargar los datos de la cita");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointment();
  }, [id, user]);

  const handlePaymentSuccess = () => {
    toast({
      title: "Pago realizado con éxito",
      description: "El pago se ha completado correctamente",
    });
    setLocation("/appointments");
  };

  const handleCancel = () => {
    setLocation("/appointments");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="mx-auto max-w-2xl mt-8">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar la página de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => setLocation("/appointments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis citas
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!appointment) {
    return (
      <AppLayout>
        <Card className="mx-auto max-w-2xl mt-8">
          <CardHeader>
            <CardTitle>Cita no encontrada</CardTitle>
            <CardDescription>No se pudo encontrar la cita solicitada</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/appointments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis citas
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/appointments")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a mis citas
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Realizar pago</CardTitle>
            <CardDescription>
              Completa el pago para la cita: {appointment.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Detalles de la cita</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Servicio:</span> {appointment.serviceType}</p>
                  <p><span className="font-medium">Fecha:</span> {new Date(appointment.date).toLocaleDateString('es-ES')}</p>
                  <p><span className="font-medium">Hora:</span> {new Date(appointment.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                  <p><span className="font-medium">Duración:</span> {appointment.duration} minutos</p>
                  <p><span className="font-medium">Ubicación:</span> {appointment.location}</p>
                  <p className="text-lg font-semibold text-primary">
                    <span className="font-medium">Importe a pagar:</span> {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(appointment.price / 100)}
                  </p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Forma de pago</h3>
                <StripePaymentForm 
                  appointmentId={appointment.id} 
                  amount={appointment.price / 100} // Convertir céntimos a euros para visualización
                  onPaymentSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}