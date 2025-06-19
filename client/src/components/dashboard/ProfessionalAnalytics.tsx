import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Appointment } from "@/lib/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfessionalAnalyticsProps {
  user: User;
}

export default function ProfessionalAnalytics({ user }: ProfessionalAnalyticsProps) {
  // Fetch appointments for this professional
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate statistics
  const now = new Date();
  const lastWeekDate = subDays(now, 7);
  const lastMonthDate = subMonths(now, 1);

  // Total appointments
  const totalAppointments = appointments?.length || 0;
  
  // Appointments this week
  const appointmentsThisWeek = appointments?.filter(
    app => isAfter(new Date(app.date), lastWeekDate)
  ).length || 0;

  // Appointments this month
  const appointmentsThisMonth = appointments?.filter(
    app => isAfter(new Date(app.date), lastMonthDate)
  ).length || 0;

  // Completed appointments
  const completedAppointments = appointments?.filter(
    app => app.status === 'completed'
  ).length || 0;

  // Pending appointments
  const pendingAppointments = appointments?.filter(
    app => app.status === 'pending'
  ).length || 0;

  // Confirmed appointments
  const confirmedAppointments = appointments?.filter(
    app => app.status === 'confirmed'
  ).length || 0;

  // Cancelled appointments
  const cancelledAppointments = appointments?.filter(
    app => app.status === 'cancelled'
  ).length || 0;

  // Status distribution for pie chart
  const statusData = [
    { name: 'Completadas', value: completedAppointments },
    { name: 'Confirmadas', value: confirmedAppointments },
    { name: 'Pendientes', value: pendingAppointments },
    { name: 'Canceladas', value: cancelledAppointments },
  ].filter(item => item.value > 0);

  // Status colors for pie chart
  const COLORS = ['#2C5F2D', '#4A7E4B', '#E8C547', '#97704F'];

  // Format appointments by service type for bar chart
  const serviceTypeData = appointments
    ? Object.entries(
        appointments.reduce((acc, app) => {
          const serviceType = app.serviceType;
          acc[serviceType] = (acc[serviceType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Calculate estimated earnings (sample calculation)
  const estimatedEarnings = totalAppointments * 50; // Assuming €50 per appointment
  const estimatedEarningsMonth = appointmentsThisMonth * 50;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Citas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-equi-green">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {appointmentsThisMonth} en el último mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Citas Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-equi-green">{completedAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((completedAppointments / totalAppointments) * 100) || 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-equi-gold">{pendingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Esperan tu confirmación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Estimados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-equi-green">€{estimatedEarnings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              €{estimatedEarningsMonth} en el último mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Estado de Citas</TabsTrigger>
          <TabsTrigger value="services">Tipos de Servicio</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>
                Visión general del estado de tus citas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} citas`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos suficientes para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Citas por Tipo de Servicio</CardTitle>
              <CardDescription>
                Distribución de tus citas por tipo de servicio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {serviceTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={serviceTypeData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} citas`, ""]} />
                      <Legend />
                      <Bar dataKey="value" name="Número de citas" fill="#2C5F2D" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos suficientes para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
