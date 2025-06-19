import { Link } from "wouter";

export default function CallToAction() {
  return (
    <section className="py-16 bg-equi-green text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Únete a la comunidad ecuestre más completa</h2>
        <p className="text-xl mb-8 max-w-3xl mx-auto">Empieza a gestionar todos los servicios relacionados con tus caballos en un solo lugar y descubre cómo EquiGest puede transformar tu experiencia ecuestre.</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link href="/register">
            <a className="bg-white text-equi-green hover:bg-equi-cream transition font-medium py-3 px-8 rounded-md">Registrarse Gratis</a>
          </Link>
          <Link href="/contact">
            <a className="border-2 border-white text-white hover:bg-white hover:text-equi-green transition font-medium py-3 px-8 rounded-md">Solicitar Demo</a>
          </Link>
        </div>
      </div>
    </section>
  );
}
