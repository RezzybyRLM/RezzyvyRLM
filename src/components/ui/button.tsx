import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md active:bg-primary-700',
        destructive: 'bg-accent text-white hover:bg-accent/90 shadow-sm hover:shadow-md',
        outline: 'border border-primary-500 bg-white text-primary-600 hover:bg-primary-50',
        secondary: 'bg-secondary text-white hover:bg-secondary-600 shadow-sm hover:shadow-md',
        soft: 'bg-primary-100 text-primary-700 hover:bg-primary-200',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-full px-4',
        lg: 'h-12 rounded-full px-8 text-base',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
