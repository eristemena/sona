import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--bg-base)_78%,transparent)] backdrop-blur-[2px]',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideCloseButton?: boolean
  }
>(({ className, children, hideCloseButton = false, ...props }, ref) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-[min(100vw-2rem,40rem)] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-(--border) bg-(--bg-surface) p-6 text-(--text-primary) shadow-[0_32px_80px_rgba(0,0,0,0.35)] focus:outline-none',
          className,
        )}
        ref={ref}
        {...props}
      >
        {!hideCloseButton ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Close dialog</span>
          </DialogPrimitive.Close>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />
}

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Title
      className={cn('text-[18px] font-semibold leading-tight text-(--text-primary)', className)}
      ref={ref}
      {...props}
    />
  )
})

DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Description
      className={cn('text-[14px] leading-6 text-(--text-secondary)', className)}
      ref={ref}
      {...props}
    />
  )
})

DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}