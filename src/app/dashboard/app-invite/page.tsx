"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Share2, Smartphone, QrCode as QrCodeIcon } from "lucide-react"
import DashboardLayout from "@/components/DashboardLayout"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"

export default function AppInvitePage() {
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    // Link aponta para a página de registro
    setInviteLink(`${window.location.origin}/register`)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success("Link copiado para a área de transferência!")
  }

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Baixe o App da Igreja IPCECMA',
          text: 'Junte-se à nossa comunidade! Cadastre-se no aplicativo da Igreja Pentecostal Ceifeiros Em Chamas.',
          url: inviteLink
        })
        toast.success("Link compartilhado com sucesso!")
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error("Erro ao compartilhar")
        }
      }
    } else {
      handleCopyLink()
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        
        const downloadLink = document.createElement('a')
        downloadLink.download = 'qrcode-app-ipcecma.png'
        downloadLink.href = pngFile
        downloadLink.click()
        
        toast.success("QR Code baixado com sucesso!")
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Convite para Membros</h1>
          <p className="text-muted-foreground">
            Compartilhe o aplicativo da igreja com seus membros
          </p>
        </div>

        {/* QR Code Card */}
        <Card className="bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-amber-100/80 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-900/40 border-2 border-amber-200 dark:border-amber-800 shadow-lg shadow-amber-500/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-md">
                <QrCodeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  QR Code do Aplicativo
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Escaneie para acessar o cadastro
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code */}
              <div className="p-8 bg-white rounded-2xl shadow-xl">
                {inviteLink && (
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={inviteLink}
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#92400e"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  onClick={handleDownloadQR}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/30"
                >
                  <Download className="h-4 w-4" />
                  Baixar QR Code
                </Button>
                
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  className="gap-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>
                
                <Button 
                  onClick={handleShareLink}
                  variant="outline"
                  className="gap-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link Card */}
        <Card>
          <CardHeader>
            <CardTitle>Link de Convite</CardTitle>
            <CardDescription>
              Copie e compartilhe este link com seus membros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-4 bg-muted rounded-lg border-2 font-mono text-sm break-all">
                  {inviteLink}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleCopyLink}
                  variant="default"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>
                
                <Button 
                  onClick={handleShareLink}
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Link de Convite</CardTitle>
            <CardDescription>
              Como funciona o cadastro de novos membros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Link de Registro</h4>
                  <p className="text-muted-foreground">
                    Este link direciona novos membros para a página de cadastro onde poderão criar uma conta no sistema.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-950/40 rounded-full flex items-center justify-center">
                  <QrCodeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">QR Code</h4>
                  <p className="text-muted-foreground">
                    Compartilhe o QR Code em apresentações, cartazes ou redes sociais. Os membros podem escanear e ir direto para o cadastro.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Compartilhamento</h4>
                  <p className="text-muted-foreground">
                    Use o botão compartilhar para enviar o link via WhatsApp, email, SMS ou redes sociais diretamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Como Compartilhar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <p>
                  <strong>QR Code:</strong> Baixe o QR Code e compartilhe em redes sociais, impressões ou apresentações durante os cultos.
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <p>
                  <strong>Link Direto:</strong> Copie o link e envie via WhatsApp, email ou SMS para os membros da igreja.
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <p>
                  <strong>Botão Compartilhar:</strong> Use o botão compartilhar para enviar diretamente pelo seu dispositivo móvel.
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <p>
                  <strong>Aprovação:</strong> Novos cadastros precisam ser aprovados por um administrador antes de terem acesso completo ao sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}