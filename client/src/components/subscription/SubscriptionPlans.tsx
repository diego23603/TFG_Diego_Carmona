import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Feature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: Feature[];
  highlightedFeature?: string;
  isPopular?: boolean;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
}

const userTypeToPlans = {
  "Cliente": [
    {
      id: "basic",
      name: "Plan Básico",
      price: "Gratis",
      description: "Funcionalidades esenciales para propietarios de caballos",
      features: [
        { name: "Gestión de caballos", included: true },
        { name: "Programación de citas", included: true },
        { name: "Mensajería con profesionales", included: true },
        { name: "Historial médico y de servicios", included: true },
        { name: "Comisión de 5% por servicio", included: true },
      ],
    },
    {
      id: "premium",
      name: "Plan Premium",
      price: "15,00 €/mes",
      description: "Ventajas exclusivas para propietarios exigentes",
      isPopular: true,
      highlightedFeature: "Sin comisiones por servicios",
      features: [
        { name: "Todo lo del plan básico", included: true },
        { name: "Sin comisiones por servicios", included: true },
        { name: "Recordatorios avanzados", included: true },
        { name: "Estadísticas detalladas", included: true },
        { name: "Prioridad en búsquedas", included: true },
      ],
    }
  ],
  "Profesional": [
    {
      id: "basic",
      name: "Plan Básico",
      price: "25,00 €/mes",
      description: "Funcionalidades esenciales para profesionales",
      features: [
        { name: "Gestión de hasta 30 clientes", included: true },
        { name: "Calendario de citas", included: true },
        { name: "Mensajería con clientes", included: true },
        { name: "Comisión de 5% por servicio", included: true },
        { name: "Perfil profesional destacado", included: true },
      ],
    },
    {
      id: "premium",
      name: "Plan Premium",
      price: "49,99 €/mes",
      description: "Maximiza tus ingresos y alcance",
      isPopular: true,
      highlightedFeature: "Sin comisiones por servicios",
      features: [
        { name: "Clientes ilimitados", included: true },
        { name: "Sin comisiones por servicios", included: true },
        { name: "Estadísticas avanzadas", included: true },
        { name: "Prioridad en búsquedas", included: true },
        { name: "Herramientas de fidelización", included: true },
      ],
    }
  ]
};

function PlanCard({ plan, currentPlan, onSelect }: { 
  plan: Plan; 
  currentPlan: string;
  onSelect: (id: string) => void;
}) {
  const isActive = currentPlan === plan.id;
  const isBasic = plan.id === "basic";
  
  return (
    <Card className={`relative overflow-hidden ${plan.isPopular ? 'border-primary' : ''}`}>
      {plan.isPopular && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-tl-none rounded-br-none" variant="default">
            Popular
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {plan.name}
          {isActive && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              Plan actual
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="text-3xl font-bold">{plan.price}</div>
          {!isBasic && <div className="text-sm text-muted-foreground">por mes</div>}
        </div>
        
        {plan.highlightedFeature && (
          <div className="bg-primary/10 p-3 rounded-md mb-4 text-sm font-medium text-primary flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {plan.highlightedFeature}
          </div>
        )}
        
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300 mt-1 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm">{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          variant={isActive ? "outline" : plan.isPopular ? "default" : "outline"}
          disabled={isActive}
          onClick={() => onSelect(plan.id)}
        >
          {isActive ? 'Tu plan actual' : 'Seleccionar plan'}
          {!isActive && (
            <ChevronRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SubscriptionPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Determinar el tipo de usuario para mostrar los planes correctos
  const userType = user?.userType || "Cliente";
  const plans = userTypeToPlans[userType as keyof typeof userTypeToPlans] || userTypeToPlans.Cliente;
  
  // Obtener el plan actual del usuario
  const currentPlan = user?.subscriptionType || "basic";
  
  // Mutación para actualizar el plan básico (sin checkout)
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest("POST", "/api/subscription/update", { plan });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan actualizado",
        description: "Tu plan ha sido actualizado a básico correctamente",
      });
      // Recargar la página para reflejar los cambios
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar plan",
        description: error.message || "Ha ocurrido un error al actualizar tu plan",
        variant: "destructive",
      });
    },
  });
  
  // Redirección a la página de checkout para planes pagados
  const handlePremiumCheckout = (plan: string) => {
    // Navegar a la página de checkout con el plan seleccionado
    setLocation(`/subscription-checkout?plan=${plan}`);
  };
  
  // Mutación para cancelar la suscripción
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/cancel", {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción ha sido cancelada correctamente. Seguirá activa hasta el final del período de facturación.",
      });
      setShowCancelDialog(false);
      // Recargar la página para reflejar los cambios
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error al cancelar suscripción",
        description: error.message || "Ha ocurrido un error al cancelar tu suscripción",
        variant: "destructive",
      });
      setShowCancelDialog(false);
    },
  });
  
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    
    // Si el plan seleccionado es el básico (sin costo)
    if (planId === "basic") {
      updatePlanMutation.mutate(planId);
    } else {
      // Para planes pagados, redirigir a la página de checkout
      handlePremiumCheckout(planId);
    }
  };
  
  const isLoading = updatePlanMutation.isPending || cancelSubscriptionMutation.isPending;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tu plan de suscripción</h2>
          <p className="text-muted-foreground">
            {currentPlan === "basic" ? 
              "Estás en el plan básico" : 
              `Actualmente tienes el plan ${currentPlan}`}
          </p>
        </div>
        
        {currentPlan !== "basic" && (
          <Button 
            variant="outline" 
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading}
          >
            Cancelar suscripción
          </Button>
        )}
      </div>
      
      {/* Diálogo de confirmación para cancelar suscripción */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu suscripción actual seguirá activa hasta el final del período de facturación.
              Después, tu cuenta cambiará automáticamente al plan básico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>
      
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Procesando tu solicitud...</span>
        </div>
      )}
    </div>
  );
}