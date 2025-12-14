/**
 * Password encryption/decryption utilities
 * Uses simple ASCII shift: each character is replaced with the next character in ASCII code
 */

/**
 * Encrypts a password by shifting each character by +1 in ASCII
 * @param password - Plain text password
 * @returns Encrypted password
 */
export function encryptPassword(password: string): string {
  return password
    .split('')
    .map(char => String.fromCharCode(char.charCodeAt(0) + 1))
    .join('')
}

/**
 * Decrypts a password by shifting each character by -1 in ASCII
 * @param encryptedPassword - Encrypted password
 * @returns Plain text password
 */
export function decryptPassword(encryptedPassword: string): string {
  return encryptedPassword
    .split('')
    .map(char => String.fromCharCode(char.charCodeAt(0) - 1))
    .join('')
}

/**
 * Validates a password against an encrypted password
 * @param plainPassword - Plain text password to validate
 * @param encryptedPassword - Encrypted password from database
 * @returns True if passwords match
 */
export function validatePassword(plainPassword: string, encryptedPassword: string): boolean {
  const encrypted = encryptPassword(plainPassword)
  return encrypted === encryptedPassword
}

