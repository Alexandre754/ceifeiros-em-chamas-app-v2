"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Key, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Link as LinkIcon,
  Copy,
  Check,
  Lock,
  Building2,
  Shield,
  Award,
  Globe,
  MessageCircle
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Member {
  id: number
  name: string
  email: string | null
  phone: string
  congregationId: number
}

interface UserAccess {
  id: number
  name: string
  email: string
  role: string
  approved: boolean
  createdAt: string
  hasGeneralAccess?: boolean
}

interface Congregation {
  id: number
  name: string
  city: string
  state: string
  isHeadquarters: boolean
}

interface CongregationAccess {
  id: number
  userId: number
  congregationId: number
  accessLevel: string
  grantedAt: string
  grantedBy: number
  congregation: Congregation
  grantedByUser: {
    id: number
    name: string
    email: string
  } | null
}

interface MemberLevel {
  id: number
  name: string
  description: string | null
  level: number
  active: boolean
}

interface MemberAccessTabProps {
  member: Member
}

export default function MemberAccessTab({ member }: MemberAccessTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // General Access State
  const [hasGeneralAccess, setHasGeneralAccess] = useState(false)
  const [isTogglingGeneralAccess, setIsTogglingGeneralAccess] = useState(false)
  
  // Congregation Access State
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [congregationAccess, setCongregationAccess] = useState<CongregationAccess[]>([])
  const [isLoadingCongregations, setIsLoadingCongregations] = useState(false)
  const [showAddCongregationDialog, setShowAddCongregationDialog] = useState(false)
  const [selectedCongregationId, setSelectedCongregationId] = useState<string>("")
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>("read")
  const [isAddingCongregation, setIsAddingCongregation] = useState(false)
  const [congregationToDelete, setCongregationToDelete] = useState<CongregationAccess | null>(null)
  
  // Member Levels State
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([])
  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [showAddLevelDialog, setShowAddLevelDialog] = useState(false)
  const [newLevelName, setNewLevelName] = useState("")
  const [newLevelDescription, setNewLevelDescription] = useState("")
  const [newLevelNumber, setNewLevelNumber] = useState<number>(5)
  const [isAddingLevel, setIsAddingLevel] = useState(false)
  
  // Form fields
  const [email, setEmail] = useState(member.email || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("membro")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Password change fields
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  useEffect(() => {
    fetchMemberAccess()
  }, [member.id])

  useEffect(() => {
    if (userAccess) {
      setHasGeneralAccess(userAccess.hasGeneralAccess || false)
      fetchCongregations()
      fetchCongregationAccess()
      fetchMemberLevels()
    }
  }, [userAccess])

  const fetchCongregations = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/congregations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
      }
    } catch (error) {
      console.error('Error fetching congregations:', error)
    }
  }

  const fetchCongregationAccess = async () => {
    if (!userAccess) return
    
    setIsLoadingCongregations(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/users/${userAccess.id}/congregation-access`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCongregationAccess(data)
      }
    } catch (error) {
      console.error('Error fetching congregation access:', error)
    } finally {
      setIsLoadingCongregations(false)
    }
  }

  const fetchMemberLevels = async () => {
    setIsLoadingLevels(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/member-levels?active=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMemberLevels(data)
      }
    } catch (error) {
      console.error('Error fetching member levels:', error)
    } finally {
      setIsLoadingLevels(false)
    }
  }

  const handleToggleGeneralAccess = async () => {
    if (!userAccess) return

    setIsTogglingGeneralAccess(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/users/${userAccess.id}/general-access`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hasGeneralAccess: !hasGeneralAccess })
      })

      const data = await response.json()

      if (response.ok) {
        setHasGeneralAccess(data.hasGeneralAccess)
        toast.success(
          data.hasGeneralAccess 
            ? "Acesso geral ativado! Usuário pode acessar todas as congregações." 
            : "Acesso geral desativado. Configure acessos específicos por congregação."
        )
        // Refresh user access data
        fetchMemberAccess()
      } else {
        toast.error(data.error || "Erro ao atualizar acesso geral")
      }
    } catch (error) {
      console.error('Error toggling general access:', error)
      toast.error("Erro ao atualizar acesso geral")
    } finally {
      setIsTogglingGeneralAccess(false)
    }
  }

  const handleAddCongregationAccess = async () => {
    if (!selectedCongregationId) {
      toast.error("Selecione uma congregação")
      return
    }

    setIsAddingCongregation(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/users/${userAccess?.id}/congregation-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          congregationId: parseInt(selectedCongregationId),
          accessLevel: selectedAccessLevel
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Acesso à congregação adicionado!")
        setShowAddCongregationDialog(false)
        setSelectedCongregationId("")
        setSelectedAccessLevel("read")
        fetchCongregationAccess()
      } else {
        toast.error(data.error || "Erro ao adicionar acesso")
      }
    } catch (error) {
      console.error('Error adding congregation access:', error)
      toast.error("Erro ao adicionar acesso")
    } finally {
      setIsAddingCongregation(false)
    }
  }

  const handleRemoveCongregationAccess = async (access: CongregationAccess) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/users/${userAccess?.id}/congregation-access/${access.congregationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Acesso removido com sucesso!")
        setCongregationToDelete(null)
        fetchCongregationAccess()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao remover acesso")
      }
    } catch (error) {
      console.error('Error removing congregation access:', error)
      toast.error("Erro ao remover acesso")
    }
  }

  const handleAddMemberLevel = async () => {
    if (!newLevelName.trim()) {
      toast.error("Nome do nível é obrigatório")
      return
    }

    setIsAddingLevel(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/member-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newLevelName,
          description: newLevelDescription || null,
          level: newLevelNumber,
          active: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Nível de membro criado!")
        setShowAddLevelDialog(false)
        setNewLevelName("")
        setNewLevelDescription("")
        setNewLevelNumber(5)
        fetchMemberLevels()
      } else {
        toast.error(data.error || "Erro ao criar nível")
      }
    } catch (error) {
      console.error('Error adding member level:', error)
      toast.error("Erro ao criar nível")
    } finally {
      setIsAddingLevel(false)
    }
  }

  const handleDeleteMemberLevel = async (levelId: number) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/member-levels/${levelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Nível de membro removido!")
        fetchMemberLevels()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao remover nível")
      }
    } catch (error) {
      console.error('Error deleting member level:', error)
      toast.error("Erro ao remover nível")
    }
  }

  const fetchMemberAccess = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}/access`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHasAccess(data.hasAccess)
        setUserAccess(data.user)
      } else {
        toast.error("Erro ao carregar informações de acesso")
      }
    } catch (error) {
      console.error('Error fetching member access:', error)
      toast.error("Erro ao carregar informações de acesso")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmNewPassword) {
      toast.error("Preencha todos os campos")
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setIsChangingPassword(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/users/${userAccess?.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Senha alterada com sucesso!")
        setShowChangePasswordDialog(false)
        setNewPassword("")
        setConfirmNewPassword("")
      } else {
        toast.error(data.error || "Erro ao alterar senha")
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error("Erro ao alterar senha")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleGenerateInviteLink = async () => {
    if (!member.email) {
      toast.error("Membro precisa ter um email cadastrado")
      return
    }

    setIsGeneratingLink(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}/invite-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setInviteLink(data.inviteLink)
        toast.success("Link de convite gerado com sucesso!")
      } else {
        toast.error(data.error || "Erro ao gerar link de convite")
      }
    } catch (error) {
      console.error('Error generating invite link:', error)
      toast.error("Erro ao gerar link de convite")
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setIsCopied(true)
      toast.success("Link copiado para a área de transferência!")
      
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error("Erro ao copiar link")
    }
  }

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Email é obrigatório")
      return
    }

    if (!password || !confirmPassword) {
      toast.error("Senha e confirmação são obrigatórias")
      return
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setIsCreating(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}/create-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, role })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Acesso criado com sucesso!")
        setShowCreateForm(false)
        setPassword("")
        setConfirmPassword("")
        fetchMemberAccess()
      } else {
        toast.error(data.error || "Erro ao criar acesso")
      }
    } catch (error) {
      console.error('Error creating access:', error)
      toast.error("Erro ao criar acesso")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAccess = async () => {
    setIsDeleting(true)

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}/access`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Acesso removido com sucesso!")
        setShowDeleteDialog(false)
        fetchMemberAccess()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao remover acesso")
      }
    } catch (error) {
      console.error('Error deleting access:', error)
      toast.error("Erro ao remover acesso")
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      'admin_geral': 'Administrador Geral',
      'admin_sede': 'Administrador Sede',
      'admin_congregacao': 'Administrador Congregação',
      'lider': 'Líder',
      'membro': 'Membro'
    }
    return roles[role] || role
  }

  const getAccessLevelBadge = (level: string) => {
    const levels = {
      'read': { label: 'Leitura', color: 'bg-blue-500' },
      'write': { label: 'Edição', color: 'bg-amber-500' },
      'admin': { label: 'Admin', color: 'bg-red-500' }
    }
    const levelInfo = levels[level as keyof typeof levels] || { label: level, color: 'bg-gray-500' }
    return (
      <Badge className={`${levelInfo.color} text-white`}>
        {levelInfo.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-2 border-amber-200/50 dark:border-amber-800/30">
        <CardHeader className="bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-600" />
                Status de Acesso ao Sistema
              </CardTitle>
              <CardDescription>
                Gerencie as credenciais de acesso deste membro
              </CardDescription>
            </div>
            {hasAccess ? (
              <Badge variant="default" className="gap-1.5 bg-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acesso Ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Sem Acesso
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {hasAccess && userAccess ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email de Acesso</Label>
                  <p className="font-medium">{userAccess.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nível de Acesso</Label>
                  <p className="font-medium">{getRoleName(userAccess.role)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status de Aprovação</Label>
                  <Badge variant={userAccess.approved ? "default" : "secondary"}>
                    {userAccess.approved ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Criação</Label>
                  <p className="font-medium">
                    {new Date(userAccess.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Link de Acesso */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-2 border-blue-200/50 dark:border-blue-800/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <Label className="font-semibold text-blue-700 dark:text-blue-400">
                        Link de Acesso ao Sistema
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/login`}
                        readOnly
                        className="font-mono text-sm bg-white dark:bg-gray-900"
                      />
                      <Button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/login`)
                            toast.success("Link copiado!")
                          } catch (error) {
                            toast.error("Erro ao copiar link")
                          }
                        }}
                        variant="outline"
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe este link com o membro para que ele possa acessar o sistema usando o email: <strong>{userAccess.email}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowChangePasswordDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Alterar Senha
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Acesso
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!showCreateForm ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                    <Key className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Este membro ainda não possui acesso ao sistema
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Crie credenciais de acesso ou envie um link de convite para que este membro se cadastre
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Acesso Manualmente
                    </Button>
                    <Button
                      onClick={handleGenerateInviteLink}
                      disabled={isGeneratingLink || !member.email}
                      variant="outline"
                      className="gap-2"
                    >
                      {isGeneratingLink ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4" />
                          Gerar Link de Convite
                        </>
                      )}
                    </Button>
                  </div>
                  {!member.email && (
                    <p className="text-xs text-muted-foreground mt-3">
                      * Membro precisa ter email cadastrado para receber link de convite
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreateAccess} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Acesso *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Este será o email usado para fazer login no sistema
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                        required
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite a senha novamente"
                        className="pr-10"
                        required
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Nível de Acesso *</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membro">Membro</SelectItem>
                        <SelectItem value="lider">Líder</SelectItem>
                        <SelectItem value="admin_congregacao">Administrador Congregação</SelectItem>
                        <SelectItem value="admin_sede">Administrador Sede</SelectItem>
                        <SelectItem value="admin_geral">Administrador Geral</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Define quais permissões o membro terá no sistema
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Criar Acesso
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        setPassword("")
                        setConfirmPassword("")
                      }}
                      disabled={isCreating}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {/* Invite Link Display */}
              {inviteLink && !showCreateForm && (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200/50 dark:border-green-800/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <LinkIcon className="h-5 w-5" />
                      Link de Convite Gerado
                    </CardTitle>
                    <CardDescription>
                      Envie este link para o membro se cadastrar no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Link de Cadastro (válido por 7 dias)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={inviteLink}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          onClick={handleCopyInviteLink}
                          variant="outline"
                          className="gap-2"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            const message = `Olá ${member.name}! 👋\n\nVocê foi convidado(a) para acessar o sistema da *IPCECMA*.\n\n🔗 Acesse este link para criar sua conta:\n${inviteLink}\n\n_Link válido por 7 dias_`
                            const whatsappUrl = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                            window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
                            toast.success("Abrindo WhatsApp...")
                          }}
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 text-sm space-y-2">
                      <p className="font-medium text-green-700 dark:text-green-400">
                        📱 Como enviar o convite:
                      </p>
                      <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        <li>Clique no botão <strong>WhatsApp</strong> para enviar diretamente para o membro</li>
                        <li>Ou copie o link e envie via email ou SMS</li>
                        <li>O membro poderá usar este link para criar sua conta</li>
                        <li>Os dados do membro já estarão pré-preenchidos</li>
                        <li>Link expira em 7 dias por segurança</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Access Card - Only show if user has access */}
      {hasAccess && userAccess && (
        <Card className="border-2 border-green-200/50 dark:border-green-800/30">
          <CardHeader className="bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  Acesso Geral
                </CardTitle>
                <CardDescription>
                  Permite acesso a todas as congregações do sistema
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={hasGeneralAccess}
                  onCheckedChange={handleToggleGeneralAccess}
                  disabled={isTogglingGeneralAccess}
                />
                {hasGeneralAccess ? (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {hasGeneralAccess ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-600 rounded-lg text-white">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      Acesso Geral Ativado
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>{member.name}</strong> pode visualizar e gerenciar <strong>todas as congregações</strong> do sistema, independente de configurações específicas.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Ideal para administradores gerais que precisam supervisionar todas as congregações.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400">
                      Acesso por Congregação
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>{member.name}</strong> só pode acessar congregações específicas configuradas abaixo.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Use este modo para líderes ou administradores que gerenciam congregações específicas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Congregation Access Card - Only show if user has access */}
      {hasAccess && userAccess && (
        <Card className="border-2 border-blue-200/50 dark:border-blue-800/30">
          <CardHeader className="bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Acesso às Congregações
                  {hasGeneralAccess && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Acesso Geral Ativo
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasGeneralAccess 
                    ? "Configurações específicas (opcional quando acesso geral está ativo)"
                    : "Gerencie quais congregações este membro pode acessar"
                  }
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddCongregationDialog(true)}
                className="gap-2"
                size="sm"
                variant={hasGeneralAccess ? "outline" : "default"}
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {hasGeneralAccess && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Acesso Geral está ativo:</strong> Este usuário já tem acesso a todas as congregações. 
                    As configurações abaixo são opcionais e podem ser usadas para definir níveis de acesso específicos.
                  </span>
                </p>
              </div>
            )}
            {isLoadingCongregations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : congregationAccess.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasGeneralAccess 
                    ? "Nenhum acesso específico configurado (não é necessário com acesso geral)"
                    : "Nenhum acesso específico à congregação configurado"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {hasGeneralAccess 
                    ? "Adicione congregações para definir níveis de acesso personalizados"
                    : "Adicione congregações para permitir o acesso deste usuário"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Congregação</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Nível de Acesso</TableHead>
                    <TableHead>Concedido em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {congregationAccess.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="font-medium">
                        {access.congregation.name}
                        {access.congregation.isHeadquarters && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Sede
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {access.congregation.city}, {access.congregation.state}
                      </TableCell>
                      <TableCell>
                        {getAccessLevelBadge(access.accessLevel)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(access.grantedAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCongregationToDelete(access)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member Levels Card */}
      <Card className="border-2 border-purple-200/50 dark:border-purple-800/30">
        <CardHeader className="bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Níveis de Membro Disponíveis
              </CardTitle>
              <CardDescription>
                Gerencie os tipos e hierarquia de níveis de membros
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddLevelDialog(true)}
              className="gap-2"
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Adicionar Nível
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingLevels ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : memberLevels.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum nível de membro personalizado criado
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Adicione níveis personalizados como Diácono, Presbítero, Evangelista, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberLevels.map((level) => (
                <Card key={level.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20">
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {level.level}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{level.name}</h4>
                          {level.description && (
                            <p className="text-sm text-muted-foreground">
                              {level.description}
                            </p>
                          )}
                          <Badge variant="secondary" className="mt-1">
                            Nível {level.level}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMemberLevel(level.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/10 border-2 border-amber-200/50 dark:border-amber-800/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-600 rounded-lg text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Sobre o Controle de Acesso</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  O sistema oferece dois tipos de gerenciamento de acesso às congregações:
                </p>
                <div className="space-y-3 ml-2">
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <strong>Acesso Geral:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-6 mt-1">
                      <li>Permite acesso a <strong>todas as congregações</strong> automaticamente</li>
                      <li>Ideal para administradores gerais e supervisores</li>
                      <li>Não requer configuração individual por congregação</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <strong>Acesso por Congregação:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-6 mt-1">
                      <li>Limita o acesso a congregações específicas</li>
                      <li>Define níveis diferentes (Leitura, Edição, Admin) por congregação</li>
                      <li>Ideal para líderes e administradores locais</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Congregation Dialog */}
      <Dialog open={showAddCongregationDialog} onOpenChange={setShowAddCongregationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Adicionar Acesso à Congregação
            </DialogTitle>
            <DialogDescription>
              Conceda acesso para <strong>{member.name}</strong> visualizar ou gerenciar uma congregação específica.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Congregação *</Label>
              <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma congregação" />
                </SelectTrigger>
                <SelectContent>
                  {congregations.map((cong) => (
                    <SelectItem key={cong.id} value={cong.id.toString()}>
                      {cong.name} - {cong.city}, {cong.state}
                      {cong.isHeadquarters && " (Sede)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso *</Label>
              <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Leitura - Apenas visualizar
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Edição - Visualizar e editar
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Admin - Controle total
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Dica:</strong> Use "Leitura" para membros que só precisam visualizar, "Edição" para líderes que podem gerenciar, e "Admin" para administradores com controle total.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddCongregationDialog(false)
                setSelectedCongregationId("")
                setSelectedAccessLevel("read")
              }}
              disabled={isAddingCongregation}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCongregationAccess}
              disabled={isAddingCongregation}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isAddingCongregation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Adicionar Acesso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Level Dialog */}
      <Dialog open={showAddLevelDialog} onOpenChange={setShowAddLevelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Criar Novo Nível de Membro
            </DialogTitle>
            <DialogDescription>
              Adicione um novo tipo hierárquico de membro (ex: Diácono, Presbítero, Pastor)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Nível *</Label>
              <Input
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Ex: Diácono, Presbítero, Evangelista"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={newLevelDescription}
                onChange={(e) => setNewLevelDescription(e.target.value)}
                placeholder="Breve descrição do nível"
              />
            </div>

            <div className="space-y-2">
              <Label>Nível Hierárquico (1-10) *</Label>
              <Select value={newLevelNumber.toString()} onValueChange={(v) => setNewLevelNumber(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Nível {num} {num <= 3 ? "(Básico)" : num <= 6 ? "(Intermediário)" : "(Avançado)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Quanto maior o número, mais alto o nível na hierarquia
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddLevelDialog(false)
                setNewLevelName("")
                setNewLevelDescription("")
                setNewLevelNumber(5)
              }}
              disabled={isAddingLevel}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddMemberLevel}
              disabled={isAddingLevel}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isAddingLevel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Nível
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Congregation Access Dialog */}
      <AlertDialog 
        open={!!congregationToDelete} 
        onOpenChange={(open) => !open && setCongregationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso à congregação?</AlertDialogTitle>
            <AlertDialogDescription>
              Isto removerá o acesso de <strong>{member.name}</strong> à congregação{" "}
              <strong>{congregationToDelete?.congregation.name}</strong>.
              O usuário não poderá mais visualizar ou gerenciar esta congregação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCongregationToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => congregationToDelete && handleRemoveCongregationAccess(congregationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Alterar Senha de Acesso
            </DialogTitle>
            <DialogDescription>
              Defina uma nova senha para <strong>{member.name}</strong>. O membro poderá fazer login com esta nova senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmar Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="pr-10"
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Atenção:</strong> Após alterar a senha, informe o membro sobre a mudança e forneça a nova senha de forma segura.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePasswordDialog(false)
                  setNewPassword("")
                  setConfirmNewPassword("")
                }}
                disabled={isChangingPassword}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Access Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso ao sistema?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá as credenciais de acesso de <strong>{member.name}</strong>.
              O membro não poderá mais fazer login no sistema até que um novo acesso seja criado.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccess}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover Acesso"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}