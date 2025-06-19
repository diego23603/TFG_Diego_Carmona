import OpenAI from "openai";
import { log } from "./vite";

// Inicializar el cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sistema de IA para profesionales equinos
export async function getAIResponse(
  prompt: string,
  userType?: string,
  history: { role: "user" | "assistant", content: string }[] = []
): Promise<string> {
  try {
    // El sistema prompt varía según el tipo de profesional
    let systemPrompt = "Eres un asistente especializado en cuidados equinos";
    
    // Personalizar el conocimiento por tipo de profesional
    switch (userType) {
      case "vet":
        systemPrompt = "Eres un veterinario equino experto, con amplio conocimiento en enfermedades, tratamientos y cuidados médicos de caballos. Proporciona consejos médicos precisos pero recuerda que siempre se debe recomendar una visita presencial para diagnósticos definitivos.";
        break;
      case "farrier":
        systemPrompt = "Eres un herrador equino profesional, con experiencia en el cuidado de cascos, herraje y problemas podales de caballos. Ofrece consejos sobre mantenimiento de cascos y soluciones para problemas comunes de herraje.";
        break;
      case "physio":
        systemPrompt = "Eres un fisioterapeuta equino, especializado en terapias físicas, rehabilitación y manejo del dolor en caballos. Proporciona recomendaciones sobre ejercicios, estiramientos y técnicas para mejorar la movilidad y bienestar físico.";
        break;
      case "dentist":
        systemPrompt = "Eres un dentista equino profesional, experto en salud dental de caballos, problemas de masticación y cuidados bucales. Ofrece consejos sobre signos de problemas dentales y mantenimiento preventivo.";
        break;
      case "trainer":
        systemPrompt = "Eres un entrenador equino profesional, con experiencia en doma, comportamiento y entrenamiento de caballos. Proporciona técnicas de entrenamiento basadas en refuerzo positivo y soluciones para problemas de comportamiento.";
        break;
      case "cleaner":
        systemPrompt = "Eres un especialista en limpieza y mantenimiento de vehículos para transporte equino. Ofreces consejos sobre productos de limpieza seguros para caballos, mantenimiento preventivo y soluciones para problemas comunes en vehículos.";
        break;
      default:
        systemPrompt = "Eres un especialista en cuidados equinos, con conocimiento general sobre caballos y su bienestar. Proporciona consejos generales sobre el cuidado y manejo de caballos.";
    }
    
    // Añadir contexto y restricciones
    systemPrompt += " Responde en español, de manera concisa y útil. Evita información que pueda ser peligrosa para la salud del animal. Cuando sea apropiado, sugiere consultar al profesional en persona.";
    
    // Construir los mensajes para la API
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: prompt }
    ];
    
    // El modelo más reciente de OpenAI es "gpt-4o" que fue lanzado en mayo de 2024. No cambiar a menos que sea explícitamente solicitado por el usuario
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return response.choices[0].message.content || "No pude generar una respuesta. Por favor, intenta de nuevo.";
  } catch (error) {
    log(`Error en OpenAI API: ${error}`, "openai");
    return "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.";
  }
}