import { Link } from "wouter";
import { Check } from "lucide-react";

export default function ClientDashboardPreview() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">Panel de Cliente Intuitivo</h2>
            <p className="text-lg text-gray-600 mb-6">Gestiona todos tus caballos, citas y comunicaciones desde un panel fácil de usar diseñado para propietarios de caballos.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-equi-green text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold mb-1">Gestión de Caballos</h4>
                  <p className="text-gray-600">Añade y administra todos los datos de tus caballos, incluyendo fotos, edad, raza y necesidades específicas.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-equi-green text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold mb-1">Calendario de Citas</h4>
                  <p className="text-gray-600">Visualiza y gestiona todas las citas programadas con diferentes profesionales en un calendario unificado.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-equi-green text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold mb-1">Red de Profesionales</h4>
                  <p className="text-gray-600">Conecta con veterinarios, herradores, fisioterapeutas y entrenadores para solicitar sus servicios.</p>
                </div>
              </div>
            </div>
            
            <Link href="/register?type=client">
              <a className="inline-block bg-equi-green hover:bg-equi-light-green text-white font-medium py-3 px-6 rounded-md transition">Ver demostración</a>
            </Link>
          </div>
          
          <div className="bg-equi-cream p-6 rounded-lg shadow-lg">
            {/* Dashboard Preview Mock */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-xl">Mis Caballos</h3>
                <button className="text-equi-green hover:text-equi-light-green transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-equi-cream rounded-lg p-4 cursor-pointer hover:shadow-md transition">
                  <div className="h-32 bg-cover bg-center rounded-lg mb-3" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1553284965-99ba659f48c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')" }}></div>
                  <h4 className="font-semibold">Tornado</h4>
                  <p className="text-sm text-gray-600">Pura Raza Español • 8 años</p>
                </div>
                
                <div className="bg-equi-cream rounded-lg p-4 cursor-pointer hover:shadow-md transition">
                  <div className="h-32 bg-cover bg-center rounded-lg mb-3" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1460999158988-6f0380f81f4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')" }}></div>
                  <h4 className="font-semibold">Luna</h4>
                  <p className="text-sm text-gray-600">Árabe • 5 años</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="font-display font-semibold text-xl mb-4">Próximas Citas</h3>
              
              <div className="border-l-4 border-equi-green bg-equi-cream rounded-r-lg p-3 mb-3 appointment-hover transition-all">
                <div className="flex justify-between">
                  <p className="font-semibold">Herrado - Tornado</p>
                  <p className="text-sm text-gray-600">25 Oct</p>
                </div>
                <p className="text-sm">Miguel Herrador • 15:30</p>
              </div>
              
              <div className="border-l-4 border-equi-brown bg-equi-cream rounded-r-lg p-3 mb-3 appointment-hover transition-all">
                <div className="flex justify-between">
                  <p className="font-semibold">Revisión Dental - Luna</p>
                  <p className="text-sm text-gray-600">28 Oct</p>
                </div>
                <p className="text-sm">Carlos Dentista Equino • 10:00</p>
              </div>
              
              <button className="w-full mt-2 text-equi-green hover:text-equi-light-green text-center py-2 transition">
                Ver todas las citas <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-display font-semibold text-xl mb-4">Mensajes Recientes</h3>
              
              <div className="flex items-center border-b border-gray-200 py-3">
                <div className="w-10 h-10 bg-equi-green text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold">MV</span>
                </div>
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between">
                    <p className="font-semibold">Dr. María Veterinaria</p>
                    <p className="text-xs text-gray-500">12:30</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">Los análisis de Luna llegaron. Todo está bien, solo...</p>
                </div>
              </div>
              
              <div className="flex items-center py-3">
                <div className="w-10 h-10 bg-equi-brown text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold">JE</span>
                </div>
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between">
                    <p className="font-semibold">Juan Entrenador</p>
                    <p className="text-xs text-gray-500">Ayer</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">¿Podemos reagendar la sesión de Tornado para el viernes?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
