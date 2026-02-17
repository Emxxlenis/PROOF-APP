/**
 * Google Gemini AI Service
 *
 * Centralized service for AI content generation using Google Gemini API.
 * Implements automatic model fallback, retry logic with exponential backoff,
 * and Ollama fallback for local development.
 *
 * @remarks
 * Free Tier Limits (as of 2024):
 * - 15 requests per minute
 * - 1,500 requests per day
 *
 * @module lib/gemini
 * @see https://ai.google.dev/gemini-api/docs
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

/**
 * Environment flag to force local model usage (Ollama).
 * When true, bypasses Gemini API entirely.
 */
const USE_LOCAL_MODEL = process.env.USE_LOCAL_MODEL === "true";

/** Gemini API key from environment */
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";

/** Primary Gemini model to use */
const GEMINI_MODEL = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";

/** Ollama base URL for local development */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

/** Local model name for Ollama */
const LOCAL_MODEL_NAME = process.env.LOCAL_MODEL_NAME || "llama3.2:3b";

/** Google Generative AI client instance */
let genAI: GoogleGenerativeAI | null = null;

/**
 * Ordered list of Gemini models to attempt on 404 errors.
 * Models are tried in sequence until one succeeds.
 *
 * @remarks
 * Model availability varies by region and account tier.
 * This fallback strategy ensures maximum availability.
 */
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

// Initialize Gemini client if API key is available
if (GEMINI_API_KEY && !USE_LOCAL_MODEL) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Chat message format for AI conversations.
 */
export interface ChatMessage {
  /** Message role: system instructions, user input, or assistant response */
  role: "system" | "user" | "assistant";
  /** Message content text */
  content: string;
}

/**
 * Configuration options for content generation.
 */
export interface GenerateOptions {
  /** Sampling temperature (0.0-1.0). Higher = more creative. Default: 0.7 */
  temperature?: number;
  /** Maximum tokens in response. Default: 8192 */
  maxTokens?: number;
  /** Enable JSON output mode. Default: false */
  jsonMode?: boolean;
  /** Request timeout in milliseconds. Default: 60000 (60s) */
  timeout?: number;
}

/**
 * Result from content generation.
 */
export interface GenerateResult {
  /** Generated text content */
  content: string;
  /** Estimated or actual token count used */
  tokensUsed?: number;
}

/**
 * Promise-based delay utility for retry logic.
 * @internal
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates AI content using Google Gemini API with automatic retry and fallback.
 *
 * Implements a robust generation strategy:
 * 1. Attempts primary model (GEMINI_MODEL)
 * 2. On 404, tries fallback models in sequence
 * 3. On 429 (rate limit), retries with exponential backoff (1s, 2s, 4s)
 * 4. On timeout, retries up to maxRetries times
 * 5. Falls back to Ollama if USE_LOCAL_MODEL or no API key
 *
 * @param messages - Array of chat messages (system, user, assistant)
 * @param options - Generation configuration options
 * @returns Generated content with optional token count
 *
 * @throws {Error} When all models fail or client not initialized
 * @throws {Error} On 400 Bad Request (configuration error)
 *
 * @remarks
 * Time complexity: O(n * m * r) where n=models, m=messages, r=retries
 * Gemini lacks native "system" role; system messages are prepended to first user message.
 *
 * @example
 * ```ts
 * const result = await generateContent([
 *   { role: "system", content: "You are a helpful assistant." },
 *   { role: "user", content: "Explain TypeScript generics." }
 * ], { temperature: 0.5 });
 * ```
 */
export async function generateContent(
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const {
    temperature = 0.7,
    maxTokens = 8192,
    timeout = 60000,
  } = options;

  // Route to Ollama for local development or missing API key
  if (USE_LOCAL_MODEL || !GEMINI_API_KEY) {
    return generateWithOllama(messages, options);
  }

  if (!genAI) {
    throw new Error("Gemini client not initialized. Check GOOGLE_GEMINI_API_KEY.");
  }

  // Build model queue: primary model first, then fallbacks
  const modelsToTry = [GEMINI_MODEL, ...FALLBACK_MODELS.filter(m => m !== GEMINI_MODEL)];
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const geminiModel = genAI.getGenerativeModel({ model: modelName });

      // Convert to Gemini format (no native "system" role support)
      let systemPrompt = "";
      const geminiMessages: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      for (const msg of messages) {
        if (msg.role === "system") {
          systemPrompt += msg.content + "\n\n";
        } else if (msg.role === "user") {
          // Prepend accumulated system prompt to first user message
          const content = systemPrompt ? systemPrompt + msg.content : msg.content;
          systemPrompt = "";
          geminiMessages.push({
            role: "user",
            parts: [{ text: content }],
          });
        } else if (msg.role === "assistant") {
          geminiMessages.push({
            role: "model",
            parts: [{ text: msg.content }],
          });
        }
      }

      // Handle system-only prompts (no user message)
      if (systemPrompt && geminiMessages.length === 0) {
        geminiMessages.push({
          role: "user",
          parts: [{ text: systemPrompt }],
        });
      }

      // Generation config (responseMimeType not universally supported)
      const generationConfig: any = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const chat = geminiModel.startChat({
            history: geminiMessages.slice(0, -1),
            generationConfig,
          });

          const lastMessage = geminiMessages[geminiMessages.length - 1];

          const resultPromise = chat.sendMessage(lastMessage.parts[0].text);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini request timeout")), timeout)
          );

          const result = await Promise.race([resultPromise, timeoutPromise]);
          const response = result.response;
          const text = response.text();

          // Token estimation fallback when API doesn't return usage metadata
          const tokensUsed = (response as any).usageMetadata?.totalTokenCount ||
            Math.ceil((systemPrompt.length + messages.map(m => m.content).join("").length + text.length) / 4);

          return {
            content: text,
            tokensUsed,
          };
        } catch (error: any) {
          const errorMessage = error.message || "";

          // 404: Model not found - try next model
          if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            logger.warn(`Model ${modelName} not found, trying fallback`, { model: modelName });
            lastError = error;
            break;
          }

          // 400: Configuration error - fail fast
          if (errorMessage.includes("400") || errorMessage.includes("Bad Request")) {
            throw error;
          }

          // 429: Rate limit - exponential backoff retry
          if (errorMessage.includes("429") || errorMessage.includes("quota") ||
              (errorMessage.includes("rate") && errorMessage.includes("limit"))) {
            const waitTime = Math.pow(2, attempt) * 1000;
            logger.warn(`Rate limit hit, retrying in ${waitTime}ms`, { attempt: attempt + 1, maxRetries });
            await delay(waitTime);
            continue;
          }

          // Timeout - simple retry
          if (errorMessage.includes("timeout")) {
            logger.warn(`Request timeout`, { attempt: attempt + 1, maxRetries });
            continue;
          }

          throw error;
        }
      }
    } catch (error: any) {
      // 404: Continue to next model
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error(`Failed to generate content. Tried models: ${modelsToTry.join(", ")}`);
}

