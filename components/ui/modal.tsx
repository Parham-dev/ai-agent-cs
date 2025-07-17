"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib"
import { Button } from "./button"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface ModalContentProps {
  className?: string
  children: React.ReactNode
}

interface ModalHeaderProps {
  children: React.ReactNode
}

interface ModalTitleProps {
  children: React.ReactNode
}

interface ModalBodyProps {
  className?: string
  children: React.ReactNode
}

interface ModalFooterProps {
  children: React.ReactNode
}

function Modal({ open, onOpenChange, children }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

function ModalContent({ className, children }: ModalContentProps) {
  return (
    <div className={cn(
      "relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 backdrop-blur-sm max-w-4xl w-full max-h-[85vh] overflow-hidden",
      className
    )}>
      {children}
    </div>
  )
}

function ModalHeader({ children }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
      {children}
    </div>
  )
}

function ModalTitle({ children }: ModalTitleProps) {
  return (
    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
      {children}
    </h2>
  )
}

function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClose}
      className="h-8 w-8 p-0 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <X className="w-4 h-4" />
    </Button>
  )
}

function ModalBody({ className, children }: ModalBodyProps) {
  return (
    <div className={cn("p-6 overflow-y-auto max-h-[calc(85vh-120px)]", className)}>
      {children}
    </div>
  )
}

function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
      {children}
    </div>
  )
}

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter
}
