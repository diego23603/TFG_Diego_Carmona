import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope, 
  User, 
  HelpingHand, 
  Hammer, 
  Activity, 
  Scissors, 
  Dumbbell, 
  Calendar, 
  Bell, 
  Users, 
  MessageSquare,
  ArrowLeft,
  Utensils,
  CalendarDays
} from "lucide-react";

// Componente de tarjeta de profesional simplificado
const ProfessionalCard = ({ 
  title, 
  specialty, 
  icon, 
  benefits, 
  onClick 
}: { 
  title: string, 
  specialty: string, 
  icon: React.ReactNode, 
  benefits: string[], 
  onClick: () => void 
}) => {
  // Mapeo de especialidades a títulos en español
  const specialtyTitles: Record<string, string> = {
    vet: "Veterinario",
    farrier: "Herrador",
    dentist: "Dentista",
    physio: "Fisioterapeuta",
    trainer: "Entrenador",
    cleaner: "Servicio de Limpieza",
    food: "Alimentación",
    events: "Organización de Eventos"
  };

  // Obtener el título correcto según la especialidad
  const displayTitle = specialtyTitles[specialty] || title;
  
  return (
    <div 
      className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Título principal visible en la parte superior */}
      <div className="bg-equi-brown text-white text-center p-2 font-bold">
        {displayTitle}
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-equi-brown/20 rounded-full p-2">
            <div className="text-equi-brown">
              {icon}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-equi-brown">{displayTitle}</h3>
        </div>
        
        <ul className="space-y-3 mb-4">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-equi-gold mt-0.5">✦</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 text-center">
          <div 
            className="flex items-center justify-center py-2.5 px-4 w-full border border-equi-brown text-equi-brown hover:bg-equi-brown/10 rounded-md font-medium transition-colors cursor-pointer"
          >
            Seleccionar {displayTitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserTypeSelection() {
  const [selectedTab, setSelectedTab] = useState<'client' | 'professional'>('client');
  const [, navigate] = useLocation();

  const handleRegister = (type: 'client' | 'professional', specialty?: string) => {
    let url = `/register?type=${type}`;
    if (specialty) {
      url += `&specialty=${specialty}`;
    }
    // Navegar directamente a la URL en lugar de usar setLocation
    window.location.href = url;
  };

  // Lista de beneficios para cliente
  const clientBenefits = [
    { icon: <Calendar className="h-5 w-5 text-equi-green" />, text: "Programa servicios para tus caballos" },
    { icon: <Users className="h-5 w-5 text-equi-green" />, text: "Accede a profesionales cualificados" },
    { icon: <MessageSquare className="h-5 w-5 text-equi-green" />, text: "Comunicación directa con expertos" },
    { icon: <Bell className="h-5 w-5 text-equi-green" />, text: "Recordatorios para vacunas y cuidados" }
  ];

  // Lista de tipos de profesionales
  const professionalTypes = [
    {
      title: "Veterinario",
      specialty: "vet",
      icon: <Stethoscope className="h-5 w-5" />,
      benefits: [
        "Gestión de historial médico equino",
        "Programación de citas y vacunas",
        "Comunicación directa con propietarios"
      ]
    },
    {
      title: "Herrador",
      specialty: "farrier",
      icon: <Hammer className="h-5 w-5" />,
      benefits: [
        "Organización de visitas y herrados",
        "Mantenimiento de historial por caballo",
        "Recomendaciones personalizadas"
      ]
    },
    {
      title: "Dentista",
      specialty: "dentist",
      icon: <Scissors className="h-5 w-5" />,
      benefits: [
        "Seguimiento de tratamientos dentales",
        "Agendamiento flexible de visitas",
        "Alertas para revisiones periódicas"
      ]
    },
    {
      title: "Fisioterapeuta",
      specialty: "physio",
      icon: <Activity className="h-5 w-5" />,
      benefits: [
        "Control de terapias y masajes equinos",
        "Historial de lesiones y recuperación",
        "Comunicación directa con veterinarios"
      ]
    },
    {
      title: "Entrenador",
      specialty: "trainer",
      icon: <Dumbbell className="h-5 w-5" />,
      benefits: [
        "Seguimiento de progreso de caballos",
        "Programación de entrenamientos",
        "Planes personalizados por caballo"
      ]
    },
    {
      title: "Servicio de Limpieza",
      specialty: "cleaner",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>,
      benefits: [
        "Gestión de servicios de limpieza",
        "Alertas de mantenimiento de vehículos",
        "Agendamiento simplificado de servicios"
      ]
    },
    {
      title: "Alimentación",
      specialty: "food",
      icon: <Utensils className="h-5 w-5" />,
      benefits: [
        "Gestión de pedidos y suministros",
        "Seguimiento de la nutrición equina",
        "Recomendaciones personalizadas"
      ]
    },
    {
      title: "Organización de Eventos",
      specialty: "events",
      icon: <CalendarDays className="h-5 w-5" />,
      benefits: [
        "Gestión de competiciones y eventos",
        "Calendario integrado de actividades",
        "Comunicación directa con participantes"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-equi-charcoal">
            Únete a la comunidad <span className="text-equi-green">EquiGest</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
          </p>
        </div>

        {/* Selector de tipo de usuario */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="grid grid-cols-2 relative">
            {/* Botones como divs para más estabilidad */}
            <div
              onClick={() => setSelectedTab('client')}
              className={`py-4 px-6 font-medium text-center transition-all cursor-pointer ${
                selectedTab === 'client' 
                  ? 'bg-equi-green text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="h-5 w-5" />
                <span>Propietario de Caballo</span>
              </div>
            </div>
            <div
              onClick={() => setSelectedTab('professional')}
              className={`py-4 px-6 font-medium text-center transition-all cursor-pointer ${
                selectedTab === 'professional' 
                  ? 'bg-equi-brown text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <HelpingHand className="h-5 w-5" />
                <span>Profesional Ecuestre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido basado en la pestaña seleccionada */}
        <div className="transition-all duration-300">
          {/* Contenido para propietario de caballo */}
          <div className={selectedTab === 'client' ? 'block' : 'hidden'}>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-6 md:p-10 flex flex-col justify-center">
                  <div className="mb-6">
                    <div className="bg-equi-green/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                      <User className="h-7 w-7 text-equi-green" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Propietario de Caballo</h2>
                    <p className="text-gray-600 mb-6">
                      Gestiona a tus caballos de manera eficiente con acceso a profesionales cualificados
                      y mantén un seguimiento completo de su historial.
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                      {clientBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <div className="mr-3">{benefit.icon}</div>
                          <span>{benefit.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={() => handleRegister('client')}
                    className="w-full bg-equi-green hover:bg-equi-light-green text-white"
                    size="lg"
                  >
                    Registrarse como Propietario
                  </Button>
                </div>
                
                <div className="hidden md:block relative bg-equi-green/10 p-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-equi-green/20">
                    <h3 className="text-xl font-bold mb-3 text-equi-green">¿Por qué unirte como propietario?</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="bg-equi-green/10 rounded-full p-1 text-equi-green">✓</span>
                        <span>Conecta con los mejores profesionales del sector</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-equi-green/10 rounded-full p-1 text-equi-green">✓</span>
                        <span>Lleva un control detallado de tus caballos</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-equi-green/10 rounded-full p-1 text-equi-green">✓</span>
                        <span>Gestiona todas sus necesidades desde una única plataforma</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido para profesional ecuestre */}
          <div className={selectedTab === 'professional' ? 'block' : 'hidden'}>
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3 text-equi-brown">
                  Elige tu especialidad
                </h2>
                <p className="text-gray-600 max-w-2xl">
                  Selecciona la especialidad que mejor represente tus servicios profesionales 
                  y empieza a conectar con propietarios de caballos que necesitan tu experiencia
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {professionalTypes.map((prof, index) => (
                  <div key={index} onClick={() => handleRegister('professional', prof.specialty)}>
                    <ProfessionalCard
                      icon={prof.icon}
                      title={prof.title}
                      specialty={prof.specialty}
                      benefits={prof.benefits}
                      onClick={() => handleRegister('professional', prof.specialty)}
                    />
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-equi-brown/10 rounded-full p-3">
                    <HelpingHand className="h-6 w-6 text-equi-brown" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">¿No encuentras tu especialidad?</h3>
                    <p className="text-gray-600">Regístrate como profesional y personaliza tu perfil más adelante</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleRegister('professional')}
                  variant="default"
                  className="w-full bg-equi-brown hover:bg-equi-light-brown text-white"
                  size="lg"
                >
                  Registrarse como Profesional
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-equi-green hover:text-equi-green/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}