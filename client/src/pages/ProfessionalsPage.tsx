import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/reviews/StarRating";
import { Loader2, MapPin, Search, Star, Phone, Mail, UserPlus, MessageSquareText, Calendar, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function ProfessionalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProfessionals, setFilteredProfessionals] = useState<User[]>([]);

  const { data: professionals, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/professionals"],
    queryFn: () => 
      apiRequest("GET", "/api/users/professionals")
        .then(res => res.json()),
    enabled: !!user
  });

  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ["/api/connections"],
    queryFn: () => 
      apiRequest("GET", "/api/connections")
        .then(res => res.json()),
    enabled: !!user
  });

  const createConnectionMutation = useMutation({
    mutationFn: (data: { clientId: number, professionalId: number, status: string }) => 
      apiRequest("POST", "/api/connections", data)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Solicitud enviada",
        description: "La solicitud de conexión ha sido enviada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. " + error,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (professionals) {
      let filtered = [...professionals];
      
      // Filtrar por tipo de profesional
      if (activeTab !== "all") {
        filtered = filtered.filter(prof => prof.userType === activeTab);
      }
      
      // Filtrar por término de búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(prof => 
          prof.fullName.toLowerCase().includes(term) || 
          prof.description?.toLowerCase().includes(term) ||
          prof.address?.toLowerCase().includes(term)
        );
      }
      
      setFilteredProfessionals(filtered);
    }
  }, [professionals, activeTab, searchTerm]);

  const isConnected = (professionalId: number) => {
    if (!connections) return false;
    return connections.some((conn: any) => 
      conn.professionalId === professionalId && 
      (conn.status === "accepted" || conn.status === "pending")
    );
  };

  const sendConnectionRequest = (professionalId: number) => {
    if (!user) return;
    
    createConnectionMutation.mutate({
      clientId: user.id,
      professionalId,
      status: "pending"
    });
  };

  const getConnectionStatus = (professionalId: number) => {
    if (!connections) return null;
    const connection = connections.find((conn: any) => conn.professionalId === professionalId);
    return connection ? connection.status : null;
  };

  const handleStartChat = (professionalId: number) => {
    navigate(`/messages/${professionalId}`);
  };

  const handleScheduleAppointment = (professionalId: number) => {
    navigate(`/appointments/new?professionalId=${professionalId}`);
  };

  const handleViewReviews = (professionalId: number) => {
    navigate(`/reviews/${professionalId}`);
  };

  if (isLoading || isLoadingConnections) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Component to show professional rating from actual reviews
  const ProfessionalRating = ({ professionalId }: { professionalId: number }) => {
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
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Directorio de Profesionales</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, especialidad o ubicación..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="vet">Veterinarios</TabsTrigger>
          <TabsTrigger value="farrier">Herradores</TabsTrigger>
          <TabsTrigger value="trainer">Entrenadores</TabsTrigger>
          <TabsTrigger value="dentist">Dentistas</TabsTrigger>
          <TabsTrigger value="physio">Fisioterapeutas</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredProfessionals && filteredProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => {
            const connectionStatus = getConnectionStatus(professional.id);
            
            return (
              <Card key={professional.id} className="overflow-hidden">
                <div className="flex bg-muted p-6">
                  <div className="mr-4">
                    <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-background">
                      <img
                        src={professional.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                        alt={professional.fullName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{professional.fullName}</h2>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="font-normal capitalize mr-2">
                        {professional.userType === "vet" ? "Veterinario" :
                         professional.userType === "farrier" ? "Herrador" :
                         professional.userType === "trainer" ? "Entrenador" :
                         professional.userType === "dentist" ? "Dentista" :
                         professional.userType === "physio" ? "Fisioterapeuta" :
                         professional.userType}
                      </Badge>
                    </div>
                    <ProfessionalRating professionalId={professional.id} />
                  </div>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                      <span>{professional.address || "Sin ubicación especificada"}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-muted-foreground mr-2" />
                      <span>{professional.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                      <span>{professional.email}</span>
                    </div>
                    {professional.description && (
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground">{professional.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between flex-wrap gap-2">
                  <div className="flex gap-2 flex-wrap">
                    {!isConnected(professional.id) ? (
                      <Button
                        onClick={() => sendConnectionRequest(professional.id)}
                        disabled={createConnectionMutation.isPending}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Conectar
                      </Button>
                    ) : connectionStatus === "accepted" ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => handleStartChat(professional.id)}
                        >
                          <MessageSquareText className="mr-2 h-4 w-4" />
                          Enviar Mensaje
                        </Button>
                        <Button onClick={() => handleScheduleAppointment(professional.id)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Programar Cita
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" disabled>
                        Solicitud Pendiente
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewReviews(professional.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Reseñas
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No se encontraron profesionales con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
}