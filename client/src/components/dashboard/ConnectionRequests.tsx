import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { USER_TYPE_LABELS, Connection, User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConnectionRequestsProps {
  user: User;
}

export default function ConnectionRequests({ user }: ConnectionRequestsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isProfessional = user.isProfessional;

  // Fetch all connections
  const { data: connections, isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update connection mutation
  const updateConnectionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/connections/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({
        title: "Solicitud actualizada",
        description: "La solicitud de conexión ha sido actualizada correctamente.",
      });
    },
    onError: (error) => {
      console.error("Error updating connection:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la solicitud. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Filter pending connections based on user type
  const pendingConnections = connections?.filter(
    connection => connection.status === 'pending' && (
      (isProfessional && connection.professionalId === user.id) ||
      (!isProfessional && connection.clientId === user.id)
    )
  );

  // Filter accepted connections based on user type
  const acceptedConnections = connections?.filter(
    connection => connection.status === 'accepted' && (
      (isProfessional && connection.professionalId === user.id) ||
      (!isProfessional && connection.clientId === user.id)
    )
  );

  const handleAction = (connectionId: number, status: 'accepted' | 'rejected') => {
    updateConnectionMutation.mutate({ id: connectionId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Connection Requests */}
      <div>
        <h3 className="text-lg font-display font-semibold mb-4">
          {isProfessional ? "Solicitudes Pendientes" : "Conexiones Pendientes"}
        </h3>
        {pendingConnections && pendingConnections.length > 0 ? (
          <div className="space-y-4">
            {pendingConnections.map(connection => {
              const otherUser = connection.otherUser;
              
              if (!otherUser) return null;
              
              return (
                <Card key={connection.id} className="overflow-hidden transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser.profileImage} />
                          <AvatarFallback className={isProfessional ? "bg-equi-brown" : "bg-equi-green"}>
                            {otherUser.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{otherUser.fullName}</p>
                            {otherUser.userType && (
                              <Badge variant="outline">
                                {USER_TYPE_LABELS[otherUser.userType as any]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Solicitud enviada: {format(new Date(connection.requestDate), "d MMMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      
                      {isProfessional && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleAction(connection.id, 'rejected')}
                            disabled={updateConnectionMutation.isPending}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Rechazar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-300 text-green-600 hover:bg-green-50"
                            onClick={() => handleAction(connection.id, 'accepted')}
                            disabled={updateConnectionMutation.isPending}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Aceptar
                          </Button>
                        </div>
                      )}
                      
                      {!isProfessional && (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              {isProfessional 
                ? "No tienes solicitudes de conexión pendientes" 
                : "No tienes conexiones pendientes"
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Active Connections */}
      <div>
        <h3 className="text-lg font-display font-semibold mb-4">Conexiones Activas</h3>
        {acceptedConnections && acceptedConnections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acceptedConnections.map(connection => {
              const otherUser = connection.otherUser;
              
              if (!otherUser) return null;
              
              return (
                <Card key={connection.id} className="overflow-hidden transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.profileImage} />
                        <AvatarFallback className={isProfessional ? "bg-equi-brown" : "bg-equi-green"}>
                          {otherUser.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{otherUser.fullName}</p>
                          {otherUser.userType && (
                            <Badge variant="outline">
                              {USER_TYPE_LABELS[otherUser.userType as any]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Conectado desde: {connection.responseDate 
                            ? format(new Date(connection.responseDate), "d MMMM yyyy", { locale: es }) 
                            : 'Fecha desconocida'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No tienes conexiones activas</p>
          </div>
        )}
      </div>
    </div>
  );
}
