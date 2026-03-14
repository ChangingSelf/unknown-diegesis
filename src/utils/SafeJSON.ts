/**
 * Safe JSON serialization utilities
 * Handles circular references and BigInt serialization
 */

export interface SafeStringifyResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Safely stringify a JavaScript value to JSON.
 * - Handles circular references by replacing them with "[Circular]".
 * - Serializes BigInt values as strings to avoid TypeError.
 * - Returns a structured result: { success, data?, error? }.
 */
export function safeStringify(obj: unknown): SafeStringifyResult {
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(obj, function (_key, value) {
      // Handle circular references
      if (value && typeof value === 'object') {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      // Serialize BigInt as string
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
    return { success: true, data: json };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export default safeStringify;
