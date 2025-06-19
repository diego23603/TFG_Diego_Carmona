import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StripeSubscriptionCheckout } from "@/components/subscription/StripeSubscriptionCheckout";

export default function SubscriptionCheckoutPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [planId, setPlanId] = useState<string | null>(null);
  
  // Extraer el ID del plan de los parámetros de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    
    if (!plan || !['basic', 'premium'].includes(plan)) {
      toast({
        title: "Plan no válido",
        description: "Se usará el plan básico por defecto",
        variant: "warning"
      });
      
      // Si el usuario es un profesional sin suscripción, establecer plan básico por defecto
      if (user?.isProfessional && (!user.subscriptionType || user.subscriptionType === "")) {
        setPlanId('basic');
        // Actualizar la URL sin recargar la página
        window.history.replaceState(null, '', '/subscription-checkout?plan=basic');
        return;
      } else {
        // Para otros usuarios, redirigir a la página de perfil
        window.location.href = "/profile?tab=subscription";
        return;
      }
    }
    
    setPlanId(plan);
  }, [location, toast, user]);
  
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertTitle>No has iniciado sesión</AlertTitle>
          <AlertDescription>
            Debes iniciar sesión para acceder a esta página.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/auth">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!planId) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/profile?tab=subscription" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" /> 
            Volver a planes
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">
          Suscripción a plan {planId === 'premium' ? 'Premium' : 'Básico'}
        </h1>
        
        <p className="text-muted-foreground mb-8">
          {planId === 'premium' 
            ? 'Completa tu suscripción al plan Premium para disfrutar de todas las ventajas sin comisiones.' 
            : 'Completa tu suscripción al plan Básico.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <StripeSubscriptionCheckout 
            planId={planId}
            returnUrl="/profile?tab=subscription"
          />
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-muted/50 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-4">Resumen del plan</h3>
            
            {planId === 'premium' ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Plan Premium</span>
                  <span className="font-medium">
                    {user.userType === 'Profesional' ? '49,99 €' : '15,00 €'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Facturación</span>
                  <span>Mensual</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Renovación</span>
                  <span>Automática</span>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Incluye:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Sin comisiones por servicios</li>
                    <li>• Clientes ilimitados</li>
                    <li>• Prioridad en búsquedas</li>
                    <li>• Herramientas avanzadas</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Plan Básico</span>
                  <span className="font-medium">
                    {user.userType === 'Profesional' ? '25,00 €' : 'Gratis'}
                  </span>
                </div>
                {user.userType === 'Profesional' && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Facturación</span>
                      <span>Mensual</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Renovación</span>
                      <span>Automática</span>
                    </div>
                  </>
                )}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Incluye:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Comisión de 5% por servicio</li>
                    <li>• {user.userType === 'Profesional' ? 'Hasta 30 clientes' : 'Gestión de caballos'}</li>
                    <li>• Programación de citas</li>
                    <li>• Sistema de mensajería</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Puedes cancelar tu suscripción en cualquier momento desde tu perfil. 
              La suscripción seguirá activa hasta el final del período de facturación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}