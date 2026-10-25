"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Search, Loader2, Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface UserCredential {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  originalPassword: string | null
}

export default function UserCredentialsPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState<UserCredential[]>([])
  const [filteredCredentials, setFilteredCredentials] = useState<UserCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")
    
    if (!token || !userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUserRole(user.role)

    // Check if user has permission to view credentials
    const allowedRoles = ['admin_geral', 'admin_sede', 'pastor']
    if (!allowedRoles.includes(user.role)) {
      toast.error("Você não tem permissão para acessar esta página")
      router.push("/dashboard")
      return
    }

    fetchCredentials(token)
  }, [router])

  useEffect(() => {
    const filtered = credentials.filter(cred => 
      cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cred.phone && cred.phone.includes(searchTerm))
    )
    setFilteredCredentials(filtered)
  }, [searchTerm, credentials])

  const fetchCredentials = async (token: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users/credentials", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Você não tem permissão para visualizar as credenciais")
          router.push("/dashboard")
          return
        }
        throw new Error("Erro ao carregar credenciais")
      }

      const data = await response.json()
      setCredentials(data)
      setFilteredCredentials(data)
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar credenciais")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (userId: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado para a área de transferência`)
  }

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      'admin_geral': { label: 'Admin Geral', variant: 'destructive' },
      'admin_sede': { label: 'Admin Sede', variant: 'destructive' },
      'pastor': { label: 'Pastor', variant: 'default' },
      'lider': { label: 'Líder', variant: 'secondary' },
      'membro': { label: 'Membro', variant: 'outline' }
    }
    
    const roleInfo = roleMap[role] || { label: role, variant: 'outline' }
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-muted-foreground">Carregando credenciais...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-600" />
            Credenciais de Usuários
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie as credenciais de acesso dos membros cadastrados
          </p>
        </div>
      </div>

      <Card className="border-amber-200/50 dark:border-amber-800/30">
        <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <CardTitle className="text-lg">Aviso de Segurança</CardTitle>
              <CardDescription className="mt-1">
                Esta página contém informações sensíveis. As senhas são armazenadas para fins administrativos. 
                Mantenha estas informações confidenciais e use-as apenas para suporte aos membros.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Usuários Cadastrados</CardTitle>
              <CardDescription>
                Total de {credentials.length} usuário(s) cadastrado(s)
              </CardDescription>
            </div>
            <div className="w-full md:w-96">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCredentials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum usuário encontrado com esses critérios" : "Nenhum usuário cadastrado ainda"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-medium">{cred.id}</TableCell>
                      <TableCell>{cred.name}</TableCell>
                      <TableCell>{cred.email}</TableCell>
                      <TableCell>{cred.phone || "—"}</TableCell>
                      <TableCell>{getRoleBadge(cred.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {cred.originalPassword ? (
                              visiblePasswords.has(cred.id) 
                                ? cred.originalPassword 
                                : "••••••••"
                            ) : (
                              <span className="text-muted-foreground">Não disponível</span>
                            )}
                          </code>
                          {cred.originalPassword && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(cred.id)}
                            >
                              {visiblePasswords.has(cred.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(cred.email, "Email")}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                          {cred.originalPassword && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(cred.originalPassword!, "Senha")}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Senha
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
