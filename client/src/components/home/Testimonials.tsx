import { Star, StarHalf } from "lucide-react";

const testimonials = [
  {
    initials: "LM",
    name: "Laura Martínez",
    role: "Propietaria de caballos",
    content: "Desde que uso EquiGest, la organización de los cuidados de mis tres caballos es mucho más sencilla. Puedo coordinar con todos los profesionales desde un solo lugar y tener un historial completo. ¡Increíble!",
    rating: 5,
    bgColor: "bg-equi-green"
  },
  {
    initials: "JR",
    name: "Javier Rodríguez",
    role: "Veterinario Equino",
    content: "Como veterinario, EquiGest ha cambiado mi forma de trabajar. Ahora gestiono mi agenda de manera eficiente, tengo acceso al historial completo de cada caballo y la comunicación con los propietarios es mucho más fluida.",
    rating: 4.5,
    bgColor: "bg-equi-brown"
  },
  {
    initials: "CG",
    name: "Carmen García",
    role: "Herradora Profesional",
    content: "Mi negocio ha crecido significativamente desde que me registré en EquiGest. La plataforma me ha ayudado a organizar mi trabajo, ganar nuevos clientes y reducir cancelaciones gracias a los recordatorios automáticos.",
    rating: 5,
    bgColor: "bg-equi-green"
  }
];

export default function Testimonials() {
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="fill-equi-gold text-equi-gold" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="fill-equi-gold text-equi-gold" />);
    }
    
    return (
      <div className="flex">
        {stars}
      </div>
    );
  };
  
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">Lo que dicen nuestros usuarios</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Descubre cómo EquiGest está transformando la gestión ecuestre para propietarios y profesionales.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-equi-cream rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${testimonial.bgColor} text-white rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="font-semibold">{testimonial.initials}</span>
                </div>
                <div className="ml-3">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{testimonial.content}</p>
              <div className="text-equi-gold">
                {renderRating(testimonial.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
