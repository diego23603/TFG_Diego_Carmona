import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-equi-charcoal text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-display font-bold mb-4">EquiGest</h3>
            <p className="text-gray-400 mb-4">La plataforma integral de gestión para el mundo del caballo.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Para Propietarios</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Para Veterinarios</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Para Herradores</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Para Entrenadores</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Para Otros Profesionales</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Guías de Cuidado</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Preguntas Frecuentes</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Centro de Ayuda</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Términos de Servicio</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Política de Privacidad</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Política de Cookies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Condiciones de Uso</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Avisos Legales</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} EquiGest. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
