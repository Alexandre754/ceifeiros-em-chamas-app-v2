"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2 } from "lucide-react"
import { uploadFile } from "@/lib/supabase"
import { toast } from "sonner"

interface MediaUploadProps {
  onUploadComplete: (url: string, type: 'image' | 'video') => void
  currentUrl?: string
  currentType?: 'image' | 'video'
}

export function MediaUpload({ onUploadComplete, currentUrl, currentType }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(currentType || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error("Por favor, selecione uma imagem ou vídeo.")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("O arquivo é muito grande. Máximo: 50MB.")
      return
    }

    setIsUploading(true)

    try {
      const { url } = await uploadFile(file, 'sermons')
      const type = isImage ? 'image' : 'video'

      setPreview(url)
      setMediaType(type)
      onUploadComplete(url, type)
      toast.success("Upload realizado com sucesso!")
    } catch (error: any) {
      console.error('Erro no upload:', error)
      toast.error(error.message || "Erro ao fazer upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setMediaType(null)
    onUploadComplete('', 'image')
  }

  return (
    <div className="space-y-2">
      <Label>Mídia (Imagem ou Vídeo)</Label>

      {preview ? (
        <div className="relative rounded-lg border overflow-hidden">
          {mediaType === 'image' ? (
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          ) : (
            <video src={preview} controls className="w-full h-48 object-cover" />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id="media-upload"
          />
          <label htmlFor="media-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Clique para enviar</p>
                  <p className="text-xs text-muted-foreground">
                    Imagem ou vídeo (máx. 50MB)
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      )}
    </div>
  )
}