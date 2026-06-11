"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Upload, Image as ImageIcon, Video, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface EventFormData {
  congregationId: number
  title: string
  description: string
  day1Date: string
  day1StartTime: string
  day1EndTime: string
  day2Date: string
  day2StartTime: string
  day2EndTime: string
  day3Date: string
  day3EndTime: string
  location: string
  mediaUrl: string
  mediaType: "image" | "video" | ""
  category: string
  attendance?: number
}

interface EditEventDialogProps {
  event: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventUpdate?: () => void
  congregations?: Array<{
    id: number
    name: string
    city: string
    state: string
  }>
}

export const EditEventDialog = ({ event, open, onOpenChange, onEventUpdate, congregations = [] }: EditEventDialogProps) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<string>("")
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    congregationId: 0,
    title: "",
    description: "",
    day1Date: "",
    day1StartTime: "",
    day1EndTime: "",
    day2Date: "",
    day2StartTime: "",
    day2EndTime: "",
    day3Date: "",
    day3EndTime: "",
    location: "",
    mediaUrl: "",
    mediaType: "",
    category: "culto",
    attendance: undefined,
  })

  useEffect(() => {
    if (event && open) {
      // Check if it's a multi-day event
      const hasMultiDayData = event.day1Date || event.day2Date || event.day3Date
      setIsMultiDay(hasMultiDayData)
      
      setFormData({
        congregationId: event.congregationId || user?.congregationId || 0,
        title: event.title || "",
        description: event.description || "",
        day1Date: event.day1Date || event.startDate || "",
        day1StartTime: event.day1Time || event.startTime || "",
        day1EndTime: event.endTime || "",
        day2Date: event.day2Date || "",
        day2StartTime: event.day2Time || "",
        day2EndTime: event.endTime || "",
        day3Date: event.day3Date || event.endDate || "",
        day3EndTime: event.day3Time || event.endTime || "",
        location: event.location || "",
        mediaUrl: event.mediaUrl || "",
        mediaType: event.mediaType || "",
        category: event.category || "culto",
        attendance: event.attendance || undefined,
      })
      setMediaPreview(event.mediaUrl || "")
    }
  }, [event, open, user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setMediaPreview(result)
        setFormData(prev => ({
          ...prev,
          mediaUrl: result,
          mediaType: file.type.startsWith("video") ? "video" : "image",
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.day1Date) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const payload: any = {
        congregationId: formData.congregationId,
        title: formData.title,
        description: formData.description,
        startDate: formData.day1Date,
        startTime: formData.day1StartTime,
        endDate: isMultiDay && formData.day3Date ? formData.day3Date : formData.day1Date,
        endTime: isMultiDay && formData.day3EndTime ? formData.day3EndTime : formData.day1EndTime,
        location: formData.location || null,
        mediaUrl: formData.mediaUrl || null,
        mediaType: formData.mediaType || null,
        category: formData.category,
        attendance: formData.attendance || null,
      }

      if (isMultiDay) {
        payload.day1Date = formData.day1Date
        payload.day1Time = formData.day1StartTime
        payload.day2Date = formData.day2Date
        payload.day2Time = formData.day2StartTime
        payload.day3Date = formData.day3Date
        payload.day3Time = formData.day3EndTime
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar evento')
      }

      toast.success("Evento atualizado com sucesso!")
      onOpenChange(false)
      onEventUpdate?.()
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error)
      toast.error(error.message || "Erro ao atualizar evento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="h-6 w-6 text-amber-600" />
            Editar Evento
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do evento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(user?.role === 'admin_geral' || (user?.role === 'admin_sede' && user?.congregation?.isHeadquarters) || user?.hasGeneralAccess === true) && (
            <div className="space-y-2">
              <Label htmlFor="congregation" className="text-base font-semibold">
                Congregação *
              </Label>
              <Select 
                value={formData.congregationId.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, congregationId: parseInt(value) }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma congregação" />
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

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Título do Evento *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Culto de Celebração Especial"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="text-base"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              Categoria *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="culto">Culto</SelectItem>
                <SelectItem value="estudo">Estudo Bíblico</SelectItem>
                <SelectItem value="jovens">Jovens</SelectItem>
                <SelectItem value="varoes">Varões</SelectItem>
                <SelectItem value="irmas">Irmãs</SelectItem>
                <SelectItem value="infantil">Infantil</SelectItem>
                <SelectItem value="evangelismo">Evangelismo</SelectItem>
                <SelectItem value="congresso">Congresso</SelectItem>
                <SelectItem value="congresso_unificado">Congresso Unificado</SelectItem>
                <SelectItem value="celula">Célula</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Descrição *
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva os detalhes do evento..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px] text-base"
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="multiDay"
              checked={isMultiDay}
              onChange={(e) => setIsMultiDay(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="multiDay" className="text-sm font-medium cursor-pointer">
              Evento de múltiplos dias (3 dias)
            </Label>
          </div>

          {!isMultiDay ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-base font-semibold">
                  Data *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.day1Date}
                  onChange={(e) => setFormData(prev => ({ ...prev, day1Date: e.target.value, day3Date: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-base font-semibold">
                  Horário *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.day1StartTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, day1StartTime: e.target.value }))}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    type="time"
                    value={formData.day3EndTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, day3EndTime: e.target.value }))}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-l-4 border-amber-500 pl-4 space-y-3">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Dia 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.day1Date}
                      onChange={(e) => setFormData(prev => ({ ...prev, day1Date: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário Início *</Label>
                    <Input
                      type="time"
                      value={formData.day1StartTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, day1StartTime: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário Término *</Label>
                    <Input
                      type="time"
                      value={formData.day1EndTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, day1EndTime: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-amber-500 pl-4 space-y-3">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Dia 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.day2Date}
                      onChange={(e) => setFormData(prev => ({ ...prev, day2Date: e.target.value }))}
                      disabled={isLoading}
                      required={isMultiDay}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário Início *</Label>
                    <Input
                      type="time"
                      value={formData.day2StartTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, day2StartTime: e.target.value }))}
                      disabled={isLoading}
                      required={isMultiDay}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário Término *</Label>
                    <Input
                      type="time"
                      value={formData.day2EndTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, day2EndTime: e.target.value }))}
                      disabled={isLoading}
                      required={isMultiDay}
                    />
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-amber-500 pl-4 space-y-3">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Dia 3 (Término)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Término *</Label>
                    <Input
                      type="date"
                      value={formData.day3Date}
                      onChange={(e) => setFormData(prev => ({ ...prev, day3Date: e.target.value }))}
                      disabled={isLoading}
                      required={isMultiDay}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário de Término *</Label>
                    <Input
                      type="time"
                      value={formData.day3EndTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, day3EndTime: e.target.value }))}
                      disabled={isLoading}
                      required={isMultiDay}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">
              Local (Opcional)
            </Label>
            <Input
              id="location"
              placeholder="Ex: Igreja Sede - Atibaia"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="text-base"
              disabled={isLoading}
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label htmlFor="media" className="text-base font-semibold">
              Imagem ou Vídeo do Evento (Opcional)
            </Label>
            <div className="border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-lg p-6 hover:border-amber-400 transition-colors">
              {mediaPreview ? (
                <div className="relative">
                  {formData.mediaType === "image" ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setMediaPreview("")
                      setFormData(prev => ({ ...prev, mediaUrl: "", mediaType: "" }))
                    }}
                    disabled={isLoading}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="media"
                  className="flex flex-col items-center gap-3 cursor-pointer"
                >
                  <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/20">
                    <Upload className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Clique para fazer upload</p>
                    <p className="text-sm text-muted-foreground">
                      Imagem (PNG, JPG) ou Vídeo (MP4, WebM)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ImageIcon className="h-5 w-5 text-amber-600" />
                    <Video className="h-5 w-5 text-amber-600" />
                  </div>
                </label>
              )}
              <input
                id="media"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Evento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}