import { USER_TYPE_LABELS } from "@/lib/types";

const userTypes = [
  {
    type: 'client',
    icon: 'user',
    color: 'bg-equi-green',
    description: 'Gestione sus caballos, agende citas con profesionales y mantenga un historial completo.'
  },
  {
    type: 'vet',
    icon: 'stethoscope',
    color: 'bg-equi-brown',
    description: 'Administre sus citas, mantenga registros médicos y comuníquese con sus clientes fácilmente.'
  },
  {
    type: 'farrier',
    icon: 'hammer',
    color: 'bg-equi-gold',
    description: 'Organice su agenda, registre el trabajo realizado y mantenga un seguimiento de cada caballo.'
  },
  {
    type: 'trainer',
    icon: 'dumbbell',
    color: 'bg-equi-green',
    description: 'Programe sesiones, realice un seguimiento del progreso y mantenga contacto con los propietarios.'
  }
];

export default function UserTypes() {
  return (
    <section className="py-16 bg-white" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">
            Para todos los involucrados en el mundo ecuestre
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            EquiGest conecta a propietarios de caballos con todos los profesionales necesarios para el cuidado óptimo de sus equinos.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {userTypes.map((userType, index) => (
            <div 
              key={index} 
              className="role-card bg-equi-cream rounded-lg p-6 shadow-md transition-all duration-300"
            >
              <div className={`w-16 h-16 ${userType.color} text-white rounded-full flex items-center justify-center mx-auto mb-4`}>
                <i className={`fas fa-${userType.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-display font-semibold text-center mb-2">
                {USER_TYPE_LABELS[userType.type]}
              </h3>
              <p className="text-gray-600 text-center">
                {userType.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a href="#" className="inline-block text-equi-green hover:text-equi-light-green font-medium border-b-2 border-equi-green transition">
            Ver todos los tipos de profesionales <i className="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
