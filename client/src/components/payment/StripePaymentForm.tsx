import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Cargar Stripe fuera del componente para evitar recreaciones innecesarias
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Estilos para el componente CardElement
const cardElementOptions = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

type CheckoutFormProps = {
  clientSecret: string;
  appointmentId: number;
  amount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
};

const CheckoutForm = ({ 
  clientSecret, 
  appointmentId, 
  amount, 
  onPaymentSuccess,
  onCancel 
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js no se ha cargado todavía
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("No se pudo encontrar el elemento de tarjeta");
      setIsLoading(false);
      return;
    }

    try {
      // Confirmar el pago
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret, 
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        setError(paymentError.message || 'Error al procesar el pago');
        toast({
          title: 'Error de pago',
          description: paymentError.message || 'Ha ocurrido un error al procesar tu pago',
          variant: 'destructive'
        });
      } else if (paymentIntent.status === 'succeeded') {
        // Actualizar el estado de la cita en la base de datos
        const response = await apiRequest('POST', `/api/appointments/${appointmentId}/pay`, {
          paymentIntentId: paymentIntent.id
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al actualizar el estado de pago de la cita');
        }

        toast({
          title: 'Pago completado',
          description: 'El pago se ha procesado correctamente'
        });
        
        // Invalidar las citas para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
        
        // Notificar éxito
        onPaymentSuccess();
      }
    } catch (err: any) {
      console.error('Error al procesar el pago:', err);
      setError(err.message || 'Error al procesar el pago');
      toast({
        title: 'Error',
        description: err.message || 'Ha ocurrido un error al procesar el pago',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-md bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>Pagar {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)}</>
          )}
        </Button>
      </div>
    </form>
  );
};

type StripePaymentFormProps = {
  appointmentId: number;
  amount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
};

export const StripePaymentForm = ({ 
  appointmentId, 
  amount, 
  onPaymentSuccess,
  onCancel
}: StripePaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        setIsLoading(true);
        // Convertir amount (euros) a céntimos para el backend
        const amountInCents = Math.round(amount * 100);
        
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          appointmentId,
          amount: amountInCents
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear la intención de pago');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error al obtener intención de pago:', err);
        setError(err.message || 'Error al configurar el pago');
        toast({
          title: 'Error',
          description: err.message || 'Error al preparar el pago',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    getPaymentIntent();
  }, [appointmentId, amount, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 py-4">
        <p>Ha ocurrido un error al preparar el pago:</p>
        <p className="font-medium">{error}</p>
        <Button 
          onClick={onCancel}
          className="mt-4"
          variant="outline"
        >
          Volver
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-amber-600 py-4">
        No se pudo inicializar el sistema de pago. Por favor, inténtelo de nuevo más tarde.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm 
        clientSecret={clientSecret} 
        appointmentId={appointmentId} 
        amount={amount}
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};