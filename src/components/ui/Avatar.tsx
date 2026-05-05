import { clsx } from 'clsx'

const COLORS = [
  'from-orange-400 to-red-500',
  'from-blue-400 to-blue-600',
  'from-green-400 to-emerald-600',
  'from-purple-400 to-violet-600',
  'from-pink-400 to-rose-500',
  'from-teal-400 to-cyan-600',
  'from-amber-400 to-orange-500',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')
}

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div className={clsx(
      'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0',
      sizeMap[size],
      getColor(name),
      className
    )}>
      {getInitials(name)}
    </div>
  )
}
