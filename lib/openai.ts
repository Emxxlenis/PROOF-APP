/**
 * Configuración y cliente para modelos de IA
 * 
 * Este módulo maneja la configuración del cliente de OpenAI compatible con Ollama.
 * Por defecto, el proyecto usa Ollama (modelo local) para ejecutar modelos de IA
 * sin necesidad de APIs externas. También soporta OpenAI en la nube como alternativa.
 * 
 * @module lib/openai
 */

import OpenAI from "openai";

/**
 * Determina si se debe usar el modelo local (Ollama) o API en la nube
 * Por defecto es true (usa Ollama local)
 */
const USE_LOCAL_MODEL = process.env.USE_LOCAL_MODEL !== "false";

/**
 * URL base de Ollama. Por defecto apunta a servidor remoto
 */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://172.171.197.143:11434/v1";

/**
 * Nombre del modelo local a usar
 * 
 * Opciones recomendadas:
 * - llama3.1:8b: Balance calidad/velocidad (~5GB, recomendado)
 * - llama3.1:70b: Máxima calidad (requiere 32GB+ RAM)
 * - llama3.2:3b: Rápido y ligero (~2GB) - Configurado por defecto para MVP
 */
const LOCAL_MODEL_NAME = process.env.LOCAL_MODEL_NAME || "llama3.2:3b";

/**
 * Cliente de OpenAI (compatible con Ollama)
 * Se inicializa según la configuración de USE_LOCAL_MODEL
 */
let openaiClient: OpenAI;

/**
 * Nombre del modelo a usar (local o nube)
 */
let modelName: string;

// Inicializar cliente según configuración
// Note: Initialization logs removed - configuration is determined at runtime
if (USE_LOCAL_MODEL) {
  // Configuración para Ollama (modelo local)
  openaiClient = new OpenAI({
    baseURL: OLLAMA_BASE_URL,
    apiKey: "ollama", // Ollama no requiere API key real, pero el SDK de OpenAI la necesita
  });
  modelName = LOCAL_MODEL_NAME;
} else {
  // Configuración para OpenAI (nube)
  if (!process.env.OPENAI_API_KEY) {
    // Fallback a Ollama si no hay API key configurada
    openaiClient = new OpenAI({
      baseURL: OLLAMA_BASE_URL,
      apiKey: "ollama",
    });
    modelName = LOCAL_MODEL_NAME;
  } else {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    modelName = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
  }
}

/**
 * Cliente de OpenAI configurado para usar con Ollama o OpenAI
 * 
 * @example
 * ```typescript
 * import { openai, MODEL_NAME } from '@/lib/openai';
 * 
 * const completion = await openai.chat.completions.create({
 *   model: MODEL_NAME,
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 * ```
 */
export const openai = openaiClient;

/**
 * Nombre del modelo actual (local o nube)
 */
export const MODEL_NAME = modelName;
