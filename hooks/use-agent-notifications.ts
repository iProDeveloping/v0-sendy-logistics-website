"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface AgentNotificationOptions {
  soundEnabled?: boolean
  browserNotificationsEnabled?: boolean
  onNewAgentRequest?: (conversationId: string, phoneNumber: string) => void
}

export function useAgentNotifications(options: AgentNotificationOptions = {}) {
  const {
    soundEnabled = true,
    browserNotificationsEnabled = true,
    onNewAgentRequest,
  } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const seenRequestsRef = useRef<Set<string>>(new Set())

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && soundEnabled) {
      // Create a simple notification sound using Web Audio API
      audioRef.current = new Audio()
      // Use a data URI for a simple notification beep
      audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVIHOZbS4a9nKQQ4j8nbrmg4BDWIwNKkZjcFNIm905hbKgYyiL3UkFYoBzGGv9WRUyYHMIC/z5NOJAUVH1pYPjIsFSMzYl1LOywYITBiXk48LxojL2FfTTo0GSQuYV9NODYaJCxjX087OBslLWJfTjg3GyYsY2BOODccJyxiYE45NxwnLGJgTjk3HCcsYmBOOTccJyxiYE45NxwnLGJgTjk3HCcsYmBOOTccJyxiYE45NxwnLGJgTjk3HCcsYmBOOTccJyxiYE45NxwnLGJgTjk3HCcsYmBOOTccJyxiYE45NxwnLGJgTjk3HCcsYmBOOTccJyxiYE45NxwnLGJgTjk3HCcsYmBO"
    }
    return () => {
      if (audioRef.current) {
        audioRef.current = null
      }
    }
  }, [soundEnabled])

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && browserNotificationsEnabled && "Notification" in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [browserNotificationsEnabled])

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors - user interaction required
      })
    }
  }, [soundEnabled])

  // Show browser notification
  const showBrowserNotification = useCallback(
    (title: string, body: string, conversationId?: string) => {
      if (
        browserNotificationsEnabled &&
        notificationPermission === "granted" &&
        typeof window !== "undefined"
      ) {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/icon-192.png",
          tag: conversationId || "agent-request",
          requireInteraction: true,
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto-close after 30 seconds
        setTimeout(() => notification.close(), 30000)
      }
    },
    [browserNotificationsEnabled, notificationPermission]
  )

  // Handle new agent request
  const handleNewAgentRequest = useCallback(
    (conversationId: string, phoneNumber: string, customerName?: string) => {
      // Check if we've already notified for this request
      if (seenRequestsRef.current.has(conversationId)) {
        return
      }
      seenRequestsRef.current.add(conversationId)

      // Play sound
      playSound()

      // Show browser notification
      const displayName = customerName || phoneNumber
      showBrowserNotification(
        "Agent Request",
        `${displayName} is requesting to speak with an agent`,
        conversationId
      )

      // Call custom handler
      onNewAgentRequest?.(conversationId, phoneNumber)
    },
    [playSound, showBrowserNotification, onNewAgentRequest]
  )

  // Clear seen requests (useful when conversation list refreshes)
  const clearSeenRequests = useCallback(() => {
    seenRequestsRef.current.clear()
  }, [])

  return {
    playSound,
    showBrowserNotification,
    handleNewAgentRequest,
    clearSeenRequests,
    notificationPermission,
    requestNotificationPermission: () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        return Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission)
          return permission
        })
      }
      return Promise.resolve("denied" as NotificationPermission)
    },
  }
}
