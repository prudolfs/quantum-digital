import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'qd-button inline-flex gap-3 items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'qd-button--filled bg-brand text-canvas hover:bg-brand/90',
        outline:
          'border border-border bg-transparent text-white hover:bg-surface-raised',
        text: 'bg-transparent text-ice hover:bg-surface-raised',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-12 px-4 py-2',
        sm: 'min-h-10 gap-2 rounded-md px-3 text-sm',
        lg: 'min-h-14 rounded-md px-6 py-2',
        icon: 'size-9 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
