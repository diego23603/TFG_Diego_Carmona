import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

export default function StripeConnectRefreshPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [redirecting, setRedirecting] = useState(false);

  // Mutación para generar un nuevo link de onboarding
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/connect/account-link');
      if (!res.ok) throw new Error('Error al generar link de onboarding');
      return res.json();
    },
    onSuccess: (data) => {
      setRedirecting(true);
      toast({
        title: "Link generado",
        description: "Redirigiendo al portal de Stripe para completar la configuración...",
      });
      
      setTimeout(() => {
        window.location.href = data.url;
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al generar link: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Manejar el reintento de onboarding
  const handleRetryOnboarding = () => {
    generateLinkMutation.mutate();
  };

  return (
    <div className="container max-w-3xl py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración de cuenta bancaria</CardTitle>
          <CardDescription>La sesión de configuración ha expirado o se ha cerrado</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Configuración incompleta</AlertTitle>
            <AlertDescription>
              La sesión para configurar su cuenta bancaria ha expirado o se ha cerrado. Es necesario reiniciar el proceso para completar la configuración.
            </AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter className="justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/profile')}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mi perfil
          </Button>
          
          <Button 
            onClick={handleRetryOnboarding}
            disabled={redirecting || generateLinkMutation.isPending}
          >
            {(redirecting || generateLinkMutation.isPending) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Reintentar configuración
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}