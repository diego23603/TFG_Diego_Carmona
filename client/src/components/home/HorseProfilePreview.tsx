export default function HorseProfilePreview() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-equi-charcoal mb-4">Perfiles Completos para tus Caballos</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Mantén toda la información de tus equinos organizada y accesible para todos los profesionales que trabajan con ellos.</p>
        </div>
        
        <div className="bg-equi-cream rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1 p-6 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1598974357809-112c788e7f76?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')" }}>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-lg">
                <h3 className="text-2xl font-display font-bold mb-2">Relámpago</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">Raza:</span>
                    <span>Pura Raza Español</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Edad:</span>
                    <span>7 años</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Sexo:</span>
                    <span>Macho</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Color:</span>
                    <span>Tordo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Propietario:</span>
                    <span>Carlos Martínez</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Ubicación:</span>
                    <span>Centro Ecuestre El Pinar</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xl font-display font-semibold">Historial Médico</h4>
                  <button className="text-equi-green hover:text-equi-light-green transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg> Añadir
                  </button>
                </div>
                
                <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold">Vacunación Anual</p>
                    <p className="text-sm text-gray-600">15/05/2023</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Dr. Ana Veterinaria</p>
                  <p className="text-sm">Vacunas administradas: Tétanos, Influenza Equina. Próxima vacunación: Mayo 2024.</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold">Revisión por Cojera</p>
                    <p className="text-sm text-gray-600">02/02/2023</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Dr. Pedro Veterinario</p>
                  <p className="text-sm">Diagnóstico: Inflamación en el menudillo posterior derecho. Tratamiento: Antiinflamatorios y reposo.</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xl font-display font-semibold">Historial de Servicios</h4>
                  <div className="flex space-x-2">
                    <button className="text-sm text-equi-charcoal px-2 py-1 bg-white rounded hover:bg-gray-100 transition">Herraje</button>
                    <button className="text-sm text-equi-charcoal px-2 py-1 bg-white rounded hover:bg-gray-100 transition">Dental</button>
                    <button className="text-sm text-equi-charcoal px-2 py-1 bg-white rounded hover:bg-gray-100 transition">Fisio</button>
                    <button className="text-sm text-equi-charcoal px-2 py-1 bg-white rounded hover:bg-gray-100 transition">Todos</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between mb-1">
                      <p className="font-semibold">Herraje Completo</p>
                      <p className="text-sm text-gray-600">10/10/2023</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Miguel Herrador</p>
                    <p className="text-sm">Herraje de las cuatro extremidades. Corrección menor en posterior izquierdo.</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between mb-1">
                      <p className="font-semibold">Limpieza Dental</p>
                      <p className="text-sm text-gray-600">25/09/2023</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Laura Dentista Equina</p>
                    <p className="text-sm">Limpieza rutinaria y eliminación de puntas dentales. Próxima revisión: Marzo 2024.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
