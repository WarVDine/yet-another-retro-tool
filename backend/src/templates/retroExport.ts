import {
  DetailedRoomResponse,
  DetailedColumnResponse,
  CardDetailResponse,
  CardGroupResponse,
  ParticipantResponse,
} from '@yet-another-retro-tool/shared'

export interface ExportData {
  room: DetailedRoomResponse
  exportDate: string
}

export interface RankedItem {
  id: string
  voteCount: number
  rank: number
  isHighlighted: boolean
}

/**
 * Generate a Markdown export of the retrospective room data
 */
export function generateRetroExportMarkdown(data: ExportData): string {
  const { room, exportDate } = data

  // Format the export date nicely
  const formattedDate = new Date(exportDate).toISOString().split('T')[0]
  const voteText = room.maxVotesPerUser === 1 ? '1 vote' : `${room.maxVotesPerUser} votes`

  const markdown = [
    `# Retro: ${room.name}`,
    // If there's a description, add it with spaces around it
    // Otherwise, just add onw new line
    room.description ? `\n**Description:** ${room.description}\n` : '',
    `Exported at: ${formattedDate}`,
    `Votes per User: ${voteText}`,
    '',
    '## Participants',
    '',
    ...generateParticipantsList(room.participants),
    '',
    ...generateColumnsContent(room.columns),
  ]

  return markdown.filter((line) => line !== null).join('\n')
}

/**
 * Generate the participants list section
 */
function generateParticipantsList(participants: ParticipantResponse[]): string[] {
  if (participants.length === 0) {
    return []
  }

  const lines: string[] = []

  // Sort participants: facilitators first, then alphabetically by name
  const sortedParticipants = [...participants].sort((a, b) => {
    // Facilitators first
    if (a.role === 'facilitator' && b.role !== 'facilitator') return -1
    if (b.role === 'facilitator' && a.role !== 'facilitator') return 1
    // Then alphabetically by display name
    return a.displayName.localeCompare(b.displayName)
  })

  sortedParticipants.forEach((participant) => {
    const roleText = participant.role === 'facilitator' ? ' (facilitator)' : ''
    lines.push(`* ${participant.displayName}${roleText}`)
  })

  return lines
}

/**
 * Generate content for all columns with ranked cards and groups
 */
function generateColumnsContent(columns: DetailedColumnResponse[]): string[] {
  const lines: string[] = []

  // Sort columns by sortOrder
  const sortedColumns = [...columns].sort((a, b) => a.sortOrder - b.sortOrder)

  sortedColumns.forEach((column, index) => {
    lines.push(`## Column: ${column.title}`)
    lines.push('')

    // Get all items (cards and groups) with vote counts
    const columnItems = getColumnItemsWithVotes(column)

    if (columnItems.length === 0) {
      lines.push('No cards')
      lines.push('')
    } else {
      // Sort by vote count descending, then by ID for consistent tie-breaking
      const rankedItems = columnItems.sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount
        }
        return a.id.localeCompare(b.id)
      })

      // Separate groups and ungrouped items
      const groups = rankedItems.filter((item) => item.type === 'group')
      const ungroupedCards = rankedItems.filter((item) => item.type === 'card')

      // Show groups first
      groups.forEach((item) => {
        const group = item.data as CardGroupResponse
        const voteText = item.voteCount === 1 ? '1 vote' : `${item.voteCount} votes`

        lines.push(`### Group: ${group.title || 'Untitled Group'} (${voteText})`)
        lines.push('')

        // Show cards within the group
        if (group.cards.length > 0) {
          group.cards.forEach((card) => {
            lines.push(`* ${card.content}`)
          })
        }
        lines.push('')
      })

      // Show ungrouped cards
      if (ungroupedCards.length > 0) {
        lines.push('### Ungrouped')
        lines.push('')

        ungroupedCards.forEach((item) => {
          const card = item.data as CardDetailResponse
          const voteText = item.voteCount === 1 ? '1 vote' : `${item.voteCount} votes`
          lines.push(`* ${card.content} (${voteText})`)
        })
        lines.push('')
      }
    }
  })

  return lines
}

/**
 * Get all items (cards and groups) from a column with their vote counts
 */
function getColumnItemsWithVotes(column: DetailedColumnResponse): Array<{
  id: string
  voteCount: number
  type: 'card' | 'group'
  data: CardDetailResponse | CardGroupResponse
}> {
  const items: Array<{
    id: string
    voteCount: number
    type: 'card' | 'group'
    data: CardDetailResponse | CardGroupResponse
  }> = []

  // Add groups first
  column.cardGroups.forEach((group) => {
    items.push({
      id: group.id,
      voteCount: group.voteCount || 0,
      type: 'group',
      data: group,
    })
  })

  // Add ungrouped cards (cards that are not in any group)
  const groupedCardIds = new Set(column.cardGroups.flatMap((group) => group.cards.map((card) => card.id)))

  column.cards.forEach((card) => {
    if (!groupedCardIds.has(card.id)) {
      items.push({
        id: card.id,
        voteCount: card.voteCount || 0,
        type: 'card',
        data: card,
      })
    }
  })

  return items
}

/**
 * Generate a safe filename for the export
 */
export function generateExportFilename(roomName: string, exportDate: string): string {
  // Sanitize room name for filesystem compatibility
  const sanitizedName = roomName
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50) // Limit length

  // Extract date part (YYYY-MM-DD)
  const datePart = exportDate.split('T')[0]

  return `${sanitizedName} - ${datePart}.md`
}
