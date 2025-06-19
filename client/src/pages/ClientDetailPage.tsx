import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ArrowLeft,
  MessageCircle
} from "lucide-react";
import { Link } from "wouter";

interface ClientDetailPageProps {
  user: User;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function ClientDetailPage({ user }: ClientDetailPageProps) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const clientId = parseInt(params.id as string, 10);

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/users/${clientId}`],
    queryFn: () => apiRequest("GET", `/api/users/${clientId}`).then(res => res.json()),
    enabled: !isNaN(clientId)
  });

  const { data: horses, isLoading: isLoadingHorses } = useQuery({
    queryKey: [`/api/horses/owner/${clientId}`],
    queryFn: () => apiRequest("GET", `/api/horses/owner/${clientId}`).then(res => res.json()),
    enabled: !isNaN(clientId)
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: [`/api/appointments/client/${clientId}`],
    queryFn: () => apiRequest("GET", `/api/appointments/client/${clientId}`).then(res => res.json()),
    enabled: !isNaN(clientId)
  });

  if (isNaN(clientId)) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">ID de cliente inválido</h3>
          <p className="text-muted-foreground mb-4">
            El ID del cliente proporcionado no es válido
          </p>
          <Button 
            onClick={() => setLocation("/connections")}
            className="bg-equi-green hover:bg-equi-light-green"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Conexiones
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
          <p className="text-muted-foreground mb-4">
            No se pudo encontrar la información del cliente solicitado
          </p>
          <Button 
            onClick={() => setLocation("/connections")}
            className="bg-equi-green hover:bg-equi-light-green"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Conexiones
          </Button>
        </div>
      </div>
    );
  }

  const recentAppointments = appointments?.slice(0, 5) || [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/connections")}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-display font-bold text-equi-charcoal">
            Detalles del Cliente
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/messages/${client.id}`}>
            <Button size="sm" variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" />
              Mensaje
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={client.profileImage} />
                <AvatarFallback className="bg-equi-green text-white text-lg">
                  {client.fullName?.substring(0, 2).toUpperCase() || client.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{client.fullName || client.username}</CardTitle>
              <Badge variant="secondary" className="mt-2">
                Cliente
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              
              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.address}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Miembro desde {new Date(client.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="horses" className="space-y-4">
            <TabsList>
              <TabsTrigger value="horses">
                🐴 Caballos ({horses?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <Calendar className="mr-2 h-4 w-4" />
                Citas Recientes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="horses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Caballos del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHorses ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : horses?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-4">🐴</div>
                      <p>Este cliente aún no ha registrado caballos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {horses?.map((horse: any) => (
                        <div key={horse.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <h4 className="font-semibold">{horse.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {horse.breed} • {horse.age} años
                            </p>
                          </div>
                          <Link href={`/horses/${horse.id}`}>
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Citas Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : recentAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay citas registradas con este cliente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentAppointments.map((appointment: any) => (
                        <div key={appointment.id} className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{appointment.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(appointment.date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.time}
                              </p>
                            </div>
                            <Badge variant={
                              appointment.status === 'completed' ? 'default' :
                              appointment.status === 'confirmed' ? 'secondary' :
                              appointment.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {appointment.status === 'completed' ? 'Completada' :
                               appointment.status === 'confirmed' ? 'Confirmada' :
                               appointment.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                            </Badge>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}