import { cloneElement, forwardRef, isValidElement } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    asChild?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-primary text-primary-foreground hover:opacity-90',
    secondary:
        'bg-secondary text-secondary-foreground hover:bg-muted',
    outline:
        'border border-border bg-transparent text-foreground hover:bg-muted',
    ghost:
        'bg-transparent text-foreground hover:bg-muted',
    destructive:
        'bg-destructive text-destructive-foreground hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
    icon: 'h-10 w-10',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, asChild, children, ...props }, ref) => {
        const classes = cn(
            'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            variantClasses[variant],
            sizeClasses[size],
            className,
        )

        if (asChild && isValidElement(children)) {
            const child = children as React.ReactElement<{ className?: string }>

            return cloneElement(child, {
                className: cn(classes, child.props.className),
                ...props,
            })
        }

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={classes}
                {...props}
            >
                {loading && (
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {children}
            </button>
        )
    },
)
Button.displayName = 'Button'
