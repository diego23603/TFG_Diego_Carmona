import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import ProfessionalDashboardPage from "@/pages/ProfessionalDashboardPage";
import HorseDetailPage from "@/pages/HorseDetailPage";
import MessagesPage from "@/pages/MessagesPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import ProfilePage from "@/pages/ProfilePage";
import MyHorsesPage from "@/pages/MyHorsesPage";
import HorseHistoryPage from "@/pages/HorseHistoryPage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import StatisticsPage from "@/pages/StatisticsPage";
import AdminStatisticsPage from "@/pages/AdminStatisticsPage";
import CalendarPage from "@/pages/CalendarPage";
import NewAppointmentPage from "@/pages/NewAppointmentPage";
import SubscriptionCheckoutPage from "@/pages/SubscriptionCheckoutPage";
import PaymentPage from "@/pages/PaymentPage";
import ReviewsPage from "@/pages/ReviewsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import StripeConnectSuccessPage from "@/pages/professional/StripeConnectSuccessPage";
import StripeConnectRefreshPage from "@/pages/professional/StripeConnectRefreshPage";

import AppLayout from "@/components/layout/AppLayout";

// Componente de protección de rutas
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) => {
  const { user, isLoading, logout } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Para profesionales, verificar si tienen una suscripción activa
  if (user.isProfessional) {
    const hasSubscription = user.subscriptionType && user.subscriptionType !== "";
    const isSubscriptionPage = rest.path === "/subscription-checkout";
    
    // Si es un profesional sin suscripción y no está intentando acceder a la página de suscripción
    if (!hasSubscription && !isSubscriptionPage) {
      console.log("Profesional sin suscripción detectado, redirigiendo a checkout");
      return <Redirect to="/subscription-checkout?plan=basic" />;
    }
  }
  
  return (
    <Route
      {...rest}
      component={(props: any) => (
        <AppLayout>
          <Component {...props} user={user} logout={logout} />
        </AppLayout>
      )}
    />
  );
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={() => {
        const { user } = useAuth();
        // Conversión de tipo explícita para manejar discrepancias de tipo
        const safeUser = user as any;
        return <RegisterPage user={safeUser} />;
      }} />
      
      {/* Rutas protegidas */}
      <ProtectedRoute path="/dashboard" component={
        (props: any) => {
          const { user } = useAuth();
          if (user?.isProfessional) {
            return <ProfessionalDashboardPage {...props} />;
          } else {
            return <ClientDashboardPage {...props} />;
          }
        }
      } />
      
      <ProtectedRoute path="/horses" component={MyHorsesPage} />
      <ProtectedRoute path="/horses/:id" component={HorseDetailPage} />
      <ProtectedRoute path="/horse-history" component={HorseHistoryPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute 
        path="/messages/:id" 
        component={(props: any) => {
          const id = parseInt(props.params.id as string, 10);
          if (isNaN(id)) {
            return <Redirect to="/messages" />;
          }
          return <MessagesPage {...props} otherUserId={id} />;
        }} 
      />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />
      <ProtectedRoute path="/appointments/new" component={NewAppointmentPage} />
      <ProtectedRoute path="/payment/:id" component={PaymentPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/connections" component={ConnectionsPage} />
      <ProtectedRoute 
        path="/client-details/:id" 
        component={(props: any) => {
          const id = parseInt(props.params.id as string, 10);
          if (isNaN(id)) {
            return <Redirect to="/connections" />;
          }
          return <ClientDetailPage {...props} />;
        }} 
      />
      <ProtectedRoute path="/professionals" component={ProfessionalsPage} />
      <ProtectedRoute path="/reviews/:professionalId" component={ReviewsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/statistics" component={StatisticsPage} />
      <ProtectedRoute path="/admin/statistics" component={AdminStatisticsPage} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <ProtectedRoute path="/subscription-checkout" component={SubscriptionCheckoutPage} />
      
      {/* Rutas para Stripe Connect */}
      <ProtectedRoute path="/professional/stripe-connect-success" component={StripeConnectSuccessPage} />
      <ProtectedRoute path="/professional/stripe-connect-refresh" component={StripeConnectRefreshPage} />
      
      {/* Fallback a 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <SubscriptionGuard>
              <Router />
            </SubscriptionGuard>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
