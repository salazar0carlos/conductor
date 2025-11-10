interface StatCardProps {
  label: string
  value: number | string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-neutral-700',
    primary: 'border-blue-500/20 bg-blue-500/5',
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    error: 'border-red-500/20 bg-red-500/5'
  }

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <p className="text-sm text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}
