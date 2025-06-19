import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Cargar Stripe fuera del componente para evitar recrearlo en cada render
// La key pública de Stripe es segura para incluir en el frontend
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeCheckoutFormProps {
  clientSecret: string;
  returnUrl: string;
  successMessage: string;
}

function StripeCheckoutForm({ clientSecret, returnUrl, successMessage }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  // Manejar el envío del formulario y confirmar el pago
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js no ha cargado todavía
      return;
    }

    setIsLoading(true);
    setPaymentStatus("processing");

    try {
      // Confirmar la suscripción
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Ocurrió un error al procesar tu pago");
        setPaymentStatus("error");
        toast({
          title: "Error en el pago",
          description: error.message || "Ocurrió un error al procesar tu pago",
          variant: "destructive",
        });
      } else {
        // El pago se ha completado con éxito
        setPaymentStatus("success");
        toast({
          title: "¡Pago completado!",
          description: successMessage,
        });
        
        // Redireccionar después de unos segundos
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 2000);
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Ocurrió un error al procesar tu pago");
      setPaymentStatus("error");
      toast({
        title: "Error en el pago",
        description: e.message || "Ocurrió un error al procesar tu pago",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="rounded-full bg-green-100 p-3">
          <svg 
            className="h-8 w-8 text-green-600" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">¡Pago completado correctamente!</h2>
        <p className="text-muted-foreground">{successMessage}</p>
        <p className="text-sm">Serás redirigido automáticamente en unos segundos...</p>
        <Button asChild variant="outline">
          <Link href={returnUrl}>
            Volver a mi perfil
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <PaymentElement />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          "Completar suscripción"
        )}
      </Button>
      
      <div className="text-sm text-muted-foreground text-center">
        <p>Pago seguro procesado por Stripe</p>
      </div>
    </form>
  );
}

interface StripeSubscriptionCheckoutProps {
  planId: string;
  returnUrl?: string;
}

export function StripeSubscriptionCheckout({ planId, returnUrl }: StripeSubscriptionCheckoutProps) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Mensajes personalizados por tipo de plan
  const successMessages = {
    basic: "Te has suscrito al plan básico.",
    premium: "Te has suscrito al plan premium. ¡Disfruta de todas las funciones sin comisiones!",
  };
  
  // Determinar mensaje según el plan seleccionado
  const successMessage = successMessages[planId as keyof typeof successMessages] || 
    "Tu suscripción se ha activado correctamente.";
  
  // URL a la que redireccionar después del pago
  const defaultReturnUrl = `/profile?tab=subscription`;
  const finalReturnUrl = returnUrl || defaultReturnUrl;

  // Función para crear la sesión de checkout
  const createCheckoutSession = async () => {
    try {
      setIsLoading(true);
      
      // Payload simplificado sin código de descuento (Stripe lo maneja nativamente)
      const payload = { 
        plan: planId,
        returnUrl: finalReturnUrl
      };
      
      // Usamos apiRequest que maneja automáticamente las credenciales de sesión
      const response = await apiRequest(
        'POST', 
        '/api/subscription/create-session', 
        payload
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la sesión de pago');
      }
      
      // Si tenemos una URL directa, redireccionar
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      
      // Si tenemos un clientSecret, configurar el formulario de pago
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error('No se recibió el secret de cliente de Stripe');
      }
    } catch (err: any) {
      console.error('Error al iniciar el checkout:', err);
      setError(err.message || 'Ocurrió un error al configurar el pago');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Iniciar la sesión de checkout al cargar el componente
  useEffect(() => {
    createCheckoutSession();
  }, [planId, finalReturnUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Preparando el proceso de pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error de configuración</AlertTitle>
        <AlertDescription>No se pudo inicializar el proceso de pago. Por favor, inténtalo de nuevo más tarde.</AlertDescription>
      </Alert>
    );
  }

  // Ya no necesitamos el esquema y la función para validar códigos de descuento
  // porque Stripe maneja la validación directamente en su página de checkout
  
  return (
    <div className="space-y-6">
      {/* Códigos de descuento gestionados directamente por Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">¿Tienes un código de descuento?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Podrás ingresar tu código promocional directamente en la página de pago de Stripe.
          </p>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm"><strong>Códigos disponibles:</strong></p>
            <ul className="text-sm mt-1 space-y-1">
              <li className="flex items-center">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs mr-2">WELCOME10</span>
                <span>10% de descuento en tu primera suscripción</span>
              </li>
              <li className="flex items-center">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs mr-2">FREEMONTH</span>
                <span>Primer mes totalmente gratis</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Formulario de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Información de pago</CardTitle>
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeCheckoutForm 
                clientSecret={clientSecret} 
                returnUrl={finalReturnUrl}
                successMessage={successMessage}
              />
            </Elements>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Preparando el formulario de pago...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}