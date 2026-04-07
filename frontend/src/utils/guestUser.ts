// Guest user management utilities for localStorage

const GUEST_ID_KEY = 'retro-guest-id'

/**
 * Gets existing guest ID from localStorage
 */
export function getStoredGuestId(): string | null {
  try {
    return localStorage.getItem(GUEST_ID_KEY)
  } catch (error) {
    console.error('Error reading guest ID from localStorage:', error)
    return null
  }
}

/**
 * Stores guest ID in localStorage
 */
export function storeGuestId(guestId: string): void {
  try {
    localStorage.setItem(GUEST_ID_KEY, guestId)
  } catch (error) {
    console.error('Error storing guest ID in localStorage:', error)
  }
}

/**
 * Clears guest data from localStorage (useful for testing)
 */
export function clearGuestData(): void {
  try {
    localStorage.removeItem(GUEST_ID_KEY)
  } catch (error) {
    console.error('Error clearing guest data from localStorage:', error)
  }
}

export const guestUserUtils = {
  getStoredGuestId,
  storeGuestId,
  clearGuestData
}