import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/reviews/StarRating";
import { 
  MessageSquare, 
  Calendar, 
  Star,
  Stethoscope,
  Hammer,
  Activity,
  Scissors,
  Dumbbell,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Trash2,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfessionalListProps {
  user: User;
}

interface Connection {
  id: number;
  status: string;
  clientId: number;
  professionalId: number;
  createdAt: string;
  otherUser: User;
}

const getProfessionalIcon = (userType: string) => {
  switch (userType) {
    case 'vet':
      return <Stethoscope className="h-5 w-5 text-equi-green" />;
    case 'farrier':
      return <Hammer className="h-5 w-5 text-equi-brown" />;
    case 'physiotherapist':
      return <Activity className="h-5 w-5 text-equi-light-green" />;
    case 'dentist':
      return <Scissors className="h-5 w-5 text-equi-gold" />;
    case 'trainer':
      return <Dumbbell className="h-5 w-5 text-equi-blue" />;
    default:
      return <Stethoscope className="h-5 w-5 text-gray-500" />;
  }
};

const getUserTypeLabel = (userType: string) => {
  switch (userType) {
    case 'vet':
      return 'Veterinario';
    case 'farrier':
      return 'Herrador';
    case 'physiotherapist':
      return 'Fisioterapeuta';
    case 'dentist':
      return 'Dentista Equino';
    case 'trainer':
      return 'Entrenador';
    default:
      return 'Profesional';
  }
};

// Componente para mostrar la calificación de un profesional
function ProfessionalRating({ professionalId }: { professionalId: number }) {
  const { data: reviews } = useQuery({
    queryKey: ["/api/professionals", professionalId, "reviews"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/professionals/${professionalId}/reviews`);
      return response.json();
    }
  });

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="w-3 h-3" />
        Sin reseñas
      </div>
    );
  }

  const averageRating = reviews.reduce((acc: number, review: any) => acc + review.rating, 0) / reviews.length;

  return (
    <div className="flex items-center gap-1 text-xs">
      <StarRating rating={Math.round(averageRating)} size="sm" />
      <span className="text-muted-foreground">
        {Math.round(averageRating * 10) / 10} ({reviews.length})
      </span>
    </div>
  );
}

export default function ProfessionalList({ user }: ProfessionalListProps) {
  const { toast } = useToast();

  const { data: connections, isLoading } = useQuery({
    queryKey: ["/api/connections"],
    queryFn: () => apiRequest("GET", "/api/connections").then(res => res.json()),
    enabled: !!user
  });

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: number) => 
      apiRequest("DELETE", `/api/connections/${connectionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Conexión eliminada",
        description: "La conexión con el profesional ha sido eliminada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la conexión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Filtrar solo las conexiones aceptadas donde el usuario es cliente
  const acceptedConnections = connections?.filter(
    (connection: Connection) => 
      connection.status === 'accepted' && connection.clientId === user.id
  ) || [];

  const handleDisconnect = (connectionId: number) => {
    disconnectMutation.mutate(connectionId);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (acceptedConnections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Stethoscope className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No tienes profesionales conectados</h3>
        <p className="text-muted-foreground mb-6">
          Busca y conecta con profesionales para comenzar a gestionar los servicios de tus caballos.
        </p>
        <Link href="/professionals">
          <Button className="bg-equi-green hover:bg-equi-light-green">
            Buscar Profesionales
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {acceptedConnections.length} profesional{acceptedConnections.length !== 1 ? 'es' : ''} conectado{acceptedConnections.length !== 1 ? 's' : ''}
        </p>
        <Link href="/professionals">
          <Button variant="outline" size="sm">
            Buscar más profesionales
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {acceptedConnections.map((connection: Connection) => {
          const professional = connection.otherUser;
          if (!professional) return null;

          return (
            <Card key={connection.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={professional.profileImage ?? undefined} />
                      <AvatarFallback className="bg-equi-green text-white">
                        {professional.fullName?.substring(0, 2).toUpperCase() || 'PR'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{professional.fullName}</CardTitle>
                      <div className="flex items-center gap-2 mb-1">
                        {getProfessionalIcon(professional.userType)}
                        <Badge variant="secondary" className="text-xs">
                          {getUserTypeLabel(professional.userType)}
                        </Badge>
                      </div>
                      <ProfessionalRating professionalId={professional.id} />
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/messages/${professional.id}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Enviar mensaje
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/appointments/new">
                          <Calendar className="mr-2 h-4 w-4" />
                          Solicitar cita
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desconectar
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar conexión?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar la conexión con {professional.fullName}? 
                              Esta acción no se puede deshacer y perderás el acceso a su historial de servicios.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDisconnect(connection.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar conexión
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {professional.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {professional.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {professional.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{professional.phone}</span>
                    </div>
                  )}
                  {professional.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{professional.email}</span>
                    </div>
                  )}
                  {professional.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{professional.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>Conectado desde {new Date(connection.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Link href={`/messages/${professional.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Mensaje
                    </Button>
                  </Link>
                  <Link href="/appointments/new">
                    <Button size="sm" className="w-full bg-equi-green hover:bg-equi-light-green">
                      <Calendar className="mr-1 h-4 w-4" />
                      Cita
                    </Button>
                  </Link>
                  <Link href={`/reviews/${professional.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-1 h-4 w-4" />
                      Reseñas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}