// Shared validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateRetroTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'Title is required'
  }
  
  if (title.trim().length < 3) {
    return 'Title must be at least 3 characters long'
  }
  
  if (title.trim().length > 100) {
    return 'Title must be less than 100 characters'
  }
  
  return null
}

export const validateRetroContent = (content: string): string | null => {
  if (!content || content.trim().length === 0) {
    return 'Content is required'
  }
  
  if (content.trim().length < 5) {
    return 'Content must be at least 5 characters long'
  }
  
  if (content.trim().length > 500) {
    return 'Content must be less than 500 characters'
  }
  
  return null
}

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ')
}
