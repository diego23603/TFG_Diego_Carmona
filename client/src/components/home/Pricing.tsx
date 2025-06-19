import { Link } from "wouter";
import { Check, X } from "lucide-react";

export default function Pricing() {
  return (
    <section className="py-16 bg-equi-cream" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">Planes simples y transparentes</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Escoge el plan que mejor se adapte a tus necesidades sin compromisos a largo plazo.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
            <div className="bg-equi-green text-white p-6 text-center">
              <h3 className="text-2xl font-display font-bold">Clientes</h3>
              <div className="text-3xl font-bold mt-2">Gratis</div>
              <p className="text-sm mt-1 opacity-75">Solo comisión por transacción</p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Registro ilimitado de caballos</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Conexión con profesionales</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Gestión de citas</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Historial básico por caballo</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Mensajería con profesionales</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <X className="mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Exportación de historiales</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/register?type=client">
                  <a className="block text-center bg-equi-green hover:bg-equi-light-green text-white font-medium py-2 px-4 rounded-md transition">Registrarse Gratis</a>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105 border-2 border-equi-gold">
            <div className="bg-equi-brown text-white p-6 text-center relative">
              <div className="absolute top-0 right-0 bg-equi-gold text-equi-charcoal text-xs font-semibold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <h3 className="text-2xl font-display font-bold">Profesional Básico</h3>
              <div className="text-3xl font-bold mt-2">29,99€<span className="text-sm font-normal">/mes</span></div>
              <p className="text-sm mt-1 opacity-75">Comisión reducida por transacción</p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Gestión ilimitada de clientes</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Calendario de citas avanzado</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Mensajería con clientes</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Historial de servicios</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Panel de control básico</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Posicionamiento en búsquedas</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/register?type=professional&plan=basic">
                  <a className="block text-center bg-equi-brown hover:bg-equi-light-brown text-white font-medium py-2 px-4 rounded-md transition">Comenzar Ahora</a>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
            <div className="bg-equi-green text-white p-6 text-center">
              <h3 className="text-2xl font-display font-bold">Profesional Premium</h3>
              <div className="text-3xl font-bold mt-2">49,99€<span className="text-sm font-normal">/mes</span></div>
              <p className="text-sm mt-1 opacity-75">Sin comisiones por transacción</p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Todo lo del plan Básico</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Sin comisiones por transacción</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Analíticas avanzadas de negocio</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Perfil destacado en búsquedas</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Recordatorios automáticos</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-equi-green mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                  <span>Exportación de datos</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/register?type=professional&plan=premium">
                  <a className="block text-center bg-equi-green hover:bg-equi-light-green text-white font-medium py-2 px-4 rounded-md transition">Obtener Premium</a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
