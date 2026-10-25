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
  Video, 
  Facebook, 
  Instagram, 
  Settings, 
  Play, 
  Square, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Share2,
  ExternalLink,
  Wifi,
  WifiOff
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function LiveStreamPage() {
  const { user } = useAuth()
  const [isLive, setIsLive] = useState(false)
  const [streamTime, setStreamTime] = useState(0)
  const [fbKey, setFbKey] = useState("")
  const [igKey, setIgKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load saved keys from localStorage on mount
  useEffect(() => {
    const savedFbKey = localStorage.getItem("live_fb_key")
    const savedIgKey = localStorage.getItem("live_ig_key")
    if (savedFbKey) setFbKey(savedFbKey)
    if (savedIgKey) setIgKey(savedIgKey)
  }, [])

  // Timer for stream
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLive) {
      interval = setInterval(() => {
        setStreamTime((prev) => prev + 1)
      }, 1000)
    } else {
      setStreamTime(0)
    }
    return () => clearInterval(interval)
  }, [isLive])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSaveSettings = () => {
    setIsSaving(true)
    setTimeout(() => {
      localStorage.setItem("live_fb_key", fbKey)
      localStorage.setItem("live_ig_key", igKey)
      setIsSaving(false)
      toast.success("Configurações de transmissão salvas!")
    }, 1000)
  }

  const handleToggleStream = () => {
    if (!fbKey && !igKey) {
      toast.error("Por favor, configure ao menos uma chave de transmissão.")
      return
    }

    setIsLoading(true)
    
    // Simulate API call to start/stop stream
    setTimeout(() => {
      const newStatus = !isLive
      setIsLive(newStatus)
      setIsLoading(false)
      
      if (newStatus) {
        toast.success("Transmissão iniciada com sucesso!")
      } else {
        toast.info("Transmissão encerrada.")
      }
    }, 1500)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transmissão ao Vivo</h1>
            <p className="text-muted-foreground">
              Transmita seus cultos para múltiplas redes sociais simultaneamente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLive ? (
              <Badge variant="destructive" className="animate-pulse px-3 py-1 flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                AO VIVO: {formatTime(streamTime)}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <WifiOff className="w-3 h-3" />
                OFFLINE
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls */}
          <Card className="lg:col-span-2 border-2 border-amber-100 dark:border-amber-900/30 overflow-hidden">
            <div className={`h-2 w-full ${isLive ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-600" />
                Painel de Controle
              </CardTitle>
              <CardDescription>
                Gerencie o status da sua transmissão para Facebook e Instagram.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video bg-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden shadow-inner border border-slate-800">
                {isLive ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-red-500 rounded-full blur-xl opacity-20 animate-pulse" />
                      <Wifi className="w-16 h-16 text-white mb-4" />
                    </div>
                    <p className="text-white font-bold text-xl tracking-wider">TRANSMITINDO AGORA</p>
                    <div className="flex gap-4 mt-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/80 rounded-full text-white text-xs font-semibold">
                        <Facebook className="w-3.5 h-3.5" /> Facebook
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-600/80 rounded-full text-white text-xs font-semibold">
                        <Instagram className="w-3.5 h-3.5" /> Instagram
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Video className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-medium">Pré-visualização da Transmissão</p>
                    <p className="text-sm opacity-60">Inicie para ver o status aqui</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Destinos Ativos</p>
                  <div className="flex gap-2">
                    <Badge variant={fbKey ? "default" : "outline"} className={fbKey ? "bg-blue-600 hover:bg-blue-700" : ""}>
                      Facebook
                    </Badge>
                    <Badge variant={igKey ? "default" : "outline"} className={igKey ? "bg-pink-600 hover:bg-pink-700" : ""}>
                      Instagram
                    </Badge>
                  </div>
                </div>
                
                <Button 
                  size="lg"
                  variant={isLive ? "destructive" : "default"}
                  className={`min-w-[200px] h-14 text-lg font-bold shadow-lg transition-all duration-300 ${!isLive ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:scale-105' : ''}`}
                  onClick={handleToggleStream}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PROCESSANDO...
                    </span>
                  ) : isLive ? (
                    <span className="flex items-center gap-2">
                      <Square className="w-5 h-5 fill-white" />
                      PARAR TRANSMISSÃO
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Play className="w-5 h-5 fill-white" />
                      INICIAR TRANSMISSÃO
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuração RTMP
                </CardTitle>
                <CardDescription>
                  Insira as chaves fornecidas pelas plataformas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-key" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook Stream Key
                  </Label>
                  <Input 
                    id="fb-key" 
                    type="password" 
                    placeholder="Ex: FB-123456789..." 
                    value={fbKey}
                    onChange={(e) => setFbKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Obtenha no Facebook Live Producer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ig-key" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    Instagram Stream Key
                  </Label>
                  <Input 
                    id="ig-key" 
                    type="password" 
                    placeholder="Ex: IG-987654321..." 
                    value={igKey}
                    onChange={(e) => setIgKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Obtenha no Instagram Live Producer
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar Chaves"}
                </Button>
              </CardFooter>
            </Card>

            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-400 font-bold">Simultâneo!</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-500 text-xs">
                Este sistema utiliza um relay RTMP interno para enviar seu sinal para Facebook e Instagram ao mesmo tempo sem sobrecarregar sua internet.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                Como Transmitir (Passo a Passo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-sm">Configure o OBS ou seu Software</p>
                  <p className="text-xs text-muted-foreground">No seu software de transmissão (OBS, vMix), use o servidor RTMP do sistema para centralizar o sinal.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="font-semibold text-sm">Cole as Chaves de Destino</p>
                  <p className="text-xs text-muted-foreground">Copie suas chaves de transmissão do Facebook e Instagram e cole nos campos acima.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold text-sm">Inicie a Transmissão</p>
                  <p className="text-xs text-muted-foreground">Clique no botão "Iniciar Transmissão" neste painel e comece a enviar o sinal do seu computador.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-amber-600" />
                Links Úteis
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-left" asChild>
                <a href="https://www.facebook.com/live/producer" target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold">Facebook Live Producer</p>
                    <p className="text-[10px] text-muted-foreground">Pegar chave de transmissão do Facebook</p>
                  </div>
                </a>
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-left" asChild>
                <a href="https://www.instagram.com/live/producer" target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <div>
                    <p className="text-sm font-semibold">Instagram Live Producer</p>
                    <p className="text-[10px] text-muted-foreground">Pegar chave de transmissão do Instagram</p>
                  </div>
                </a>
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-left" asChild>
                <a href="https://obsproject.com/" target="_blank" rel="noopener noreferrer">
                  <div className="w-4 h-4 bg-slate-900 rounded-sm flex items-center justify-center text-[8px] text-white font-bold">OBS</div>
                  <div>
                    <p className="text-sm font-semibold">Baixar OBS Studio</p>
                    <p className="text-[10px] text-muted-foreground">Software gratuito para transmissão</p>
                  </div>
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
