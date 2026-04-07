// Shared template definitions for retrospectives

export interface TemplateColumn {
  title: string
  description: string
  color: string
}

export interface Template {
  id: string
  name: string
  description: string
  columns: readonly TemplateColumn[]
}

export const RETRO_TEMPLATES = {
  classic: [
    { title: 'What went well?', description: 'Things that worked well this sprint', color: '#10B981' }, // green
    { title: 'What could be improved?', description: 'Areas for improvement', color: '#F59E0B' }, // yellow
    { title: 'Action items', description: 'Concrete next steps', color: '#3B82F6' } // blue
  ],
  startStopContinue: [
    { title: 'Start doing', description: 'New practices to adopt', color: '#10B981' }, // green
    { title: 'Stop doing', description: 'Practices to discontinue', color: '#EF4444' }, // red
    { title: 'Continue doing', description: 'Practices to keep', color: '#3B82F6' } // blue
  ],
  madSadGlad: [
    { title: 'Mad', description: 'Things that frustrated us', color: '#EF4444' }, // red
    { title: 'Sad', description: 'Things that disappointed us', color: '#F59E0B' }, // yellow
    { title: 'Glad', description: 'Things that made us happy', color: '#10B981' } // green
  ],
  fourLs: [
    { title: 'Liked', description: 'What we enjoyed', color: '#10B981' }, // green
    { title: 'Learned', description: 'What we discovered', color: '#3B82F6' }, // blue
    { title: 'Lacked', description: 'What was missing', color: '#F59E0B' }, // yellow
    { title: 'Longed for', description: 'What we wished for', color: '#8B5CF6' } // purple
  ]
} as const

export type TemplateKey = keyof typeof RETRO_TEMPLATES

// Template metadata for UI display
export const TEMPLATE_METADATA: Record<TemplateKey, Template> = {
  classic: {
    id: 'classic',
    name: 'Classic Retro',
    description: 'The traditional retrospective format',
    columns: RETRO_TEMPLATES.classic
  },
  startStopContinue: {
    id: 'startStopContinue',
    name: 'Start, Stop, Continue',
    description: 'Focus on behaviors and practices',
    columns: RETRO_TEMPLATES.startStopContinue
  },
  madSadGlad: {
    id: 'madSadGlad',
    name: 'Mad, Sad, Glad',
    description: 'Emotional retrospective format',
    columns: RETRO_TEMPLATES.madSadGlad
  },
  fourLs: {
    id: 'fourLs',
    name: '4 Ls',
    description: 'Comprehensive learning-focused format',
    columns: RETRO_TEMPLATES.fourLs
  }
} as const
