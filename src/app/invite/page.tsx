"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, UserPlus, ArrowRight, CheckCircle, Mail, Phone, QrCode as QrCodeIcon, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState("")
  const [registerLink, setRegisterLink] = useState("")

  useEffect(() => {
    setRegisterLink(`${window.location.origin}/register`)
  }, [])

  const handleJoinWithCode = () => {
    if (!inviteCode.trim()) {
      toast.error("Por favor, insira o código de convite")
      return
    }
    // Redireciona para registro com código de convite
    window.location.href = `/register?invite=${encodeURIComponent(inviteCode)}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registerLink)
    toast.success("Link copiado para a área de transferência!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950/20 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/20 via-transparent to-transparent dark:from-amber-900/10" />
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 rounded-full ring-4 ring-amber-500/20 ring-offset-4 ring-offset-background">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IPCECMA__2_-removebg-preview-removebg-preview-min-1762377142669.png?width=8000&height=8000&resize=contain"
                alt="IPCECMA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 dark:from-amber-500 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
              Junte-se a Nós
            </h1>
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </div>
          <p className="text-lg text-foreground/90 font-medium">
            <span className="font-bold text-amber-800 dark:text-amber-400">Igreja Pentecostal Ceifeiros Em Chamas</span><br />
            <span className="text-sm text-muted-foreground">Ministério Atibaia</span>
          </p>
        </div>

        {/* QR Code e Link de Acesso Direto */}
        <Card className="shadow-2xl border-2 border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader className="space-y-1 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 rounded-t-xl border-b border-amber-200/30 dark:border-amber-800/20">
            <CardTitle className="text-2xl text-center font-bold flex items-center justify-center gap-2">
              <QrCodeIcon className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              Acesso Rápido
            </CardTitle>
            <CardDescription className="text-center">
              Escaneie o QR Code ou use o link para se cadastrar
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code */}
              <div className="p-6 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border-2 border-amber-200 dark:border-amber-800">
                {registerLink && (
                  <QRCodeSVG
                    value={registerLink}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#92400e"
                  />
                )}
              </div>

              {/* Link Direto */}
              <div className="w-full space-y-3">
                <Label className="text-sm font-semibold text-center block">
                  Ou acesse diretamente pelo link:
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-2 border-amber-200 dark:border-amber-800 font-mono text-xs break-all flex items-center">
                    {registerLink}
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/register" className="block">
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white font-semibold shadow-lg shadow-amber-500/25"
                  >
                    Cadastrar Agora
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-2 border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader className="space-y-1 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 rounded-t-xl border-b border-amber-200/30 dark:border-amber-800/20">
            <CardTitle className="text-2xl text-center font-bold flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              Tem um Código de Convite?
            </CardTitle>
            <CardDescription className="text-center">
              Use seu código para acesso especial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
              <h3 className="font-semibold text-lg mb-4 text-amber-900 dark:text-amber-300">
                Como se tornar um membro:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    <strong>Solicite um convite:</strong> Entre em contato com um líder ou pastor da igreja para receber seu código de convite pessoal.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    <strong>Use o código abaixo:</strong> Insira o código de convite que você recebeu no campo abaixo.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    <strong>Complete seu cadastro:</strong> Preencha seus dados pessoais e aguarde a aprovação.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-sm font-semibold">
                  Código de Convite
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Digite o código recebido"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="h-11 border-amber-200/50 dark:border-amber-800/30 focus-visible:ring-amber-500"
                  />
                  <Button
                    onClick={handleJoinWithCode}
                    className="h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white font-semibold shadow-lg shadow-amber-500/25"
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O código de convite é fornecido pelos líderes da igreja
                </p>
              </div>
            </div>

            <div className="border-t border-amber-200/30 dark:border-amber-800/20 pt-6">
              <h4 className="font-semibold text-center mb-4 text-amber-900 dark:text-amber-300">
                Ainda não tem um código?
              </h4>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                <p className="text-sm text-center text-foreground/80 mb-4">
                  Entre em contato conosco para receber seu convite:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <a 
                      href="mailto:ministerioceifeirosemchamas@gmail.com"
                      className="text-amber-700 dark:text-amber-400 hover:underline font-medium"
                    >
                      ministerioceifeirosemchamas@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <a 
                      href="tel:+5511988414083"
                      className="text-amber-700 dark:text-amber-400 hover:underline font-medium"
                    >
                      (11) 9 8841-4083
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pb-6">
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link 
                href="/login" 
                className="text-amber-700 dark:text-amber-500 font-semibold hover:underline"
              >
                Faça login aqui
              </Link>
            </div>
          </CardFooter>
        </Card>

        <footer className="mt-6 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors font-medium">Facebook</a>
            <a href="#" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors font-medium">Instagram</a>
            <a href="#" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors font-medium">YouTube</a>
          </div>
        </footer>
      </div>
    </div>
  )
}