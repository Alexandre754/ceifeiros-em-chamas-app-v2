"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/DashboardLayout"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface Banner {
  id: number
  title: string
  description: string | null
  imageUrl: string
  linkUrl: string | null
  order: number
  active: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export default function BannersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    order: 0,
    active: true,
    startDate: "",
    endDate: ""
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/banners")
    } else if (user) {
      fetchBanners()
    }
  }, [user, authLoading, router])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/banners?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      } else {
        toast.error("Erro ao carregar banners")
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error("Erro ao carregar banners")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setPhotoPreview(base64)
        setFormData(prev => ({ ...prev, imageUrl: base64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOpenDialog = (banner: Banner | null = null) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        description: banner.description || "",
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || "",
        order: banner.order,
        active: banner.active,
        startDate: banner.startDate ? banner.startDate.split('T')[0] : "",
        endDate: banner.endDate ? banner.endDate.split('T')[0] : ""
      })
      setPhotoPreview(banner.imageUrl)
    } else {
      setEditingBanner(null)
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        order: banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0,
        active: true,
        startDate: "",
        endDate: ""
      })
      setPhotoPreview(null)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionLoading(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners'
      const method = editingBanner ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        order: parseInt(formData.order.toString()),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        description: formData.description || null,
        linkUrl: formData.linkUrl || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingBanner ? "Banner atualizado!" : "Banner criado!")
        setIsDialogOpen(false)
        fetchBanners()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao salvar banner")
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error("Erro ao salvar banner")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return

    try {
      setIsActionLoading(true)
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Banner excluído!")
        fetchBanners()
      } else {
        toast.error("Erro ao excluir banner")
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error("Erro ao excluir banner")
    } finally {
      setIsActionLoading(false)
    }
  }

  const toggleStatus = async (banner: Banner) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !banner.active })
      })

      if (response.ok) {
        fetchBanners()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Banners</h1>
            <p className="text-muted-foreground">
              Adicione e edite as imagens do slider da página inicial.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Banner
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banners.length === 0 ? (
            <Card className="col-span-full p-12 text-center text-muted-foreground">
              Nenhum banner encontrado. Clique em "Novo Banner" para começar.
            </Card>
          ) : (
            banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden group border-2 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md">
                <div className="relative aspect-video">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                  {!banner.active && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded border border-destructive/20 uppercase tracking-wider">
                        Inativo
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90"
                      onClick={() => handleOpenDialog(banner)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{banner.title}</CardTitle>
                    <Switch 
                      checked={banner.active} 
                      onCheckedChange={() => toggleStatus(banner)}
                    />
                  </div>
                  <CardDescription className="line-clamp-2 h-10">
                    {banner.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Ordem: {banner.order}</span>
                  <div className="flex gap-2">
                    {banner.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {new Date(banner.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
                <DialogDescription>
                  Configure os detalhes do banner do slider principal.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pb-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4 md:col-span-2">
                    <Label>Imagem do Banner *</Label>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-full aspect-[21/9] rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-amber-500/30 relative group/preview">
                        {photoPreview ? (
                          <>
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                              <Label htmlFor="banner-photo" className="cursor-pointer bg-white dark:bg-gray-900 px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-amber-50 transition-colors">
                                <Upload size={16} /> Alterar Imagem
                              </Label>
                            </div>
                          </>
                        ) : (
                          <Label htmlFor="banner-photo" className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-amber-600 transition-colors w-full h-full justify-center">
                            <Upload size={40} />
                            <span>Clique para fazer upload (Recomendado: 1920x820)</span>
                          </Label>
                        )}
                      </div>
                      <Input
                        id="banner-photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        required={!editingBanner}
                      />
                    </div>
                  </div>


                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título chamativo para o banner"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Breve texto explicativo"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Link (URL)</Label>
                  <Input
                    id="linkUrl"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                    placeholder="https://exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Ordem de Exibição</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    id="active"
                    checked={formData.active} 
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isActionLoading} className="bg-amber-600 hover:bg-amber-700">
                  {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBanner ? "Salvar Alterações" : "Criar Banner"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
