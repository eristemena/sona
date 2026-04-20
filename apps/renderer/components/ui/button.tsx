import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-[6px] border px-4 text-[14px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
        secondary:
          "border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--text-secondary)] hover:bg-[color:var(--accent-subtle)] hover:text-[color:var(--text-primary)]",
        danger:
          "border-transparent bg-[color:color-mix(in_srgb,var(--danger)_15%,transparent)] text-[color:var(--danger)] hover:bg-[color:color-mix(in_srgb,var(--danger)_24%,transparent)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />
})

Button.displayName = 'Button'

export { Button, buttonVariants }