import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Connection } from "@/lib/types";
import { Link } from "wouter";

interface ClientListProps {
  user: User;
}

export default function ClientList({ user }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch connections for this professional
  const { data: connections, isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter accepted connections for clients
  const acceptedConnections = connections?.filter(
    connection => connection.status === 'accepted' && connection.professionalId === user.id
  );

  // Filter clients by search query
  const filteredClients = acceptedConnections?.filter(
    connection => {
      if (!connection.otherUser) return false;
      
      const client = connection.otherUser;
      return client.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    }
  );

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-6">Mis Clientes</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredClients?.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">
            {searchQuery 
              ? "No se encontraron clientes que coincidan con tu búsqueda" 
              : "Aún no tienes clientes"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "Intenta con otros términos de búsqueda" 
              : "Tus clientes aparecerán aquí cuando aceptes solicitudes de conexión"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClients?.map((connection) => {
            const client = connection.otherUser;
            
            if (!client) return null;
            
            return (
              <Card key={connection.id} className="overflow-hidden transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={client.profileImage} />
                      <AvatarFallback className="bg-equi-green text-white">
                        {client.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{client.fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {client.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {client.phone}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link href={`/messages/${client.id}`}>
                            <Button 
                              size="sm"
                              variant="outline"
                            >
                              Mensaje
                            </Button>
                          </Link>
                          <Link href={`/client-details/${client.id}`}>
                            <Button 
                              size="sm"
                              className="bg-equi-green hover:bg-equi-light-green"
                            >
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
