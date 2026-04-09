import { Users, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { FacilitatedRetroItem } from '@yet-another-retro-tool/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface RetroListItemProps {
  retro: FacilitatedRetroItem
}

const getPhaseDisplayName = (phase: string): string => {
  switch (phase) {
    case 'setup':
      return 'Setup'
    case 'writing':
      return 'Writing'
    case 'grouping':
      return 'Grouping'
    case 'voting':
      return 'Voting'
    case 'discussing':
      return 'Discussing'
    default:
      return phase
  }
}

const getPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'setup':
      return 'bg-gray-100 text-gray-800'
    case 'writing':
      return 'bg-blue-100 text-blue-800'
    case 'grouping':
      return 'bg-yellow-100 text-yellow-800'
    case 'voting':
      return 'bg-purple-100 text-purple-800'
    case 'discussing':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function RetroListItem({ retro }: RetroListItemProps) {
  const navigate = useNavigate()

  const handleViewRetro = () => {
    navigate(`/retro/${retro.participantCode}`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {retro.name}
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(
              retro.currentPhase
            )}`}
          >
            {getPhaseDisplayName(retro.currentPhase)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <div>Created: {formatDate(retro.createdAt)}</div>
            {retro.updatedAt !== retro.createdAt && (
              <div>Updated: {formatDate(retro.updatedAt)}</div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{retro.participantCount} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{retro.cardCount} cards</span>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewRetro}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              View Retro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}