// Shared constants for retrospective functionality

export const RETRO_CATEGORIES = {
  WENT_WELL: 'went_well' as const,
  IMPROVE: 'improve' as const,
  ACTION_ITEMS: 'action_items' as const,
}

export const RETRO_CATEGORY_LABELS = {
  [RETRO_CATEGORIES.WENT_WELL]: 'What went well?',
  [RETRO_CATEGORIES.IMPROVE]: 'What could be improved?',
  [RETRO_CATEGORIES.ACTION_ITEMS]: 'Action items',
}

export const RETRO_SESSION_STATUS = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
}

export const RETRO_SESSION_STATUS_LABELS = {
  [RETRO_SESSION_STATUS.DRAFT]: 'Draft',
  [RETRO_SESSION_STATUS.ACTIVE]: 'Active',
  [RETRO_SESSION_STATUS.COMPLETED]: 'Completed',
}

export const API_ENDPOINTS = {
  HEALTH: '/health',
  RETRO_SESSIONS: '/retro/sessions',
  RETRO_ITEMS: '/retro/sessions/:sessionId/items',
  RETRO_ITEM: '/retro/items/:id',
} as const

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const
