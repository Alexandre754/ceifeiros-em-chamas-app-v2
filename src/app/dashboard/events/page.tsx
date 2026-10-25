"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Loader2, Pencil, Trash2 } from "lucide-react"
import { AddEventDialog } from "@/components/AddEventDialog"
import { EditEventDialog } from "@/components/EditEventDialog"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Event {
  id: number
  congregationId: number
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string | null
  mediaUrl: string | null
  mediaType: string | null
  category: string | null
  attendance: number | null
  createdBy: number
  status: string
  createdAt: string
  updatedAt: string
  congregation: {
    id: number
    name: string
    city: string
    state: string
  }
  creator: {
    id: number
    name: string
    email: string
  }
}

interface Congregation {
  id: number
  name: string
  city: string
  state: string
}

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchCongregations()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos')
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (error: any) {
      console.error('Erro ao buscar eventos:', error)
      toast.error(error.message || "Erro ao carregar eventos")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCongregations = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/congregations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
      }
    } catch (error) {
      console.error('Erro ao buscar congregações:', error)
    }
  }

  const handleEditClick = (event: Event) => {
    setEventToEdit(event)
    setEditDialogOpen(true)
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch(`/api/events/${eventToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir evento')
      }

      toast.success("Evento excluído com sucesso!")
      fetchEvents()
    } catch (error: any) {
      console.error('Erro ao excluir evento:', error)
      toast.error(error.message || "Erro ao excluir evento")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case "culto": return "default"
      case "celula": 
      case "célula": return "secondary"
      case "estudo": return "outline"
      case "jovens": return "destructive"
      case "infantil": return "secondary"
      case "evangelismo": return "default"
      default: return "outline"
    }
  }

  const canModifyEvent = (event: Event) => {
    if (!user) return false
    
    if (user.role === 'admin_geral') return true
    
    if (user.role === 'admin_sede' && user.congregation?.isHeadquarters) return true
    
    if (user.role === 'admin_congregacao' && event.congregationId === user.congregationId) return true
    
    return false
  }

  const activeEvents = events.filter(e => e.status === 'ativo')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Agenda de Eventos</h1>
            <p className="text-muted-foreground">
              Organize e gerencie todos os eventos da igreja
            </p>
          </div>
          {user?.role !== 'membro' && (
            <AddEventDialog onEventAdd={fetchEvents} congregations={congregations} />
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEvents.length}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cultos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeEvents.filter(e => e.category === 'culto').length}
              </div>
              <p className="text-xs text-muted-foreground">Programados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Células</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeEvents.filter(e => e.category === 'celula').length}
              </div>
              <p className="text-xs text-muted-foreground">Grupos ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Participação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeEvents.reduce((sum, e) => sum + (e.attendance || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Pessoas totais</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendário de Eventos</CardTitle>
            <CardDescription>Próximos eventos programados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : activeEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum evento programado</p>
                {user?.role !== 'membro' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em "Adicionar Evento" para criar um novo
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center w-20">
                        <div className="text-2xl font-bold">
                          {new Date(event.startDate).getDate()}
                        </div>
                        <div className="text-xs">
                          {new Date(event.startDate).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={getCategoryColor(event.category)}>
                          {event.category || 'Evento'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            {event.location}
                          </div>
                        )}
                        {event.attendance && (
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {event.attendance} pessoas
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {event.congregation.name} - {event.congregation.city}/{event.congregation.state}
                      </div>
                    </div>

                    {canModifyEvent(event) && (
                      <div className="flex md:flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 md:flex-initial gap-1"
                          onClick={() => handleEditClick(event)}
                        >
                          <Pencil size={14} />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1 md:flex-initial gap-1"
                          onClick={() => {
                            setEventToDelete(event.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 size={14} />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Event Dialog */}
      {eventToEdit && (
        <EditEventDialog
          event={eventToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onEventUpdate={fetchEvents}
          congregations={congregations}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}