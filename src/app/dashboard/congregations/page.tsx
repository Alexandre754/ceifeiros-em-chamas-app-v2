"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, MapPin, Users, Edit, Trash2, Church, Loader2, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface Congregation {
  id: number
  name: string
  city: string
  state: string
  address: string | null
  isHeadquarters: boolean
  createdAt: string
  updatedAt: string
}

export default function CongregationsPage() {
  const { user } = useAuth()
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingCongregation, setEditingCongregation] = useState<Congregation | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [congregationToDelete, setCongregationToDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    address: "",
    isHeadquarters: false
  })

  useEffect(() => {
    fetchCongregations()
  }, [])

  const fetchCongregations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/congregations')

      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
      } else {
        toast.error("Erro ao carregar congregações")
      }
    } catch (error) {
      console.error('Error fetching congregations:', error)
      toast.error("Erro ao carregar congregações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const url = editingCongregation 
        ? `/api/congregations/${editingCongregation.id}` 
        : '/api/congregations'
      
      const method = editingCongregation ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(
          editingCongregation 
            ? "Congregação atualizada com sucesso!" 
            : "Congregação criada com sucesso!",
          { icon: <CheckCircle2 className="h-4 w-4" /> }
        )
        setOpen(false)
        resetForm()
        fetchCongregations()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar congregação")
      }
    } catch (error) {
      console.error('Error saving congregation:', error)
      toast.error("Erro ao salvar congregação")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (congregation: Congregation) => {
    setEditingCongregation(congregation)
    setFormData({
      name: congregation.name,
      city: congregation.city,
      state: congregation.state,
      address: congregation.address || "",
      isHeadquarters: congregation.isHeadquarters
    })
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!congregationToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/congregations/${congregationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Congregação excluída com sucesso!")
        fetchCongregations()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir congregação")
      }
    } catch (error) {
      console.error('Error deleting congregation:', error)
      toast.error("Erro ao excluir congregação")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCongregationToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", city: "", state: "", address: "", isHeadquarters: false })
    setEditingCongregation(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  const totalMembers = 1234 // This would come from a members count API
  const headquarters = congregations.find(c => c.isHeadquarters)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Congregações</h1>
            <p className="text-muted-foreground">
              Gerencie todas as congregações da igreja
            </p>
          </div>
          
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus size={20} />
                Nova Congregação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCongregation ? "Editar Congregação" : "Adicionar Nova Congregação"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCongregation 
                      ? "Atualize os dados da congregação" 
                      : "Preencha os dados da nova congregação"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Congregação *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        maxLength={2}
                        placeholder="SP"
                        required
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingCongregation ? "Atualizar" : "Salvar Congregação"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Congregações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{congregations.length}</div>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Em todas as congregações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{headquarters?.city || '-'}</div>
              <p className="text-xs text-muted-foreground">{headquarters?.name || 'Não definida'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cidades Alcançadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(congregations.map(c => c.city)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                {congregations.length > 0 ? `No estado de ${congregations[0].state}` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : congregations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma congregação cadastrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Clique em "Nova Congregação" para adicionar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Congregations Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {congregations.map((congregation) => (
                <Card key={congregation.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                          <Church size={24} />
                        </div>
                        <div>
                          <CardTitle>{congregation.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin size={14} />
                            {congregation.city}, {congregation.state}
                          </CardDescription>
                        </div>
                      </div>
                      {congregation.isHeadquarters && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Sede
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {congregation.address && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="text-sm">{congregation.address}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2"
                        onClick={() => handleEdit(congregation)}
                      >
                        <Edit size={16} />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          setCongregationToDelete(congregation.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista Completa de Congregações</CardTitle>
                <CardDescription>Todas as informações detalhadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cidade/Estado</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {congregations.map((congregation) => (
                        <TableRow key={congregation.id}>
                          <TableCell className="font-medium">{congregation.name}</TableCell>
                          <TableCell>{congregation.city}/{congregation.state}</TableCell>
                          <TableCell>{congregation.address || '-'}</TableCell>
                          <TableCell>
                            {congregation.isHeadquarters ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Sede
                              </Badge>
                            ) : (
                              <Badge variant="outline">Congregação</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(congregation)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setCongregationToDelete(congregation.id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 size={16} className="text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta congregação? Esta ação não pode ser desfeita e pode afetar os membros vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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