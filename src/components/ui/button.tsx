import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'qd-button inline-flex gap-3 items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'qd-button--filled bg-brand text-canvas hover:bg-brand/90',
        outline:
          'border border-border bg-transparent text-white hover:bg-surface-raised',
        text: 'bg-transparent text-ice hover:bg-surface-raised',
      },
      size: {
        default: 'min-h-12 px-4 py-2',
        sm: 'min-h-10 rounded-md px-3 text-sm',
        lg: 'min-h-14 rounded-md px-6 py-2',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
