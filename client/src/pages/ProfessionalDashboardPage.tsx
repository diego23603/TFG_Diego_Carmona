import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProfessionalSchedule from "@/components/dashboard/ProfessionalSchedule";
import ProfessionalAnalytics from "@/components/dashboard/ProfessionalAnalytics";
import ConnectionRequests from "@/components/dashboard/ConnectionRequests";
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
import { Appointment, User, Connection, MessagePreview } from "@/lib/types";
import { Calendar, MessageSquare, Users, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface ProfessionalDashboardPageProps {
  user: User;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function ProfessionalDashboardPage({ user, logout }: ProfessionalDashboardPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
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
  const todayAppointments = appointments?.filter(app => {
    const appointmentDate = new Date(app.date);
    const today = new Date();
    return appointmentDate.getDate() === today.getDate() &&
           appointmentDate.getMonth() === today.getMonth() &&
           appointmentDate.getFullYear() === today.getFullYear() &&
           app.status === 'confirmed';
  });

  const pendingAppointments = appointments?.filter(
    app => app.status === 'pending'
  );

  const pendingConnections = connections?.filter(
    conn => conn.status === 'pending'
  );

  const acceptedConnections = connections?.filter(
    conn => conn.status === 'accepted'
  );

  const recentMessages = messages?.slice(0, 3);

  // Loading state
  const isLoading = isLoadingAppointments || isLoadingConnections || isLoadingMessages;

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
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            <TabsTrigger value="connections">Conexiones</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-equi-green">{todayAppointments?.length || 0}</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-equi-gold">{pendingAppointments?.length || 0}</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Clientes</CardTitle>
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
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingConnections ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-equi-brown">
                      {pendingConnections?.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Agenda de Hoy</CardTitle>
                    <CardDescription>Tus citas para hoy</CardDescription>
                  </div>
                  <Link href="/schedule">
                    <Button variant="ghost" size="sm">
                      Ver calendario <ChevronRight className="ml-1 h-4 w-4" />
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
                ) : !todayAppointments?.length ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No tienes citas programadas para hoy</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map(appointment => (
                      <div 
                        key={appointment.id}
                        className="flex items-center py-3 border-b border-gray-100"
                      >
                        <div className="w-12 text-center text-sm mr-3">
                          <div className="font-semibold">
                            {new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className="flex-grow bg-equi-cream p-2 rounded">
                          <div className="flex justify-between">
                            <p className="font-semibold">{appointment.title}</p>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Confirmado</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {appointment.horse?.name || "Caballo"} - 
                            {appointment.client?.fullName || "Cliente"} • 
                            {appointment.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Messages & Pending Requests */}
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
                        <Button className="bg-equi-brown hover:bg-equi-light-brown">
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
                                  <span className="bg-equi-brown text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
              
              {/* Pending Connection Requests */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Solicitudes Pendientes</CardTitle>
                      <CardDescription>Solicitudes de conexión</CardDescription>
                    </div>
                    <Link href="/connections">
                      <Button variant="ghost" size="sm">
                        Ver todas <ChevronRight className="ml-1 h-4 w-4" />
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
                  ) : !pendingConnections?.length ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No tienes solicitudes pendientes</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingConnections.slice(0, 3).map(connection => {
                        const client = connection.otherUser;
                        if (!client) return null;
                        
                        return (
                          <div key={connection.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-equi-green text-white rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="font-semibold">
                                  {client.fullName.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="font-semibold">{client.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Solicitud recibida
                                </p>
                              </div>
                            </div>
                            <Link href="/connections">
                              <Button size="sm" className="bg-equi-brown hover:bg-equi-light-brown">
                                Responder
                              </Button>
                            </Link>
                          </div>
                        );
                      })}
                      
                      {pendingConnections.length > 3 && (
                        <div className="text-center">
                          <Link href="/connections">
                            <Button variant="link" className="text-equi-brown">
                              Ver {pendingConnections.length - 3} solicitudes más
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Pending Appointments */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Solicitudes de Citas</CardTitle>
                    <CardDescription>Citas pendientes de confirmación</CardDescription>
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
                ) : !pendingAppointments?.length ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No tienes solicitudes de citas pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingAppointments.slice(0, 3).map(appointment => (
                      <div 
                        key={appointment.id}
                        className="border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg p-3 transition-all"
                      >
                        <div className="flex justify-between">
                          <p className="font-semibold">{appointment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString()} 
                          </p>
                        </div>
                        <p className="text-sm">
                          {appointment.horse?.name || "Caballo"} - 
                          {appointment.client?.fullName || "Cliente"} • 
                          {new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <div className="mt-2 flex justify-end gap-2">
                          <Link href="/appointments">
                            <Button 
                              size="sm"
                              className="bg-equi-brown hover:bg-equi-light-brown"
                            >
                              Responder
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                    
                    {pendingAppointments.length > 3 && (
                      <div className="text-center">
                        <Link href="/appointments">
                          <Button variant="link" className="text-equi-brown">
                            Ver {pendingAppointments.length - 3} solicitudes más
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <ProfessionalSchedule user={user} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <ProfessionalAnalytics user={user} />
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <ConnectionRequests user={user} />
          </TabsContent>
        </Tabs>
    </div>
  );
}
