import { Link } from "wouter";
import { Check } from "lucide-react";

export default function ProfessionalDashboardPreview() {
  return (
    <section className="py-16 bg-equi-cream">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-white p-6 rounded-lg shadow-lg">
            {/* Professional Dashboard Preview Mock */}
            <div className="bg-equi-cream rounded-lg shadow-sm p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-xl">Panel de Control</h3>
                <div className="text-sm text-equi-charcoal">
                  <span className="font-semibold">Octubre 2023</span> 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-3xl font-semibold text-equi-green mb-1">24</div>
                  <div className="text-sm text-gray-600">Citas<br/>Programadas</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-3xl font-semibold text-equi-brown mb-1">8</div>
                  <div className="text-sm text-gray-600">Nuevas<br/>Solicitudes</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-3xl font-semibold text-equi-gold mb-1">42</div>
                  <div className="text-sm text-gray-600">Clientes<br/>Totales</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-3xl font-semibold text-equi-green mb-1">€2.8k</div>
                  <div className="text-sm text-gray-600">Ingresos<br/>del Mes</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-3">Agenda de Hoy</h4>
                
                <div className="flex items-center py-3 border-b border-gray-100">
                  <div className="w-12 text-center text-sm mr-3">
                    <div className="font-semibold">09:00</div>
                  </div>
                  <div className="flex-grow bg-equi-cream p-2 rounded">
                    <div className="flex justify-between">
                      <p className="font-semibold">Revisión Herraduras - Trueno</p>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Confirmado</span>
                    </div>
                    <p className="text-sm text-gray-600">Ana Rodríguez • Centro Ecuestre El Pinar</p>
                  </div>
                </div>
                
                <div className="flex items-center py-3 border-b border-gray-100">
                  <div className="w-12 text-center text-sm mr-3">
                    <div className="font-semibold">11:30</div>
                  </div>
                  <div className="flex-grow bg-equi-cream p-2 rounded">
                    <div className="flex justify-between">
                      <p className="font-semibold">Herrado Completo - Relampago</p>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Confirmado</span>
                    </div>
                    <p className="text-sm text-gray-600">Pedro Gómez • Hacienda Los Olivos</p>
                  </div>
                </div>
                
                <div className="flex items-center py-3">
                  <div className="w-12 text-center text-sm mr-3">
                    <div className="font-semibold">16:00</div>
                  </div>
                  <div className="flex-grow bg-equi-cream p-2 rounded">
                    <div className="flex justify-between">
                      <p className="font-semibold">Primeras Herraduras - Estrella</p>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pendiente</span>
                    </div>
                    <p className="text-sm text-gray-600">María Fernández • Club Hípico Andaluz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">Panel Profesional Completo</h2>
            <p className="text-lg text-gray-600 mb-6">Administra tu negocio ecuestre con nuestro panel especializado para profesionales, diseñado para optimizar tu tiempo y aumentar tus ingresos.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-equi-brown text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold mb-1">Gestión de Agenda</h4>
                  <p className="text-gray-600">Organiza tu disponibilidad, confirma citas y maximiza tu tiempo con nuestra herramienta de programación.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-equi-brown text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold mb-1">Seguimiento de Clientes</h4>
                  <p className="text-gray-600">Mantén un registro detallado de cada cliente y caballo con el que trabajas, incluyendo historial y notas.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-equi-brown text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold mb-1">Analíticas de Negocio</h4>
                  <p className="text-gray-600">Visualiza tus ingresos, patrones de reservas y crecimiento del negocio con nuestros reportes intuitivos.</p>
                </div>
              </div>
            </div>
            
            <Link href="/register?type=professional">
              <a className="inline-block bg-equi-brown hover:bg-equi-light-brown text-white font-medium py-3 px-6 rounded-md transition">Prueba para profesionales</a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
