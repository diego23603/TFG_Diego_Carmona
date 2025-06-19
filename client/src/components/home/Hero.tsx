import { Link } from "wouter";
import { User } from "@/lib/types";

interface HeroProps {
  user: User | null;
}

export default function Hero({ user }: HeroProps) {
  return (
    <section className="relative">
      <div className="absolute inset-0 hero-gradient"></div>
      <div 
        className="relative h-[500px] bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80')" }}
      >
        <div className="container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-4">
              Gestiona todo lo relacionado con tu caballo en un solo lugar
            </h1>
            <p className="text-lg md:text-xl text-white mb-8">
              Conecta con profesionales, agenda citas y lleva un historial completo de tus caballos de forma fácil e intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <a className="bg-equi-green hover:bg-equi-light-green text-white font-medium py-3 px-6 rounded-md transition text-center">
                    Ir a mi Panel
                  </a>
                </Link>
              ) : (
                <>
                  <Link href="/register?type=client">
                    <a className="bg-equi-green hover:bg-equi-light-green text-white font-medium py-3 px-6 rounded-md transition text-center">
                      Registrarse como Cliente
                    </a>
                  </Link>
                  <Link href="/register?type=professional">
                    <a className="bg-equi-brown hover:bg-equi-light-brown text-white font-medium py-3 px-6 rounded-md transition text-center">
                      Registrarse como Profesional
                    </a>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
