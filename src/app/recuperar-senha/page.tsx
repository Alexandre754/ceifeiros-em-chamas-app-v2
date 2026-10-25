"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Digite seu e-mail")
      return
    }

    setIsLoading(true)

    // Simulação de envio de e-mail
    setTimeout(() => {
      setEmailSent(true)
      toast.success("E-mail de recuperação enviado!")
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950/20 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/20 via-transparent to-transparent dark:from-amber-900/10" />
      
      <div className="w-full max-w-md relative z-10">
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 dark:from-amber-500 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent mb-2">
            Recuperar Senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite seu e-mail para receber instruções
          </p>
        </div>

        <Card className="shadow-2xl border-2 border-amber-200/50 dark:border-amber-800/30">
          {!emailSent ? (
            <>
              <CardHeader className="space-y-1 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 rounded-t-xl border-b border-amber-200/30 dark:border-amber-800/20">
                <CardTitle className="text-xl text-center">Esqueceu sua senha?</CardTitle>
                <CardDescription className="text-center">
                  Enviaremos um link de recuperação para seu e-mail
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 border-amber-200/50 dark:border-amber-800/30 focus-visible:ring-amber-500"
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white font-semibold shadow-lg shadow-amber-500/25" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Link de Recuperação
                      </>
                    )}
                  </Button>

                  <Link href="/login" className="w-full">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar ao Login
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 rounded-t-xl border-b border-green-200/30 dark:border-green-800/20">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-xl text-center">E-mail Enviado!</CardTitle>
                <CardDescription className="text-center">
                  Verifique sua caixa de entrada
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Enviamos um link de recuperação para:
                  </p>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    {email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clique no link recebido para criar uma nova senha.
                  </p>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Não recebeu o e-mail? Verifique sua pasta de spam ou{" "}
                      <button
                        onClick={() => {
                          setEmailSent(false)
                          setEmail("")
                        }}
                        className="text-amber-700 dark:text-amber-500 font-semibold hover:underline"
                      >
                        tente novamente
                      </button>
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/login" className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
