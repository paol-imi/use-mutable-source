export const warnings = new Set();

/**
 * Prints with console.error a message only the first time it is used.
 *
 * @param message - the warning message
 */
export function warning(message: string) {
  if (!warnings.has(message)) {
    warnings.add(message);
    console.error(`[use-mutable-source]: ${message}`);
  }
}
