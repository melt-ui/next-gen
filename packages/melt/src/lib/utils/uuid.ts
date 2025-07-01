
/**
 * Generates a random UUID v4 string using crypto.randomUUID(), fallbacking to Math.random() if Crypto API is unavailable.
 * (unsecure browser when using http for example)
 *
 * NOTE: The fallback is not cryptographically secure. Use this for non-security-critical
 * applications or in environments where the Web Crypto API is unavailable.
 *
 * @returns {string} A new UUID v4 string.
 */
function randomUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
    return generateUuidV4Math();
}



/**
 * Generates a random UUID v4 string using Math.random().
 *
 * NOTE: This is not cryptographically secure. Use this for non-security-critical
 * applications or in environments where the Web Crypto API is unavailable.
 *
 * @returns {string} A new UUID v4 string.
 */
function generateUuidV4Math(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}