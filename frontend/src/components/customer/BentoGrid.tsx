import type { ReactNode } from 'react'

interface BentoGridProps {
  children: ReactNode
  className?: string
}

interface BentoCardProps {
  children: ReactNode
  className?: string
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
  onClick?: () => void
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div
      className={`
        grid grid-cols-1 md:grid-cols-4 gap-6
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  children,
  className = '',
  colSpan = 1,
  rowSpan = 1,
  onClick,
}: BentoCardProps) {
  const colSpanClasses = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
  }

  const rowSpanClasses = {
    1: 'md:row-span-1',
    2: 'md:row-span-2',
  }

  return (
    <div
      onClick={onClick}
      className={`
        ${colSpanClasses[colSpan]}
        ${rowSpanClasses[rowSpan]}
        rounded-xl overflow-hidden
        shadow-[0_1px_3px_hsla(0,0%,0%,0.04),0_10px_40px_-10px_hsla(350,50%,20%,0.08)]
        transition-all duration-150 ease-out
        ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_4px_12px_hsla(0,0%,0%,0.08)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
