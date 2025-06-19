import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth";

// Lista de rutas permitidas para profesionales sin suscripción
const ALLOWED_ROUTES = [
  "/subscription-checkout",
  "/login",
  "/",
  "/register",
  "/logout"
];

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Verificar que estamos en una ruta permitida
  const isAllowedRoute = ALLOWED_ROUTES.some(route => {
    // Comparamos solo la parte inicial si la ruta tiene parámetros
    if (route.endsWith("*")) {
      const basePath = route.slice(0, -1);
      return location.startsWith(basePath);
    }
    // Verificamos si la ruta está en la lista de permitidas
    return location === route || location.startsWith(`${route}?`);
  });

  useEffect(() => {
    // Solo aplicar la restricción a profesionales
    if (user && user.isProfessional) {
      // Verificar si el profesional tiene una suscripción
      const hasSubscription = user.subscriptionType && user.subscriptionType !== "";
      
      // Si no tiene suscripción y no está en una ruta permitida, redirigir
      if (!hasSubscription && !isAllowedRoute) {
        console.log("Profesional sin suscripción detectado, redirigiendo a checkout");
        navigate("/subscription-checkout?plan=basic");
      }
    }
  }, [user, location, navigate, isAllowedRoute]);

  return <>{children}</>;
}