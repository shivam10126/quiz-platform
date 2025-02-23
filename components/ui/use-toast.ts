"use client"

import { useState, useEffect } from "react"

interface ToastProps {
  title: string
  description?: string
  duration?: number
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastProps | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, toast.duration || 3000)

      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (props: ToastProps) => {
    setToast(props)
  }

  return { toast, showToast }
}

