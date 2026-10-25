"use client"

import { useState } from "react"
import { Bell, Check, Trash2, Calendar, Users, DollarSign, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface Notification {
  id: string
  type: "event" | "member" | "finance" | "message"
  title: string
  description: string
  timestamp: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "event",
    title: "Novo Evento Adicionado",
    description: "Culto de Celebração foi adicionado para domingo",
    timestamp: "2024-12-15T10:00:00",
    read: false,
  },
  {
    id: "2",
    type: "member",
    title: "Novo Membro Cadastrado",
    description: "João Silva foi adicionado ao sistema",
    timestamp: "2024-12-14T15:30:00",
    read: false,
  },
  {
    id: "3",
    type: "finance",
    title: "Dízimo Recebido",
    description: "Nova contribuição de R$ 500,00 registrada",
    timestamp: "2024-12-14T09:00:00",
    read: true,
  },
  {
    id: "4",
    type: "message",
    title: "Novo Pedido de Oração",
    description: "Maria Santos enviou um pedido de oração",
    timestamp: "2024-12-13T20:15:00",
    read: true,
  },
]

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4 text-amber-600" />
      case "member":
        return <Users className="h-4 w-4 text-blue-600" />
      case "finance":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "message":
        return <MessageSquare className="h-4 w-4 text-purple-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    return "Agora"
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success("Todas as notificações foram marcadas como lidas")
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.success("Notificação removida")
  }

  const clearAll = () => {
    setNotifications([])
    toast.success("Todas as notificações foram removidas")
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-amber-500 to-yellow-500 border-0 text-white text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-lg font-bold">Notificações</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              {unreadCount} novas
            </Badge>
          )}
        </DropdownMenuLabel>
        
        {notifications.length > 0 && (
          <>
            <div className="px-2 pb-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas como lidas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar tudo
              </Button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma notificação
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você está em dia com tudo!
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative rounded-lg p-3 hover:bg-accent transition-colors ${
                    !notification.read ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm line-clamp-1">
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex gap-2 pt-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
