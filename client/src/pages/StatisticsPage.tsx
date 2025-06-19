import { useEffect, useState } from "react";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// Colores personalizados para los gráficos
const COLORS = ['#85B09A', '#C8553D', '#f5bd41', '#4A6670', '#845EC2', '#FF8066'];

// Interfaces para los datos estadísticos
interface AppointmentsByMonth {
  name: string;
  citas: number;
}

interface ServiceDistribution {
  name: string;
  value: number;
}

interface ProfessionalActivity {
  name: string;
  citas: number;
  rating: number;
}

interface RevenueData {
  name: string;
  ingresos: number;
}

interface ClientGrowth {
  name: string;
  clientes: number;
}

interface StatisticsData {
  appointmentsByMonth: AppointmentsByMonth[];
  appointmentsByType: ServiceDistribution[];
  professionalActivity: ProfessionalActivity[];
  revenueData: RevenueData[];
  clientGrowth: ClientGrowth[];
  totalAppointments: number;
  totalProfessionals: number;
  totalHorses: number;
  totalRevenue: number;
  totalClients?: number;
}

const StatisticsPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatisticsData>({
    appointmentsByMonth: [],
    appointmentsByType: [],
    professionalActivity: [],
    revenueData: [],
    clientGrowth: [],
    totalAppointments: 0,
    totalProfessionals: 0,
    totalHorses: 0,
    totalRevenue: 0
  });
  
  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) return;
        
        // Obtener datos reales de la API
        const response = await apiRequest("GET", `/api/statistics/professional/${user.id}`);
        const data = await response.json();
        
        if (!data) {
          throw new Error("No se recibieron datos de estadísticas");
        }
        
        setStats({
          appointmentsByMonth: data.appointmentsByMonth || [],
          appointmentsByType: data.appointmentsByType || [],
          professionalActivity: data.professionalActivity || [],
          revenueData: data.revenueData || [],
          clientGrowth: data.clientGrowth || [],
          totalAppointments: data.totalAppointments || 0,
          totalProfessionals: 1, // El profesional es solo él mismo
          totalHorses: data.totalHorses || 0,
          totalRevenue: data.totalRevenue || 0,
          totalClients: data.totalClients || 0
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-equi-green" />
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-equi-charcoal mb-2">Estadísticas</h1>
        <p className="text-gray-600">
          Visualiza los datos más importantes de tu actividad en EquiGest
        </p>
      </div>

      {/* Panel de resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-equi-green/20 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-equi-green/10 p-3 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-equi-green" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Citas totales</p>
                <h3 className="text-2xl font-bold">{stats.totalAppointments}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-equi-green/20 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-equi-brown/10 p-3 rounded-full mr-4">
                <Users className="h-6 w-6 text-equi-brown" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Clientes atendidos</p>
                <h3 className="text-2xl font-bold">{stats.totalClients || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-equi-green/20 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-equi-gold/10 p-3 rounded-full mr-4">
                <Activity className="h-6 w-6 text-equi-gold" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Caballos atendidos</p>
                <h3 className="text-2xl font-bold">{stats.totalHorses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-equi-green/20 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-equi-green/10 p-3 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-equi-green" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Ingresos totales</p>
                <h3 className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <Tabs defaultValue="appointments" className="mb-8">
        <TabsList className="mb-4 bg-gray-100 p-1">
          <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:text-equi-green">
            <BarChart3 className="h-4 w-4 mr-2" />
            Citas
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:text-equi-green">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:text-equi-green">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Servicios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Citas por mes</CardTitle>
              <CardDescription>
                Distribución mensual de citas durante el año actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.appointmentsByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="citas" fill="#85B09A" name="Citas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por mes</CardTitle>
              <CardDescription>
                Evolución de ingresos durante el año actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#C8553D"
                      name="Ingresos"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de servicios</CardTitle>
              <CardDescription>
                Porcentaje de cada tipo de servicio profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.appointmentsByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.appointmentsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} citas`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gráficos secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad por ubicación</CardTitle>
            <CardDescription>
              Distribución de servicios por centros ecuestres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.professionalActivity}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="citas" fill="#4A6670" name="Citas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crecimiento de clientes</CardTitle>
            <CardDescription>
              Evolución de usuarios en los últimos años
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.clientGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="clientes"
                    stroke="#f5bd41"
                    name="Clientes"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;