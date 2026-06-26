import { clsx } from '../../lib/clsx'

type ButtonVariant = 'primary' | 'secondary' | 'text'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center px-6 py-3.5 text-sm transition-all duration-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed'

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-ink text-paper font-display hover:bg-ink-light',
    secondary:
      'bg-transparent border border-accent-gold/40 text-ink font-body italic hover:border-accent hover:text-accent',
    text: 'bg-transparent text-ink-muted font-body italic hover:text-ink px-2 py-2',
  }

  return (
    <button
      className={clsx(base, variants[variant], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-pulse-slow font-display italic">One moment...</span>
      ) : (
        children
      )}
    </button>
  )
}
