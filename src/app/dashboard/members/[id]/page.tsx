"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, User, FileText, DollarSign, Edit, Shield, Trash2, Key } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { parsePositions, getPositionLabel, DEFAULT_POSITIONS, loadCustomPositions } from "@/components/members/PositionMultiSelect"
import MemberInfoTab from "@/components/members/MemberInfoTab"
import MemberAdditionalFieldsTab from "@/components/members/MemberAdditionalFieldsTab"
import MemberFinancialTab from "@/components/members/MemberFinancialTab"
import MemberEditTab from "@/components/members/MemberEditTab"
import MemberPermissionsTab from "@/components/members/MemberPermissionsTab"
import MemberRemoveTab from "@/components/members/MemberRemoveTab"
import MemberAccessTab from "@/components/members/MemberAccessTab"

interface Member {
  id: number
  name: string
  cpf: string | null
  rg: string | null
  birthDate: string
  age: number | null
  sex: string
  maritalStatus: string | null
  email: string | null
  phone: string
  address: string | null
  cep: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  congregationId: number
  position: string
  baptismDate: string | null
  memberSince: string | null
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

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const memberId = params.id as string
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("informacoes")

  useEffect(() => {
    fetchMember()
  }, [memberId])

  const fetchMember = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        router.push('/login')
        return
      }

      const response = await fetch(`/api/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMember(data)
      } else if (response.status === 401) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.")
        router.push('/login')
      } else if (response.status === 403) {
        toast.error("Você não tem permissão para visualizar este membro")
        router.push('/dashboard/members')
      } else if (response.status === 404) {
        toast.error("Membro não encontrado")
        router.push('/dashboard/members')
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error("Erro ao carregar dados do membro")
    } finally {
      setIsLoading(false)
    }
  }

  const canEdit = () => {
    return true
  }

  const canDelete = () => {
    return true
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!member) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Membro não encontrado</p>
        </div>
      </DashboardLayout>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const memberPositions = member ? parsePositions(member.position) : []
  const allPositions = [...DEFAULT_POSITIONS, ...loadCustomPositions()]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/dashboard/members">
            <Button variant="outline" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-amber-500/30 ring-offset-4 ring-offset-background transition-all group-hover:ring-amber-500/50 group-hover:scale-105 shadow-xl">
                  <AvatarImage src={member.photoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white font-bold shadow-lg">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full p-2 shadow-lg ring-2 ring-background">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{member.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {memberPositions.map(v => (
                    <Badge
                      key={v}
                      variant={v === "pastor" ? "default" : "secondary"}
                      className={v === "pastor" ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm" : ""}
                    >
                      {getPositionLabel(v, allPositions)}
                    </Badge>
                  ))}
                  <Badge 
                    variant="outline" 
                    className={
                      member.status === "ativo" 
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-700 shadow-sm" 
                        : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:border-gray-700"
                    }
                  >
                    {member.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-medium">
                    {member.congregation.name} - {member.congregation.city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="informacoes" className="gap-2">
              <User size={16} />
              <span className="hidden sm:inline">Informações</span>
            </TabsTrigger>
            <TabsTrigger value="campos-adicionais" className="gap-2">
              <FileText size={16} />
              <span className="hidden sm:inline">Campos Adicionais</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="acesso" className="gap-2">
              <Key size={16} />
              <span className="hidden sm:inline">Acesso</span>
            </TabsTrigger>
            <TabsTrigger value="editar" className="gap-2">
              <Edit size={16} />
              <span className="hidden sm:inline">Editar</span>
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="gap-2">
              <Shield size={16} />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
            <TabsTrigger value="remover" className="gap-2 text-destructive">
              <Trash2 size={16} />
              <span className="hidden sm:inline">Remover</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes">
            <MemberInfoTab member={member} />
          </TabsContent>

          <TabsContent value="campos-adicionais">
            <MemberAdditionalFieldsTab member={member} />
          </TabsContent>

          <TabsContent value="financeiro">
            <MemberFinancialTab member={member} />
          </TabsContent>

          <TabsContent value="acesso">
            <MemberAccessTab member={member} />
          </TabsContent>

          <TabsContent value="editar">
            <MemberEditTab member={member} onUpdate={fetchMember} />
          </TabsContent>

          <TabsContent value="permissoes">
            <MemberPermissionsTab member={member} />
          </TabsContent>

          <TabsContent value="remover">
            <MemberRemoveTab member={member} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}