/**
 * Generates content using local Ollama instance via OpenAI-compatible API.
 *
 * @param messages - Chat messages to process
 * @param options - Generation options
 * @returns Generated content result
 *
 * @remarks
 * Uses dynamic import to avoid bundling OpenAI SDK when not needed.
 * Ollama doesn't require a real API key; "ollama" is used as placeholder.
 *
 * @internal
 */
async function generateWithOllama(
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const { temperature = 0.7, jsonMode = false, timeout = 60000 } = options;

  const OpenAI = (await import("openai")).default;

  const client = new OpenAI({
    baseURL: OLLAMA_BASE_URL,
    apiKey: "ollama",
  });

  const openaiMessages = messages.map(msg => ({
    role: msg.role as "system" | "user" | "assistant",
    content: msg.content,
  }));

  const completionPromise = client.chat.completions.create({
    model: LOCAL_MODEL_NAME,
    messages: openaiMessages,
    temperature,
    ...(jsonMode && { response_format: { type: "json_object" as const } }),
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Ollama request timeout")), timeout)
  );

  const completion = await Promise.race([completionPromise, timeoutPromise]);

  return {
    content: completion.choices[0]?.message?.content || "",
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

/**
 * Generates and parses JSON content from AI response.
 *
 * Implements robust JSON extraction:
 * 1. Strips markdown code blocks (```json, ```)
 * 2. Extracts content between first { and last }
 * 3. Removes trailing commas before } or ]
 * 4. Parses and validates JSON structure
 *
 * @typeParam T - Expected JSON response type
 * @param messages - Chat messages requesting JSON output
 * @param options - Generation options (jsonMode forced true)
 * @returns Parsed JSON data with optional token count
 *
 * @throws {Error} When JSON parsing fails (includes first 500 chars of content)
 *
 * @example
 * ```ts
 * interface AnalysisResult {
 *   score: number;
 *   recommendations: string[];
 * }
 *
 * const { data } = await generateJSON<AnalysisResult>([
 *   { role: "system", content: "Return JSON with score and recommendations." },
 *   { role: "user", content: "Analyze this startup idea..." }
 * ]);
 * ```
 */
export async function generateJSON<T = any>(
  messages: ChatMessage[],
  options: Omit<GenerateOptions, "jsonMode"> = {}
): Promise<{ data: T; tokensUsed?: number }> {
  const result = await generateContent(messages, { ...options, jsonMode: true });

  let content = result.content.trim();

  // Strip markdown code blocks
  content = content.replace(/^```json\s*/i, "");
  content = content.replace(/^```\s*/i, "");
  content = content.replace(/\s*```$/i, "");

  // Extract JSON object between first { and last }
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas (common LLM output error)
  content = content.replace(/,(\s*[}\]])/g, "$1");

  try {
    const data = JSON.parse(content) as T;
    return { data, tokensUsed: result.tokensUsed };
  } catch (parseError: any) {
    throw new Error(`Failed to parse JSON response: ${parseError.message}\nContent: ${content.substring(0, 500)}`);
  }
}

/**
 * Checks if Gemini API is configured and available.
 *
 * @returns true if Gemini is ready for use, false if falling back to Ollama
 *
 * @example
 * ```ts
 * if (isGeminiAvailable()) {
 *   console.log("Using cloud AI");
 * } else {
 *   console.log("Using local AI");
 * }
 * ```
 */
export function isGeminiAvailable(): boolean {
  return !USE_LOCAL_MODEL && !!GEMINI_API_KEY && !!genAI;
}

/**
 * Returns information about the current AI model configuration.
 *
 * @returns Object with model name and type (gemini or ollama)
 *
 * @example
 * ```ts
 * const { name, type } = getModelInfo();
 * logger.info(`Using ${type} model: ${name}`);
 * ```
 */
export function getModelInfo(): { name: string; type: "gemini" | "ollama" } {
  if (USE_LOCAL_MODEL || !GEMINI_API_KEY) {
    return { name: LOCAL_MODEL_NAME, type: "ollama" };
  }
  return { name: GEMINI_MODEL, type: "gemini" };
}

/** Current model name based on configuration */
export const MODEL_NAME = USE_LOCAL_MODEL || !GEMINI_API_KEY ? LOCAL_MODEL_NAME : GEMINI_MODEL;

/** Whether using local Ollama instance */
export const IS_LOCAL = USE_LOCAL_MODEL || !GEMINI_API_KEY;
