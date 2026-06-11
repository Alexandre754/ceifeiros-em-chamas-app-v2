"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Play, Download, Eye, Loader2, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Sermon {
  id: number
  congregationId: number
  title: string
  preacher: string
  date: string
  duration: string | null
  category: string | null
  description: string | null
  mediaUrl: string | null
  mediaType: string | null
  thumbnailUrl: string | null
  views: number
  downloads: number
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

export default function SermonsPage() {
  const { user } = useAuth()
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sermonToEdit, setSermonToEdit] = useState<Sermon | null>(null)
  const [sermonToDelete, setSermonToDelete] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [congregations, setCongregations] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    congregationId: user?.congregationId || "",
    title: "",
    preacher: "",
    date: new Date().toISOString().split('T')[0],
    duration: "",
    category: "mensagem",
    description: "",
    mediaUrl: "",
    mediaType: "",
    thumbnailUrl: ""
  })

  useEffect(() => {
    fetchSermons()
    fetchCongregations()
  }, [])

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

  const fetchSermons = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch('/api/sermons', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar sermões')
      }

      const data = await response.json()
      setSermons(data.sermons || [])
    } catch (error: any) {
      console.error('Erro ao buscar sermões:', error)
      toast.error(error.message || "Erro ao carregar sermões")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, isEdit: boolean = false) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const url = isEdit && sermonToEdit ? `/api/sermons/${sermonToEdit.id}` : '/api/sermons'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          congregationId: parseInt(formData.congregationId as string),
          title: formData.title,
          preacher: formData.preacher,
          date: formData.date,
          duration: formData.duration || null,
          category: formData.category || null,
          description: formData.description || null,
          mediaUrl: formData.mediaUrl || null,
          mediaType: formData.mediaType || null,
          thumbnailUrl: formData.thumbnailUrl || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Erro ao ${isEdit ? 'atualizar' : 'criar'} sermão`)
      }

      toast.success(`Sermão ${isEdit ? 'atualizado' : 'criado'} com sucesso!`)
      setAddDialogOpen(false)
      setEditDialogOpen(false)
      resetForm()
      fetchSermons()
    } catch (error: any) {
      console.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} sermão:`, error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!sermonToDelete) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/sermons/${sermonToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir sermão')
      }

      toast.success("Sermão excluído com sucesso!")
      setDeleteDialogOpen(false)
      fetchSermons()
    } catch (error: any) {
      console.error('Erro ao excluir sermão:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
      setSermonToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      congregationId: user?.congregationId || "",
      title: "",
      preacher: "",
      date: new Date().toISOString().split('T')[0],
      duration: "",
      category: "mensagem",
      description: "",
      mediaUrl: "",
      mediaType: "",
      thumbnailUrl: ""
    })
    setSermonToEdit(null)
  }

  const openEditDialog = (sermon: Sermon) => {
    setSermonToEdit(sermon)
    setFormData({
      congregationId: sermon.congregationId.toString(),
      title: sermon.title,
      preacher: sermon.preacher,
      date: sermon.date,
      duration: sermon.duration || "",
      category: sermon.category || "mensagem",
      description: sermon.description || "",
      mediaUrl: sermon.mediaUrl || "",
      mediaType: sermon.mediaType || "",
      thumbnailUrl: sermon.thumbnailUrl || ""
    })
    setEditDialogOpen(true)
  }

  const filteredSermons = sermons.filter(sermon =>
    sermon.title.toLowerCase().includes(search.toLowerCase()) ||
    sermon.preacher.toLowerCase().includes(search.toLowerCase())
  )

  const canModify = user?.role !== 'membro'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca de Sermões</h1>
            <p className="text-muted-foreground">
              Acesse e compartilhe mensagens e estudos bíblicos
            </p>
          </div>
          {canModify && (
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }} size="lg" className="gap-2">
              <Plus size={20} />
              Adicionar Sermão
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Sermões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sermons.length}</div>
              <p className="text-xs text-muted-foreground">No arquivo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sermons.filter(s => {
                  const date = new Date(s.date)
                  const now = new Date()
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Novas mensagens</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sermons.reduce((sum, s) => sum + s.views, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sermons.reduce((sum, s) => sum + s.downloads, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Para offline</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and List */}
        <Card>
          <CardHeader>
            <CardTitle>Sermões Recentes</CardTitle>
            <CardDescription>Últimas mensagens e estudos bíblicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, pregador ou tema..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : filteredSermons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum sermão encontrado</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSermons.map((sermon) => (
                  <Card key={sermon.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-muted">
                      {sermon.thumbnailUrl ? (
                        <img 
                          src={sermon.thumbnailUrl} 
                          alt={sermon.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950 dark:to-yellow-950">
                          <Play size={48} className="text-amber-600" />
                        </div>
                      )}
                      {sermon.category && (
                        <Badge className="absolute top-2 right-2 capitalize">
                          {sermon.category}
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{sermon.title}</CardTitle>
                      <CardDescription>
                        <div className="space-y-1">
                          <div>{sermon.preacher}</div>
                          <div className="text-xs">
                            {new Date(sermon.date).toLocaleDateString('pt-BR')}
                            {sermon.duration && ` • ${sermon.duration}`}
                          </div>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {sermon.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download size={14} />
                            {sermon.downloads}
                          </span>
                        </div>
                        {canModify && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(sermon)}>
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSermonToDelete(sermon.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{sermonToEdit ? 'Editar' : 'Adicionar'} Sermão</DialogTitle>
            <DialogDescription>
              Preencha as informações do sermão
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, !!sermonToEdit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {(user?.role === 'admin_geral' || (user?.role === 'admin_sede' && user?.congregation?.isHeadquarters) || user?.hasGeneralAccess === true) && (

                <div className="space-y-2 md:col-span-2">
                  <Label>Congregação *</Label>
                  <Select
                    value={formData.congregationId.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, congregationId: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {congregations.map((cong) => (
                        <SelectItem key={cong.id} value={cong.id.toString()}>
                          {cong.name} - {cong.city}/{cong.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: O Amor de Deus"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Pregador *</Label>
                <Input
                  value={formData.preacher}
                  onChange={(e) => setFormData(prev => ({ ...prev, preacher: e.target.value }))}
                  placeholder="Ex: Pastor João Silva"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Ex: 45 min"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensagem">Mensagem</SelectItem>
                    <SelectItem value="pregacao">Pregação</SelectItem>
                    <SelectItem value="estudo">Estudo Bíblico</SelectItem>
                    <SelectItem value="serie">Série</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do sermão..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddDialogOpen(false)
                setEditDialogOpen(false)
                resetForm()
              }} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  sermonToEdit ? 'Atualizar' : 'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este sermão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
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