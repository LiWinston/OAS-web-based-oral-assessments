'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

function Tooltip({ ...props }) {
  return <TooltipPrimitive.Root {...props} />
}

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(
  ({ className, side = 'top', align = 'center', sideOffset = 6, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md border border-gray-200/70 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg transition-all dark:border-gray-700/70 dark:bg-gray-900 dark:text-gray-200',
        'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className
      )}
      {...props}
    />
  )
)

TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
