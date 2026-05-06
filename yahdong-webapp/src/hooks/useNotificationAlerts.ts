import { useEffect, useRef } from 'react'
import { useNotifications } from './useNotifications'
import type { Notification } from '../api/notifications'

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext may be blocked before user interaction — silently ignore
  }
}

function showBrowserNotification(notif: Notification) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const n = new Notification('การแจ้งเตือนใหม่', {
    body: `${notif.body}\n${notif.task.title}`,
    icon: '/favicon.ico',
    tag: notif.id,
    silent: true,
  })
  setTimeout(() => n.close(), 6000)
}

export function useNotificationAlerts() {
  const { data: notifications = [] } = useNotifications()
  const prevIdsRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    const unread = notifications.filter((n) => !n.readAt)

    if (prevIdsRef.current === null) {
      prevIdsRef.current = new Set(unread.map((n) => n.id))
      return
    }

    const incoming = unread.filter((n) => !prevIdsRef.current!.has(n.id))

    if (incoming.length > 0) {
      playNotificationSound()
      incoming.forEach(showBrowserNotification)
    }

    prevIdsRef.current = new Set(unread.map((n) => n.id))
  }, [notifications])
}

export async function requestBrowserNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function getBrowserNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}
