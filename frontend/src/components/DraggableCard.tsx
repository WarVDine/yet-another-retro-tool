import { useDrag, useDrop } from 'react-dnd'

interface DraggableCardProps {
  id: string
  type: string
  isFacilitator: boolean
  isGroupingPhase: boolean
  onDropCard: (draggedCardId: string, targetCardId: string) => void
  children: React.ReactNode
}

interface DragItem {
  type: string
  id: string
}

export function DraggableCard({
  id,
  type,
  isFacilitator,
  isGroupingPhase,
  onDropCard,
  children,
}: DraggableCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, id },
    canDrag: isFacilitator && isGroupingPhase,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, type, isFacilitator, isGroupingPhase])

  const [{ isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: (item: DragItem) => {
      if (item.id !== id) {
        onDropCard(item.id, id)
      }
    },
    canDrop: (item: DragItem) => {
      return isFacilitator && isGroupingPhase && item.id !== id
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  }), [id, type, isFacilitator, isGroupingPhase, onDropCard])

  // Combine drag and drop refs
  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(node)
    drop(node)
  }

  return (
    <div
      ref={dragDropRef}
      className={`
        ${isDragging ? 'opacity-50' : ''}
        ${isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        ${isFacilitator && isGroupingPhase ? 'cursor-move' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  )
}