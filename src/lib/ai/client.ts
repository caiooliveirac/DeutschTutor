/**
 * DEPRECATED — use @/lib/ai/providers instead.
 *
 * This file is kept for backward compatibility only.
 * All API routes now import from @/lib/ai/providers.
 */

export { classifyProviderError as classifyAIError } from "./providers";

/** @deprecated Use resolveProviders() from @/lib/ai/providers */
export const MODEL = "claude-sonnet-4-20250514";
/** @deprecated Use resolveProviders() from @/lib/ai/providers */
export const MODEL_FAST = "claude-sonnet-4-20250514";

