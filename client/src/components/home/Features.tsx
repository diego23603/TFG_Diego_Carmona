import { Calendar, Rabbit, MessageSquare, MapPin, History, ChartLine } from "lucide-react";

const features = [
  {
    icon: <Calendar className="text-xl" />,
    title: "Gestión de Citas",
    description: "Agenda, modifica y cancela citas fácilmente con cualquier profesional conectado."
  },
  {
    icon: <Rabbit className="text-xl" />,
    title: "Perfil de Caballos",
    description: "Mantén toda la información de tus caballos organizada, incluyendo historial médico y de servicios."
  },
  {
    icon: <MessageSquare className="text-xl" />,
    title: "Comunicación Directa",
    description: "Chatea directamente con profesionales para coordinar servicios y resolver dudas."
  },
  {
    icon: <MapPin className="text-xl" />,
    title: "Ubicación de Caballos",
    description: "Registra y actualiza dónde se encuentran tus caballos para facilitar el servicio a domicilio."
  },
  {
    icon: <History className="text-xl" />,
    title: "Historial Completo",
    description: "Accede al historial completo de servicios, tratamientos y cuidados de cada caballo."
  },
  {
    icon: <ChartLine className="text-xl" />,
    title: "Panel Profesional",
    description: "Los profesionales pueden gestionar su agenda, clientes y servicios desde un panel personalizado."
  }
];

export default function Features() {
  return (
    <section className="py-16 bg-equi-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">Todo lo que necesitas en un solo lugar</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Gestiona todos los servicios relacionados con tus caballos desde nuestra aplicación intuitiva.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card-hover bg-white rounded-lg p-6 shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-equi-green text-white rounded-full flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
