import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { 
  Calendar, 
  MessageSquare, 
  User, 
  Users, 
  ChevronRight, 
  Star, 
  Check, 
  X, 
  ArrowRight, 
  Menu, 
  Heart, 
  Shield, 
  Zap,
  Activity,
  Stethoscope,
  Hammer,
  Dumbbell,
  Scissors,
  Flame,
  Utensils,
  CalendarDays,
  BadgeCheck,
  LogOut
} from "lucide-react";

export default function HomePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  // Animación de aparición al hacer scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.animate-hidden');
    hiddenElements.forEach(el => observer.observe(el));

    return () => {
      hiddenElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  // Navegación suave al hacer clic en los enlaces del menú
  const scrollToSection = (section: string) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(section);
      setIsMenuOpen(false);
    }
  };

  // Manejar envío del formulario de contacto
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Gracias por ponerte en contacto con nosotros. Te responderemos lo antes posible.",
    });
    setContactForm({ name: "", email: "", message: "" });
  };

  // Manejar clic en "Comenzar Ahora"
  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  // Datos para la sección de profesionales
  const professionals = [
    { 
      title: "Veterinarios", 
      icon: <Stethoscope className="h-8 w-8 text-equi-green" />, 
      description: "Especialistas en salud equina para tratar y prevenir enfermedades, con amplia experiencia en caballos." 
    },
    { 
      title: "Herradores", 
      icon: <Hammer className="h-8 w-8 text-equi-brown" />, 
      description: "Expertos en herraje y cuidado de cascos, fundamentales para la salud y rendimiento de tu caballo." 
    },
    { 
      title: "Fisioterapeutas", 
      icon: <Activity className="h-8 w-8 text-equi-light-green" />, 
      description: "Especialistas en rehabilitación física y mejora del rendimiento mediante terapias manuales." 
    },
    { 
      title: "Dentistas Equinos", 
      icon: <Scissors className="h-8 w-8 text-equi-gold" />, 
      description: "Profesionales en salud dental equina, esencial para una correcta alimentación y bienestar." 
    },
    { 
      title: "Entrenadores", 
      icon: <Dumbbell className="h-8 w-8 text-equi-blue" />, 
      description: "Expertos en entrenamiento y doma, ayudando a mejorar la comunicación entre jinete y caballo." 
    },
    { 
      title: "Alimentación", 
      icon: <Utensils className="h-8 w-8 text-equi-brown" />, 
      description: "Empresas de piensos y suplementación equina que aportan soluciones nutricionales para el óptimo rendimiento de tu caballo." 
    },
    { 
      title: "Organización de Eventos", 
      icon: <CalendarDays className="h-8 w-8 text-equi-green" />, 
      description: "Centros e instalaciones dedicados a la organización de competiciones y eventos ecuestres de todas las disciplinas." 
    }
  ];

  // Datos para los testimonios
  const testimonials = [
    {
      name: "María Fernández",
      role: "Propietaria de 3 caballos",
      text: "Equestrian Hub ha cambiado por completo la forma en que gestiono mis caballos. Ahora puedo programar citas con el veterinario, fisioterapeuta y herrador en un solo lugar. ¡Increíble!",
      avatar: "MF"
    },
    {
      name: "Carlos Mendoza",
      role: "Veterinario Equino",
      text: "Como profesional, esta plataforma me ha facilitado la organización de mi agenda y la comunicación con mis clientes. La información detallada de cada caballo me permite ofrecer un mejor servicio.",
      avatar: "CM"
    },
    {
      name: "Laura Gómez",
      role: "Propietaria de centro ecuestre",
      text: "Gestionar los servicios para los 20 caballos de nuestro centro era un dolor de cabeza antes de usar Equestrian Hub. Ahora tenemos todo centralizado y ordenado. El soporte es excelente.",
      avatar: "LG"
    }
  ];

  // Datos para planes de precios
  const pricingPlans = [
    {
      name: "Básico",
      description: "Para propietarios individuales",
      price: "Gratis",
      features: [
        "Gestión de hasta 2 caballos",
        "Agenda de citas básica",
        "Conexión con 5 profesionales",
        "Historial médico básico"
      ],
      notIncluded: [
        "Historial médico avanzado",
        "Asistente IA",
        "Estadísticas avanzadas",
        "Soporte prioritario"
      ],
      popular: false,
      buttonText: "Comenzar Ahora",
      buttonVariant: "outline"
    },
    {
      name: "Premium",
      description: "Para propietarios exigentes",
      price: "15€/mes",
      features: [
        "Gestión ilimitada de caballos",
        "Agenda de citas avanzada",
        "Conexión ilimitada con profesionales",
        "Historial médico completo",
        "Estadísticas básicas",
        "Soporte prioritario"
      ],
      notIncluded: [
        "Asistente IA avanzado"
      ],
      popular: true,
      buttonText: "Prueba Gratuita",
      buttonVariant: "default"
    },
    {
      name: "Profesional",
      description: "Para profesionales equinos",
      price: "15€/mes",
      features: [
        "Gestión ilimitada de clientes",
        "Agenda de citas avanzada",
        "Perfil destacado para clientes",
        "Historial médico completo",
        "Estadísticas avanzadas",
        "Asistente IA",
        "Soporte prioritario 24/7"
      ],
      notIncluded: [],
      popular: false,
      buttonText: "Contacta con Ventas",
      buttonVariant: "outline"
    }
  ];

  // Datos para FAQs
  const faqs = [
    {
      question: "¿Qué tipos de profesionales puedo encontrar en la plataforma?",
      answer: "Puedes encontrar veterinarios, herradores, fisioterapeutas, dentistas equinos, entrenadores, servicios de limpieza, empresas de alimentación y organizadores de eventos ecuestres. Todos nuestros profesionales están verificados y cuentan con evaluaciones de clientes para garantizar la mejor experiencia."
    },
    {
      question: "¿Cómo funciona el sistema de citas?",
      answer: "Puedes solicitar citas con cualquier profesional disponible en la plataforma. El profesional recibirá tu solicitud y podrá confirmarla, rechazarla o proponer una fecha alternativa. Recibirás notificaciones sobre el estado de tus citas."
    },
    {
      question: "¿Puedo gestionar varios caballos en una sola cuenta?",
      answer: "¡Por supuesto! Dependiendo de tu plan, puedes gestionar desde 2 caballos (plan gratuito) hasta un número ilimitado (planes premium y profesional). Cada caballo tendrá su propio perfil, historial médico y registro de servicios."
    },
    {
      question: "¿Cómo funciona el pago a los profesionales?",
      answer: "La plataforma facilita la comunicación y agenda, pero el pago de servicios se realiza directamente entre el cliente y el profesional. Puedes acordar los detalles del pago con cada profesional según sus preferencias."
    },
    {
      question: "¿Qué es el Asistente IA y cómo me ayuda?",
      answer: "El Asistente IA es una funcionalidad disponible para los profesionales en planes Premium y Profesional. Proporciona recomendaciones basadas en el historial del caballo, ayuda en la programación de citas y ofrece información relevante para mejorar la atención al caballo."
    }
  ];

  // Si el usuario es profesional, mostrar contenido profesional
  if (user && user.isProfessional) {
    return (
      <div className="p-4 sm:p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bienvenido a <span className="text-equi-green">EquiGest</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Tu plataforma profesional para gestión equina
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <Button className="bg-equi-green hover:bg-equi-light-green">
                  Ir al Dashboard
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button variant="outline">
                  Asistente IA
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Quick stats or overview for professionals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-equi-green" />
                  Próximas Citas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Esta semana</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-equi-green" />
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Conectados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-equi-green" />
                  Mensajes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Sin leer</p>
              </CardContent>
            </Card>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-equi-green mr-2" />
            <h1 className="text-2xl font-bold text-primary">
              Equi<span className="text-equi-green">Gest</span>
            </h1>
          </div>
          
          {/* Navegación escritorio */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => scrollToSection("inicio")}
              className={cn("text-sm transition-colors hover:text-equi-green", 
                activeSection === "inicio" ? "text-equi-green font-medium" : "text-muted-foreground")}
            >
              Inicio
            </button>
            <button 
              onClick={() => scrollToSection("profesionales")}
              className={cn("text-sm transition-colors hover:text-equi-green", 
                activeSection === "profesionales" ? "text-equi-green font-medium" : "text-muted-foreground")}
            >
              Profesionales
            </button>
            <button 
              onClick={() => scrollToSection("caracteristicas")}
              className={cn("text-sm transition-colors hover:text-equi-green", 
                activeSection === "caracteristicas" ? "text-equi-green font-medium" : "text-muted-foreground")}
            >
              Características
            </button>
            <button 
              onClick={() => scrollToSection("precios")}
              className={cn("text-sm transition-colors hover:text-equi-green", 
                activeSection === "precios" ? "text-equi-green font-medium" : "text-muted-foreground")}
            >
              Precios
            </button>
            <button 
              onClick={() => scrollToSection("contacto")}
              className={cn("text-sm transition-colors hover:text-equi-green", 
                activeSection === "contacto" ? "text-equi-green font-medium" : "text-muted-foreground")}
            >
              Contacto
            </button>
          </nav>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button className="bg-equi-green hover:bg-equi-light-green flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Mi Cuenta</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-50 hidden md:flex items-center gap-2"
                  onClick={() => logout && logout()}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </Button>
              </>
            ) : (
              <div className="space-x-2 hidden md:flex">
                <Link href="/login">
                  <Button variant="outline" className="border-equi-green text-equi-green hover:bg-equi-green/10 font-medium">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-equi-green hover:bg-equi-light-green font-medium">Registrarse</Button>
                </Link>
              </div>
            )}
            
            {/* Botón menú móvil */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b md:hidden py-4 px-4 shadow-lg z-50">
            <nav className="flex flex-col space-y-3">
              <button 
                onClick={() => scrollToSection("inicio")}
                className="text-sm px-3 py-2 hover:bg-muted rounded-md font-medium text-left"
              >
                Inicio
              </button>
              <button 
                onClick={() => scrollToSection("profesionales")}
                className="text-sm px-3 py-2 hover:bg-muted rounded-md font-medium text-left"
              >
                Profesionales
              </button>
              <button 
                onClick={() => scrollToSection("caracteristicas")}
                className="text-sm px-3 py-2 hover:bg-muted rounded-md font-medium text-left"
              >
                Características
              </button>
              <button 
                onClick={() => scrollToSection("precios")}
                className="text-sm px-3 py-2 hover:bg-muted rounded-md font-medium text-left"
              >
                Precios
              </button>
              <button 
                onClick={() => scrollToSection("contacto")}
                className="text-sm px-3 py-2 hover:bg-muted rounded-md font-medium text-left"
              >
                Contacto
              </button>
              
              {user ? (
                <div className="pt-3 mt-1 border-t flex flex-col space-y-2">
                  <Link href="/dashboard">
                    <Button className="w-full bg-equi-green hover:bg-equi-light-green flex items-center justify-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Mi Cuenta</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                    onClick={() => logout && logout()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </Button>
                </div>
              ) : (
                <div className="pt-3 mt-1 border-t flex flex-col space-y-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-equi-green text-equi-green hover:bg-equi-green/10 font-medium">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-equi-green hover:bg-equi-light-green font-medium">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section id="inicio" className="relative bg-gradient-to-b from-background to-muted py-24 md:py-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-equi-green/5 blur-3xl -z-10"></div>
          <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-equi-light-green/30 blur-2xl -z-10 animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full bg-equi-gold/20 blur-2xl -z-10 animate-pulse" style={{animationDelay: '1s'}}></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="animate-hidden animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-slate-900">
                Tu plataforma integral para gestión equina
              </h2>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg font-medium text-foreground shadow-sm">
                Conectamos propietarios con todos los profesionales del mundo ecuestre en un solo lugar. Simplifica la gestión y mejora la salud de tus caballos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg" 
                  className="px-8 py-6 text-lg bg-equi-green hover:bg-equi-light-green transition-all shadow-lg hover:shadow-xl"
                  onClick={handleGetStarted}
                >
                  Comenzar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg border-equi-green text-equi-green hover:bg-equi-green/10 transition-all"
                  onClick={() => scrollToSection("caracteristicas")}
                >
                  Descubrir Más
                </Button>
              </div>
            </div>

            <div className="mt-16 px-4 py-6 bg-white/50 backdrop-blur-sm rounded-xl shadow-xl max-w-4xl mx-auto animate-hidden animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-around text-center gap-6">
                <div>
                  <p className="text-4xl font-bold text-equi-charcoal mb-2">2,500+</p>
                  <p className="text-sm text-muted-foreground">Caballos Registrados</p>
                </div>
                <div className="h-12 border-r border-muted hidden md:block"></div>
                <div>
                  <p className="text-4xl font-bold text-equi-charcoal mb-2">500+</p>
                  <p className="text-sm text-muted-foreground">Profesionales Verificados</p>
                </div>
                <div className="h-12 border-r border-muted hidden md:block"></div>
                <div>
                  <p className="text-4xl font-bold text-equi-charcoal mb-2">15,000+</p>
                  <p className="text-sm text-muted-foreground">Citas Programadas</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Profesionales Section */}
        <section id="profesionales" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-hidden animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Todos los Servicios Ecuestres en Un Solo Lugar</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Desde cuidados veterinarios hasta organización de eventos, contamos con todos los profesionales que necesitas para el bienestar integral de tus caballos
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {professionals.map((professional, index) => (
                <div 
                  key={professional.title}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                    {professional.icon}
                  </div>
                  <h3 className="text-xl font-bold text-center mb-3">{professional.title}</h3>
                  <p className="text-muted-foreground text-center">{professional.description}</p>
                  
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline"
                      className="border-equi-green text-equi-green hover:bg-equi-green/10"
                      onClick={() => navigate("/professionals")}
                    >
                      Ver Profesionales <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-hidden animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Por qué elegir EquiGest?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Una solución completa y centralizada para todas tus necesidades ecuestres - desde la gestión de caballos hasta la coordinación con profesionales
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up">
                <div className="rounded-full bg-equi-green/10 w-14 h-14 flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6 text-equi-green" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Gestión completa de caballos
                </h3>
                <p className="text-muted-foreground">
                  Mantén un registro detallado de tus caballos, su historial médico y necesidades específicas. Gestiona documentos, fotos y más.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Fichas médicas completas
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Historial de servicios
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Recordatorios personalizados
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <div className="rounded-full bg-equi-green/10 w-14 h-14 flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-equi-green" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Citas y calendario integrado
                </h3>
                <p className="text-muted-foreground">
                  Programa fácilmente citas con profesionales y gestiona tu agenda con un calendario interactivo y notificaciones.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Disponibilidad en tiempo real
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Confirmación automática
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Recordatorios por email
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="rounded-full bg-equi-green/10 w-14 h-14 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-equi-green" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Red de profesionales
                </h3>
                <p className="text-muted-foreground">
                  Conecta con los mejores profesionales especializados en cuidado equino y gestiona tus relaciones.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Perfiles verificados
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Valoraciones y reseñas
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Filtrado por especialidad
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className="rounded-full bg-equi-green/10 w-14 h-14 flex items-center justify-center mb-6">
                  <MessageSquare className="h-6 w-6 text-equi-green" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Comunicación directa
                </h3>
                <p className="text-muted-foreground">
                  Sistema de mensajería integrado para comunicarte directamente con profesionales y otros propietarios.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Chat en tiempo real
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Compartir archivos e imágenes
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Historial de conversaciones
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="rounded-full bg-equi-green/10 w-14 h-14 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-equi-green" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Asistente IA
                </h3>
                <p className="text-muted-foreground">
                  Asistente inteligente para profesionales que proporciona información y recomendaciones basadas en datos.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Recomendaciones personalizadas
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Respuestas contextuales
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Ayuda en diagnósticos
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-hidden animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                <div className="rounded-full bg-equi-green/10 w-14 h-14 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-equi-green" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Seguridad y privacidad
                </h3>
                <p className="text-muted-foreground">
                  Tus datos están seguros con nosotros gracias a nuestras avanzadas medidas de seguridad y privacidad.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Encriptación de datos
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Control de acceso
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-equi-green mr-2" />
                    Cumplimiento normativo
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-hidden animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Lo que dicen nuestros usuarios</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Miles de propietarios y profesionales confían en Equestrian Hub para su gestión equina diaria
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.name}
                  className="bg-muted/30 rounded-xl p-8 border border-gray-100 hover:shadow-md transition-all duration-300 animate-hidden animate-fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-equi-green/20 flex items-center justify-center text-equi-green font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="mb-4 flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-equi-gold fill-equi-gold" />
                    ))}
                  </div>
                  <p className="text-sm">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precios" className="py-24 bg-gradient-to-b from-muted/50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-hidden animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Planes adaptados a tus necesidades</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Escoge el plan que mejor se adapte a tus necesidades y comienza a disfrutar de todas las ventajas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <div 
                  key={plan.name}
                  className={cn(
                    "bg-white rounded-xl overflow-hidden transition-all duration-300 animate-hidden animate-fade-in-up",
                    plan.popular ? "border-2 border-equi-green shadow-xl" : "border border-gray-200 shadow-md"
                  )}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {plan.popular && (
                    <div className="bg-equi-green text-white text-xs font-bold text-center py-1">
                      MÁS POPULAR
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{plan.price}</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-equi-green mr-2 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      
                      {plan.notIncluded.map((feature) => (
                        <div key={feature} className="flex items-start text-muted-foreground">
                          <X className="h-5 w-5 mr-2 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={cn(
                        "w-full", 
                        plan.buttonVariant === "default" ? "bg-equi-green hover:bg-equi-light-green" : 
                        "border-equi-green text-equi-green hover:bg-equi-green/10"
                      )}
                      variant={plan.buttonVariant as any}
                      onClick={handleGetStarted}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16 animate-hidden animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Preguntas frecuentes</h2>
              <p className="text-xl text-muted-foreground">
                Resolvemos tus dudas sobre Equestrian Hub
              </p>
            </div>
            
            <Accordion type="single" collapsible className="animate-hidden animate-fade-in-up">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="mt-12 text-center animate-hidden animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <p className="text-muted-foreground mb-4">¿No encuentras respuesta a tu pregunta?</p>
              <Button 
                variant="outline" 
                className="border-equi-green text-equi-green hover:bg-equi-green/10"
                onClick={() => scrollToSection("contacto")}
              >
                Contacta con nosotros
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-equi-green/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-xl p-8 md:p-12 shadow-xl border border-equi-green/20 animate-hidden animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    ¿Listo para revolucionar tu gestión equina?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Únete a miles de propietarios y profesionales que ya confían en Equestrian Hub para simplificar su día a día en el mundo ecuestre.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-equi-green hover:bg-equi-light-green"
                    onClick={handleGetStarted}
                  >
                    Comenzar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                <div className="hidden md:flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-equi-green/20 rounded-full blur-3xl transform scale-75"></div>
                    <Activity className="h-40 w-40 text-equi-green relative z-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contacto" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="animate-hidden animate-fade-in-up">
                  <h2 className="text-3xl font-bold mb-4">Ponte en contacto</h2>
                  <p className="text-muted-foreground mb-8">
                    ¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte. Rellena el formulario y te responderemos lo antes posible.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="rounded-full bg-equi-green/10 p-3 mr-4">
                        <MessageSquare className="h-5 w-5 text-equi-green" />
                      </div>
                      <div>
                        <h3 className="font-bold">Email</h3>
                        <p className="text-muted-foreground">soporte@equestrianhub.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="rounded-full bg-equi-green/10 p-3 mr-4">
                        <User className="h-5 w-5 text-equi-green" />
                      </div>
                      <div>
                        <h3 className="font-bold">Soporte</h3>
                        <p className="text-muted-foreground">Lunes a Viernes, 9:00 - 18:00</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="animate-hidden animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre</label>
                      <Input 
                        id="name" 
                        placeholder="Tu nombre" 
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="tu@email.com" 
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1">Mensaje</label>
                      <Textarea 
                        id="message" 
                        placeholder="¿En qué podemos ayudarte?" 
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-equi-green hover:bg-equi-light-green"
                    >
                      Enviar Mensaje
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-equi-charcoal text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center mb-6">
                <Activity className="h-8 w-8 text-equi-green mr-2" />
                <h2 className="text-xl font-bold">
                  Equestrian<span className="text-equi-green">Hub</span>
                </h2>
              </div>
              <p className="text-gray-400 mb-6 text-sm">
                La plataforma definitiva para la gestión equina, conectando propietarios y profesionales.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-4">Plataforma</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => scrollToSection("profesionales")}
                    className="text-gray-400 hover:text-equi-green transition-colors"
                  >
                    Profesionales
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("caracteristicas")}
                    className="text-gray-400 hover:text-equi-green transition-colors"
                  >
                    Características
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("precios")}
                    className="text-gray-400 hover:text-equi-green transition-colors"
                  >
                    Precios
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("contacto")}
                    className="text-gray-400 hover:text-equi-green transition-colors"
                  >
                    Contacto
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                    Tutoriales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                    Centro de ayuda
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                    Términos y condiciones
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                    Política de privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-equi-green transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © 2025 Equestrian Hub. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Botón flotante de volver arriba */}
      <button 
        className="fixed bottom-6 right-6 bg-equi-green hover:bg-equi-light-green text-white p-3 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-all"
        onClick={() => scrollToSection("inicio")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Los estilos para las animaciones están en index.css */}
    </div>
  );
}