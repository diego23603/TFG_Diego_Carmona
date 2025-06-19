import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";

type ConnectAccountState = {
  required: boolean;
  status?: 'not_created' | 'incomplete';
  message?: string;
};

type AccountStatus = {
  isVerified: boolean;
  account: {
    charges_enabled: boolean;
    details_submitted: boolean;
    payouts_enabled: boolean;
    requirements: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
    };
  };
};

type ConnectAccountProps = {
  showTitle?: boolean;
};

export default function ConnectAccountStatus({ showTitle = true }: ConnectAccountProps) {
  const { toast } = useToast();
  const [redirecting, setRedirecting] = useState<boolean>(false);

  // Verificar si el profesional necesita configurar su cuenta Connect
  const { data: requirementData, isLoading: requirementLoading } = useQuery({
    queryKey: ['/api/connect/check-requirement'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/connect/check-requirement');
      if (!res.ok) throw new Error('Error al verificar requisitos de cuenta Connect');
      return res.json() as Promise<ConnectAccountState>;
    },
  });

  // Obtener el estado detallado de la cuenta si ya existe
  const { data: accountStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/connect/account-status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/connect/account-status');
      if (!res.ok) {
        // Si la cuenta no existe, no es un error crítico
        if (res.status === 403 || res.status === 404) {
          return null;
        }
        throw new Error('Error al obtener estado de cuenta Connect');
      }
      return res.json() as Promise<AccountStatus>;
    },
    enabled: requirementData?.status === 'incomplete',
  });

  // Crear una cuenta Connect para el profesional
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/connect/create-account');
      if (!res.ok) throw new Error('Error al crear cuenta Connect');
      return res.json();
    },
    onSuccess: async (data) => {
      setRedirecting(true);
      toast({
        title: "Cuenta creada",
        description: "Redirigiendo al portal de Stripe para completar la configuración...",
      });
      
      // Invalidar el cache para actualizar el estado
      queryClient.invalidateQueries({ queryKey: ['/api/connect/check-requirement'] });
      
      // Redirigir al portal de Stripe
      setTimeout(() => {
        window.location.href = data.accountLinkUrl;
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear cuenta: ${error.message}`,
        variant: "destructive",
      });
      setRedirecting(false);
    },
  });

  // Generar un nuevo link de onboarding
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
      setRedirecting(false);
    },
  });

  // Manejar la creación de cuenta
  const handleCreateAccount = () => {
    setRedirecting(true);
    createAccountMutation.mutate();
  };

  // Manejar la continuación del onboarding
  const handleContinueOnboarding = () => {
    setRedirecting(true);
    generateLinkMutation.mutate();
  };

  // Mostrar un loader mientras cargamos los datos iniciales
  if (requirementLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Si no se requiere configuración, no mostrar nada
  if (!requirementData?.required) {
    return null;
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle>Configuración de pagos</CardTitle>
          <CardDescription>Configura tu cuenta bancaria para recibir pagos</CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Acción requerida</AlertTitle>
          <AlertDescription>
            {requirementData?.message || "Es necesario configurar su cuenta bancaria para recibir pagos directamente de los clientes"}
          </AlertDescription>
        </Alert>

        {accountStatus && !accountStatus.isVerified && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Estado de la cuenta:</h4>
            <ul className="space-y-1 text-sm ml-5 list-disc">
              {!accountStatus.account.details_submitted && (
                <li>Información incompleta</li>
              )}
              {!accountStatus.account.charges_enabled && (
                <li>Procesamiento de pagos no habilitado</li>
              )}
              {!accountStatus.account.payouts_enabled && (
                <li>Transferencias bancarias no habilitadas</li>
              )}
              {accountStatus.account.requirements?.currently_due?.length > 0 && (
                <li>
                  Requisitos pendientes: {accountStatus.account.requirements.currently_due.length}
                </li>
              )}
            </ul>
          </div>
        )}

        {accountStatus?.isVerified && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Cuenta verificada</AlertTitle>
            <AlertDescription>
              Su cuenta bancaria está correctamente configurada y lista para recibir pagos.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        {requirementData?.status === 'not_created' ? (
          <Button 
            onClick={handleCreateAccount} 
            disabled={redirecting || createAccountMutation.isPending}
          >
            {(redirecting || createAccountMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Configurar cuenta bancaria
          </Button>
        ) : (
          <Button 
            onClick={handleContinueOnboarding} 
            disabled={redirecting || generateLinkMutation.isPending}
          >
            {(redirecting || generateLinkMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar configuración
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}