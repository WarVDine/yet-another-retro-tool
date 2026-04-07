import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Template {
  id: string
  name: string
  description: string
  columns: string[]
  color: string
}

const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic Retro',
    description: 'The traditional retrospective format',
    columns: ['What went well?', 'What could be improved?', 'Action items'],
    color: 'blue',
  },
  {
    id: 'startStopContinue',
    name: 'Start, Stop, Continue',
    description: 'Focus on behaviors and practices',
    columns: ['Start doing', 'Stop doing', 'Continue doing'],
    color: 'green',
  },
  {
    id: 'madSadGlad',
    name: 'Mad, Sad, Glad',
    description: 'Emotional retrospective format',
    columns: ['Mad', 'Sad', 'Glad'],
    color: 'purple',
  },
  {
    id: 'fourLs',
    name: '4 Ls',
    description: 'Comprehensive learning-focused format',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed for'],
    color: 'indigo',
  },
]

interface TemplateSelectorProps {
  selectedTemplate: string
  onTemplateChange: (templateId: string) => void
}

export function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  const handleKeyDown = (event: React.KeyboardEvent, templateId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onTemplateChange(templateId)
    }
  }

  return (
    <fieldset>
      <legend className="text-lg font-medium text-gray-900 mb-4">Choose a Template</legend>
      <div className="grid md:grid-cols-2 gap-4" role="radiogroup" aria-labelledby="template-legend">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
              selectedTemplate === template.id
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                : 'hover:shadow-md hover:border-gray-300'
            }`}
            onClick={() => onTemplateChange(template.id)}
          >
            <div
              role="radio"
              aria-checked={selectedTemplate === template.id}
              aria-labelledby={`template-${template.id}-title`}
              aria-describedby={`template-${template.id}-description`}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, template.id)}
              className="outline-none"
            >
              <CardHeader className="pb-3">
                <CardTitle id={`template-${template.id}-title`} className="flex items-center gap-2 text-base">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      template.color === 'blue'
                        ? 'bg-blue-500'
                        : template.color === 'green'
                          ? 'bg-green-500'
                          : template.color === 'purple'
                            ? 'bg-purple-500'
                            : 'bg-indigo-500'
                    }`}
                  />
                  {template.name}
                </CardTitle>
                <CardDescription id={`template-${template.id}-description`} className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {template.columns.map((column, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                      {column}
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </fieldset>
  )
}
