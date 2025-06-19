import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import HorseList from "@/components/dashboard/HorseList";
import AppointmentList from "@/components/dashboard/AppointmentList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Horse, Appointment, User, Connection, MessagePreview } from "@/lib/types";
import { Calendar, Plus, MessageSquare, Users, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface ClientDashboardPageProps {
  user: User;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function ClientDashboardPage({ user, logout }: ClientDashboardPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch recent horses
  const { data: horses, isLoading: isLoadingHorses } = useQuery<Horse[]>({
    queryKey: ['/api/horses'],
  });

  // Fetch upcoming appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Fetch connections
  const { data: connections, isLoading: isLoadingConnections } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  // Fetch recent messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<MessagePreview[]>({
    queryKey: ['/api/messages'],
  });

  // Filter for dashboard overview
  const upcomingAppointments = appointments?.filter(
    app => app.status === 'confirmed' && new Date(app.date) > new Date()
  ).slice(0, 3);

  const pendingConnections = connections?.filter(
    conn => conn.status === 'pending'
  );

  const acceptedConnections = connections?.filter(
    conn => conn.status === 'accepted'
  );

  const recentMessages = messages?.slice(0, 3);

  // Loading state
  const isLoading = isLoadingHorses || isLoadingAppointments || 
                    isLoadingConnections || isLoadingMessages;

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-bold text-equi-charcoal">
            Hola, {user.fullName}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="horses">Mis Caballos</TabsTrigger>
            <TabsTrigger value="appointments">Citas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Mis Caballos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHorses ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-equi-green">{horses?.length || 0}</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-equi-green">
                      {upcomingAppointments?.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingConnections ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-equi-green">
                      {acceptedConnections?.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Horses Section */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mis Caballos</CardTitle>
                    <CardDescription>Gestiona tus caballos</CardDescription>
                  </div>
                  <Link href="/horses">
                    <Button variant="ghost" size="sm">
                      Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHorses ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, idx) => (
                      <Skeleton key={idx} className="h-36 w-full" />
                    ))}
                  </div>
                ) : horses?.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No tienes caballos registrados</p>
                    <Link href="/horses">
                      <Button className="bg-equi-green hover:bg-equi-light-green">
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Caballo
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {horses.slice(0, 3).map(horse => (
                      <Link key={horse.id} href={`/horses/${horse.id}`}>
                        <div className="bg-equi-cream rounded-lg p-4 cursor-pointer hover:shadow-md transition">
                          <div 
                            className="h-24 bg-cover bg-center rounded-lg mb-3" 
                            style={{ 
                              backgroundImage: horse.profileImage
                                ? `url(${horse.profileImage})`
                                : "url('https://images.unsplash.com/photo-1553284965-99ba659f48c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')"
                            }}
                          />
                          <h4 className="font-semibold">{horse.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {horse.breed} • {horse.age} años
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Próximas Citas</CardTitle>
                    <CardDescription>Tus próximas citas programadas</CardDescription>
                  </div>
                  <Link href="/appointments">
                    <Button variant="ghost" size="sm">
                      Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, idx) => (
                      <Skeleton key={idx} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !upcomingAppointments?.length ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No tienes citas programadas</p>
                    <Link href="/appointments/new">
                      <Button className="bg-equi-green hover:bg-equi-light-green">
                        <Calendar className="mr-2 h-4 w-4" />
                        Programar Cita
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map(appointment => (
                      <div 
                        key={appointment.id}
                        className="border-l-4 border-equi-green bg-equi-cream rounded-r-lg p-3 appointment-hover transition-all"
                      >
                        <div className="flex justify-between">
                          <p className="font-semibold">{appointment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString()} 
                          </p>
                        </div>
                        <p className="text-sm">
                          {appointment.otherUser?.fullName || "Profesional"} • 
                          {new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Messages & Connections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Messages */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Mensajes Recientes</CardTitle>
                      <CardDescription>Tus conversaciones recientes</CardDescription>
                    </div>
                    <Link href="/messages">
                      <Button variant="ghost" size="sm">
                        Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingMessages ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, idx) => (
                        <Skeleton key={idx} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !recentMessages?.length ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No tienes mensajes recientes</p>
                      <Link href="/messages">
                        <Button className="bg-equi-green hover:bg-equi-light-green">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Ver Mensajes
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentMessages.map(messagePreview => (
                        <Link 
                          key={messagePreview.otherUser.id}
                          href={`/messages/${messagePreview.otherUser.id}`}
                        >
                          <div className="flex items-center py-2 cursor-pointer hover:bg-muted/20 rounded-md px-2 transition-colors">
                            <div className="w-8 h-8 bg-equi-green text-white rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-semibold">
                                {messagePreview.otherUser.fullName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3 flex-grow">
                              <div className="flex justify-between">
                                <p className="font-semibold">{messagePreview.otherUser.fullName}</p>
                                {messagePreview.unreadCount > 0 && (
                                  <span className="bg-equi-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {messagePreview.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {messagePreview.latestMessage.content}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Professional Connections */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Conexiones</CardTitle>
                      <CardDescription>Tus profesionales conectados</CardDescription>
                    </div>
                    <Link href="/connections">
                      <Button variant="ghost" size="sm">
                        Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingConnections ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, idx) => (
                        <Skeleton key={idx} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !acceptedConnections?.length && !pendingConnections?.length ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No tienes conexiones</p>
                      <Link href="/professionals">
                        <Button className="bg-equi-green hover:bg-equi-light-green">
                          <Users className="mr-2 h-4 w-4" />
                          Buscar Profesionales
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingConnections && pendingConnections.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-sm">
                          <p>Tienes {pendingConnections.length} solicitudes pendientes</p>
                          <Link href="/connections">
                            <a className="text-equi-green font-medium hover:underline">
                              Ver solicitudes
                            </a>
                          </Link>
                        </div>
                      )}
                      
                      {acceptedConnections && acceptedConnections.slice(0, 3).map(connection => {
                        const professional = connection.otherUser;
                        if (!professional) return null;
                        
                        return (
                          <div key={connection.id} className="flex items-center py-2">
                            <div className="w-8 h-8 bg-equi-brown text-white rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-semibold">
                                {professional.fullName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="font-semibold">{professional.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {professional.userType && 
                                  (professional.userType.charAt(0).toUpperCase() + professional.userType.slice(1))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Horses Tab */}
          <TabsContent value="horses">
            <HorseList userId={user.id} />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <AppointmentList user={user} />
          </TabsContent>
        </Tabs>
      </div>
  );
}
