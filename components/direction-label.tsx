import { getDirectionLabel } from '@/lib/utils'

interface DirectionLabelProps {
  direction: string
  className?: string
}

export function DirectionLabel({ direction, className }: DirectionLabelProps) {
  const label = getDirectionLabel(direction)

  if (direction === 'to-school' || direction === 'from-school') {
    const colonIdx = label.indexOf(': ')
    const prefix = label.slice(0, colonIdx)
    const main = label.slice(colonIdx + 2)
    return (
      <span className={className}>
        <span className="text-[0.7em] font-normal opacity-70">{prefix}:</span>{' '}
        <span>{main}</span>
      </span>
    )
  }

  return <span className={className}>{label}</span>
}
