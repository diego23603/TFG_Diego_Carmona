import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function StripeConnectSuccessPage() {
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  // Verificar el estado de la cuenta después de volver del portal de Stripe
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/connect/account-status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/connect/account-status');
      if (!res.ok) throw new Error('Error al verificar estado de cuenta');
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading && status) {
      setChecking(false);
      setVerified(status.isVerified);
    }
  }, [isLoading, status]);

  return (
    <div className="container max-w-3xl py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración de cuenta bancaria</CardTitle>
          <CardDescription>Procesando información de la cuenta Stripe Connect</CardDescription>
        </CardHeader>
        
        <CardContent>
          {checking || isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-center text-lg">Verificando configuración de la cuenta...</p>
            </div>
          ) : verified ? (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>¡Configuración completada!</AlertTitle>
              <AlertDescription>
                Su cuenta bancaria ha sido configurada correctamente. Ahora puede recibir pagos directamente de los clientes.
                La comisión fija de la plataforma (0,99€ por transacción) será deducida automáticamente.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Configuración incompleta</AlertTitle>
              <AlertDescription>
                Aún hay pasos pendientes para completar la configuración de su cuenta bancaria. Revise los detalles en su perfil y siga las instrucciones.
              </AlertDescription>
            </Alert>
          )}
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
        </CardFooter>
      </Card>
    </div>
  );
}