"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Loader2, Pencil, Trash2, Building2, Car, Wrench, Mic } from "lucide-react"
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

interface Asset {
  id: number
  congregationId: number
  name: string
  category: string
  subcategory: string | null
  location: string | null
  propertyType: string | null
  acquisitionDate: string | null
  acquisitionValue: number | null
  currentValue: number | null
  condition: string | null
  description: string | null
  serialNumber: string | null
  photoUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
  congregation: {
    id: number
    name: string
    city: string
    state: string
  }
}

export default function AssetsPage() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [congregations, setCongregations] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    congregationId: user?.congregationId || "",
    name: "",
    category: "imovel",
    subcategory: "",
    location: "",
    propertyType: "proprio",
    acquisitionDate: "",
    acquisitionValue: "",
    currentValue: "",
    condition: "bom",
    description: "",
    serialNumber: "",
    photoUrl: ""
  })

  useEffect(() => {
    if (user) {
      fetchAssets()
      fetchCongregations()
      if (user.congregationId && !formData.congregationId) {
        setFormData(prev => ({ ...prev, congregationId: user.congregationId!.toString() }))
      }
    }
  }, [user])

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

  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch('/api/assets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar patrimônio')
      }

      const data = await response.json()
      setAssets(data.assets || [])
    } catch (error: any) {
      console.error('Erro ao buscar patrimônio:', error)
      toast.error(error.message || "Erro ao carregar patrimônio")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, isEdit: boolean = false) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const url = isEdit && assetToEdit ? `/api/assets/${assetToEdit.id}` : '/api/assets'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          congregationId: parseInt(formData.congregationId as string),
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory || null,
          location: formData.location || null,
          propertyType: formData.propertyType || null,
          acquisitionDate: formData.acquisitionDate || null,
          acquisitionValue: formData.acquisitionValue ? parseFloat(formData.acquisitionValue) : null,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
          condition: formData.condition || null,
          description: formData.description || null,
          serialNumber: formData.serialNumber || null,
          photoUrl: formData.photoUrl || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Erro ao ${isEdit ? 'atualizar' : 'criar'} patrimônio`)
      }

      toast.success(`Patrimônio ${isEdit ? 'atualizado' : 'criado'} com sucesso!`)
      setAddDialogOpen(false)
      setEditDialogOpen(false)
      resetForm()
      fetchAssets()
    } catch (error: any) {
      console.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} patrimônio:`, error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!assetToDelete) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/assets/${assetToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir patrimônio')
      }

      toast.success("Patrimônio excluído com sucesso!")
      setDeleteDialogOpen(false)
      fetchAssets()
    } catch (error: any) {
      console.error('Erro ao excluir patrimônio:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
      setAssetToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      congregationId: user?.congregationId || "",
      name: "",
      category: "imovel",
      subcategory: "",
      location: "",
      propertyType: "proprio",
      acquisitionDate: "",
      acquisitionValue: "",
      currentValue: "",
      condition: "bom",
      description: "",
      serialNumber: "",
      photoUrl: ""
    })
    setAssetToEdit(null)
  }

  const openEditDialog = (asset: Asset) => {
    setAssetToEdit(asset)
    setFormData({
      congregationId: asset.congregationId.toString(),
      name: asset.name,
      category: asset.category,
      subcategory: asset.subcategory || "",
      location: asset.location || "",
      propertyType: asset.propertyType || "proprio",
      acquisitionDate: asset.acquisitionDate || "",
      acquisitionValue: asset.acquisitionValue?.toString() || "",
      currentValue: asset.currentValue?.toString() || "",
      condition: asset.condition || "bom",
      description: asset.description || "",
      serialNumber: asset.serialNumber || "",
      photoUrl: asset.photoUrl || ""
    })
    setEditDialogOpen(true)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'imovel': return <Building2 className="h-5 w-5" />
      case 'veiculo': return <Car className="h-5 w-5" />
      case 'equipamento': return <Mic className="h-5 w-5" />
      case 'ferramenta': return <Wrench className="h-5 w-5" />
      default: return null
    }
  }

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(search.toLowerCase()) ||
    asset.category.toLowerCase().includes(search.toLowerCase())
  )

  const canModify = user?.role !== 'membro'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Patrimônio da Igreja</h1>
            <p className="text-muted-foreground">
              Gerencie bens, equipamentos e propriedades
            </p>
          </div>
          {canModify && (
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }} size="lg" className="gap-2">
              <Plus size={20} />
              Adicionar Bem
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Bens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assets.length}</div>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Imóveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assets.filter(a => a.category === 'imovel').length}
              </div>
              <p className="text-xs text-muted-foreground">Propriedades</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Veículos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assets.filter(a => a.category === 'veiculo').length}
              </div>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Equipamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assets.filter(a => a.category === 'equipamento').length}
              </div>
              <p className="text-xs text-muted-foreground">Itens</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle>Lista de Patrimônio</CardTitle>
                <CardDescription>Todos os bens registrados</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar patrimônio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum patrimônio registrado</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => (
                  <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(asset.category)}
                          <div>
                            <CardTitle className="text-lg">{asset.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {asset.congregation.name}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={asset.category === 'imovel' ? 'default' : 'secondary'}>
                          {asset.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {asset.subcategory && (
                        <p className="text-sm"><span className="font-semibold">Tipo:</span> {asset.subcategory}</p>
                      )}
                      {asset.location && (
                        <p className="text-sm"><span className="font-semibold">Local:</span> {asset.location}</p>
                      )}
                      {asset.condition && (
                        <p className="text-sm"><span className="font-semibold">Condição:</span> {asset.condition}</p>
                      )}
                      {asset.currentValue && (
                        <p className="text-sm"><span className="font-semibold">Valor:</span> R$ {asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      )}
                      {canModify && (
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(asset)} className="flex-1">
                            <Pencil size={14} className="mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setAssetToDelete(asset.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
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
            <DialogTitle>{assetToEdit ? 'Editar' : 'Adicionar'} Patrimônio</DialogTitle>
            <DialogDescription>
              Preencha as informações do bem
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, !!assetToEdit)} className="space-y-4">
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
                <Label>Nome do Bem *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Púlpito de Madeira"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imovel">Imóvel</SelectItem>
                    <SelectItem value="veiculo">Veículo</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                    <SelectItem value="ferramenta">Ferramenta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategoria</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category === 'equipamento' ? (
                      <>
                        <SelectItem value="microfone">Microfone</SelectItem>
                        <SelectItem value="som">Sistema de Som</SelectItem>
                        <SelectItem value="mesa">Mesa</SelectItem>
                        <SelectItem value="cadeira">Cadeira</SelectItem>
                        <SelectItem value="pulpito">Púlpito</SelectItem>
                        <SelectItem value="computador">Computador</SelectItem>
                        <SelectItem value="tv">TV</SelectItem>
                        <SelectItem value="projetor">Projetor</SelectItem>
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Templo Principal"
                  disabled={isSubmitting}
                />
              </div>
              {formData.category === 'imovel' && (
                <div className="space-y-2">
                  <Label>Tipo de Propriedade</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprio">Próprio</SelectItem>
                      <SelectItem value="alugado">Alugado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor de Aquisição (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.acquisitionValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionValue: e.target.value }))}
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Atual (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.currentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Condição</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="otimo">Ótimo</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número de Série</Label>
                <Input
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  placeholder="Ex: SN123456"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Informações adicionais..."
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
                  assetToEdit ? 'Atualizar' : 'Adicionar'
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
              Tem certeza que deseja excluir este patrimônio? Esta ação não pode ser desfeita.
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