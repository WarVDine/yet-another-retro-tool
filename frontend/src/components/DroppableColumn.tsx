import { useDrop } from 'react-dnd'

interface DroppableColumnProps {
  columnId: string
  isFacilitator: boolean
  isGroupingPhase: boolean
  onDropCard: (draggedCardId: string, targetColumnId: string) => void
  children: React.ReactNode
}

interface DragItem {
  type: string
  id: string
}

export function DroppableColumn({
  columnId,
  isFacilitator,
  isGroupingPhase,
  onDropCard,
  children,
}: DroppableColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: DragItem, monitor) => {
      // Only handle drop if it wasn't handled by a card or group
      if (!monitor.didDrop()) {
        onDropCard(item.id, columnId)
      }
    },
    canDrop: () => {
      return isFacilitator && isGroupingPhase
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
  }), [columnId, isFacilitator, isGroupingPhase, onDropCard])

  return (
    <div
      ref={drop}
      className={`
        ${isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''}
        transition-all duration-200 rounded-lg
      `}
    >
      {children}
    </div>
  )
}