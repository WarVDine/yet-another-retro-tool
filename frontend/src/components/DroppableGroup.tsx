import { useDrop } from 'react-dnd'

interface DroppableGroupProps {
  groupId: string
  isFacilitator: boolean
  isGroupingPhase: boolean
  onDropCard: (draggedCardId: string, targetGroupId: string) => void
  children: React.ReactNode
}

interface DragItem {
  type: string
  id: string
}

export function DroppableGroup({
  groupId,
  isFacilitator,
  isGroupingPhase,
  onDropCard,
  children,
}: DroppableGroupProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: DragItem) => {
      onDropCard(item.id, groupId)
    },
    canDrop: () => {
      return isFacilitator && isGroupingPhase
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  }), [groupId, isFacilitator, isGroupingPhase, onDropCard])

  return (
    <div
      ref={drop}
      className={`
        ${isOver ? 'ring-2 ring-green-400 ring-offset-2' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  )
}