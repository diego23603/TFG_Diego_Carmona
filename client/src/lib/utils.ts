import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un precio en céntimos a un string formateado en euros
 * @param cents Precio en céntimos (ej: 10000 para 100€)
 * @returns String formateado (ej: "100,00 €")
 */
export function formatPriceFromCents(cents: number | string | null | undefined): string {
  if (cents === undefined || cents === null) {
    return "Precio no definido";
  }
  
  const value = typeof cents === 'string' ? parseFloat(cents) : cents;
  
  // Importante: convertir de centavos a euros (dividir por 100)
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR'
  }).format(value / 100);
}
