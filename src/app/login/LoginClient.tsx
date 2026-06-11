"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle, Cross, BookOpen, Users, Heart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showRegisteredMessage, setShowRegisteredMessage] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true' && !showRegisteredMessage) {
      setShowRegisteredMessage(true)
      toast.success("Cadastro realizado! Faça login para continuar.")
    }
  }, [searchParams, showRegisteredMessage])

  useEffect(() => {
    if (!authLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)
      if (user) {
        const redirect = searchParams.get('redirect')
        router.push(redirect || "/dashboard")
      }
    }
  }, [authLoading, hasCheckedAuth, user, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Preencha todos os campos")
      return
    }
    setIsLoading(true)
    try {
      await login(email, password)
      toast.success("Login realizado com sucesso!")
      const redirect = searchParams.get('redirect')
      router.push(redirect || "/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Email ou senha inválidos.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || (user && hasCheckedAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual / Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-sidebar flex-col justify-between p-12">
        {/* Background gradient ornament */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sidebar-primary/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/20">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IPCECMA__2_-removebg-preview-removebg-preview-min-1762377142669.png?width=8000&height=8000&resize=contain"
              alt="IPCECMA"
              width={40}
              height={40}
              className="object-contain p-1"
            />
          </div>
          <span className="font-bold text-sidebar-primary text-lg tracking-tight">IPCECMA</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sidebar-primary/15 rounded-full border border-sidebar-primary/20">
              <Cross size={12} className="text-sidebar-primary" />
              <span className="text-xs font-semibold text-sidebar-primary uppercase tracking-wider">Sistema de Gestão</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-sidebar-foreground leading-tight">
              Igreja Pentecostal<br />
              <span className="text-sidebar-primary">Ceifeiros em Chamas</span>
            </h1>
            <p className="text-sidebar-foreground/60 text-lg leading-relaxed max-w-md">
              Gerencie sua congregação com eficiência, amor e propósito. Uma plataforma completa para a obra do Senhor.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Membros", desc: "Gestão completa" },
              { icon: BookOpen, label: "Sermões", desc: "Biblioteca digital" },
              { icon: Heart, label: "Doações", desc: "Controle online" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-4 rounded-xl bg-sidebar-accent border border-sidebar-border">
                <Icon size={20} className="text-sidebar-primary mb-2" />
                <p className="text-xs font-semibold text-sidebar-foreground">{label}</p>
                <p className="text-[11px] text-sidebar-foreground/50 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <blockquote className="border-l-2 border-sidebar-primary/40 pl-4">
            <p className="text-sm italic text-sidebar-foreground/60">
              "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito..."
            </p>
            <cite className="text-xs text-sidebar-foreground/40 mt-1 block">João 3:16</cite>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-background">
        {/* Mobile Logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-primary/20 mb-3 bg-card shadow-lg">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IPCECMA__2_-removebg-preview-removebg-preview-min-1762377142669.png?width=8000&height=8000&resize=contain"
              alt="IPCECMA"
              width={64}
              height={64}
              className="object-contain p-2"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold gradient-text-primary">IPCECMA</h1>
          <p className="text-xs text-muted-foreground mt-1">Igreja Pentecostal Ceifeiros em Chamas</p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {showRegisteredMessage && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                Cadastro realizado! Agora você pode fazer login.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-card border-border focus-visible:ring-primary/50 transition-shadow"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link
                  href="/recuperar-senha"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 pr-10 bg-card border-border focus-visible:ring-primary/50"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Acessar o Sistema"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Cadastre-se aqui
              </Link>
            </p>
            <Link
              href="/invite"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              tabIndex={isLoading ? -1 : 0}
            >
              <span className="text-base">🔗</span>
              Link de convite para novos membros
            </Link>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border text-center space-y-1">
            <p className="text-xs text-muted-foreground">📧 ministerioceifeirosemchamas@gmail.com</p>
            <p className="text-xs text-muted-foreground">📱 (11) 9 8841-4083</p>
            <div className="flex justify-center gap-4 mt-2">
              {["Facebook", "Instagram", "YouTube"].map(s => (
                <a key={s} href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
