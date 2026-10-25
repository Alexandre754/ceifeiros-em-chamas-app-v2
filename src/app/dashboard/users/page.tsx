"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Search, 
  Edit, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  Crown,
  Key,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserData {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  approved: boolean
  hasGeneralAccess: boolean
  congregationId: number | null
  createdAt: string
  updatedAt: string
  congregation: {
    id: number
    name: string
    city: string
    state: string
    isHeadquarters: boolean
  } | null
}

const permissionModules = [
  { id: 'module:finance', label: 'Financeiro (Transações/Relatórios)', icon: Key },
  { id: 'module:members', label: 'Membros (Cadastro/Lista)', icon: Users },
  { id: 'module:assets', label: 'Patrimônio (Bens/Inventário)', icon: Key },
  { id: 'module:donations', label: 'Doações', icon: Key },
  { id: 'module:certificates', label: 'Certificados (Batismo/Apresentação)', icon: Key },
  { id: 'module:congregations', label: 'Congregações (Gestão)', icon: Key },
  { id: 'module:users', label: 'Usuários (Gestão de Acessos)', icon: Shield },
  { id: 'module:permissions', label: 'Permissões (Configurações)', icon: Shield },
  { id: 'module:settings', label: 'Configurações do Sistema', icon: Key },
]

export default function UsersManagementPage() {
  const { user, refreshUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false)
  
  const [editForm, setEditForm] = useState({
    role: "",
    approved: false,
    hasGeneralAccess: false
  })

  useEffect(() => {
    const adminRoles: string[] = ['admin_geral', 'admin_sede']
    if (user?.role === 'admin_geral') {
      fetchUsers()
    } else if (user && !adminRoles.includes(user.role)) {
      toast.error("Acesso restrito apenas para administradores")
      window.location.href = '/dashboard'
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }

      const data = await response.json()
      setUsers(data)
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      toast.error(error.message || "Erro ao carregar usuários")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserPermissions = async (userId: number) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/users/${userId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.map((p: any) => p.permissionKey))
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error)
    }
  }

  const handleEditClick = async (userData: UserData) => {
    setSelectedUser(userData)
    setEditForm({
      role: userData.role,
      approved: userData.approved,
      hasGeneralAccess: userData.hasGeneralAccess
    })
    setUserPermissions([])
    setShowAdvancedPermissions(false)
    await fetchUserPermissions(userData.id)
    setEditDialogOpen(true)
  }

  const handleSaveChanges = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      // 1. Update basic info
      const userResponse = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (!userResponse.ok) {
        const error = await userResponse.json()
        throw new Error(error.error || 'Erro ao atualizar usuário')
      }

      // 2. Update permissions
      await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: userPermissions })
      })

      toast.success("Usuário atualizado com sucesso!")
      setEditDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
      
      // If editing self, refresh auth context
      if (selectedUser.id === user?.id) {
        await refreshUser()
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error(error.message || "Erro ao atualizar usuário")
    } finally {
      setIsProcessing(false)
    }
  }

  const togglePermission = (permId: string) => {
    setUserPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    )
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      'admin_geral': 'Admin Geral',
      'admin_sede': 'Admin Sede',
      'admin_congregacao': 'Admin Congregação',
      'secretaria_sede': 'Secretaria Sede',
      'secretaria_jarinu': 'Secretaria Jarinu',
      'lider': 'Líder',
      'membro': 'Membro'
    }
    return roles[role] || role
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin_geral') return 'default'
    if (role === 'admin_sede') return 'secondary'
    return 'outline'
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isMembro = editForm.role === 'membro'

  if (!user || (user.role !== 'admin_geral' && user.role !== 'admin_sede')) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="font-semibold text-lg mb-2">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Apenas administradores podem acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg text-white">
                <Users className="h-6 w-6" />
              </div>
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie níveis de acesso e permissões de usuários
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.approved).length}
              </div>
              <p className="text-xs text-muted-foreground">Com acesso ativo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {users.filter(u => !u.approved).length}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Acesso Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.hasGeneralAccess).length}
              </div>
              <p className="text-xs text-muted-foreground">Com acesso ampliado</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>
                  Edite permissões e status de aprovação
                </CardDescription>
              </div>
              <div className="w-full sm:w-72 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acesso Geral</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{userData.name}</p>
                            {userData.congregation && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin size={12} />
                                {userData.congregation.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm flex items-center gap-1">
                              <Mail size={12} className="text-muted-foreground" />
                              {userData.email}
                            </p>
                            {userData.phone && (
                              <p className="text-sm flex items-center gap-1">
                                <Phone size={12} className="text-muted-foreground" />
                                {userData.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(userData.role)}>
                            {userData.role === 'admin_geral' && <Crown size={12} className="mr-1" />}
                            {getRoleName(userData.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userData.approved ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle size={12} className="mr-1" />
                              Aprovado
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle size={12} className="mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {userData.hasGeneralAccess ? (
                            <Badge className="bg-blue-600 hover:bg-blue-700">
                              <Key size={12} className="mr-1" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(userData)}
                          >
                            <Edit size={14} className="mr-1" />
                            Editar
                          </Button>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Editar Permissões de Usuário</DialogTitle>
            <DialogDescription>
              Altere o nível de acesso e permissões granulares de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso *</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_geral">
                        <div className="flex items-center gap-2">
                          <Crown size={14} />
                          Admin Geral
                        </div>
                      </SelectItem>
                      <SelectItem value="admin_sede">
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          Admin Sede
                        </div>
                      </SelectItem>
                      <SelectItem value="admin_congregacao">Admin Congregação</SelectItem>
                      <SelectItem value="secretaria_sede">Secretaria Sede</SelectItem>
                      <SelectItem value="lider">Líder</SelectItem>
                      <SelectItem value="membro">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <div className="flex-1">
                    <Label htmlFor="approved" className="text-sm font-semibold cursor-pointer">
                      Aprovado
                    </Label>
                  </div>
                  <Switch
                    id="approved"
                    checked={editForm.approved}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, approved: checked })}
                    disabled={isProcessing}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-blue-50/30 dark:bg-blue-950/10">
                <div className="flex-1">
                  <Label htmlFor="generalAccess" className="text-base font-semibold cursor-pointer">
                    Acesso Geral (Todas as Congregações)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ignora restrições de congregação para este usuário
                  </p>
                </div>
                <Switch
                  id="generalAccess"
                  checked={editForm.hasGeneralAccess}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, hasGeneralAccess: checked })}
                  disabled={isProcessing}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="space-y-4">
                <button 
                  type="button"
                  onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                  className="flex items-center justify-between w-full p-4 rounded-lg border bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <div className="text-left">
                      <p className="font-semibold">Permissões Específicas</p>
                      <p className="text-xs text-muted-foreground">
                        {isMembro 
                          ? "Membros sem permissões selecionadas vêem apenas conteúdo postado" 
                          : "Libere módulos específicos para este usuário"}
                      </p>
                    </div>
                  </div>
                  {showAdvancedPermissions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showAdvancedPermissions && (
                  <div className="grid grid-cols-1 gap-2 border rounded-lg p-4 bg-muted/20">
                    {permissionModules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={module.id} 
                          checked={userPermissions.includes(module.id)}
                          onCheckedChange={() => togglePermission(module.id)}
                          className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                        />
                        <Label 
                          htmlFor={module.id}
                          className="flex-1 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <module.icon size={16} className="text-muted-foreground" />
                          {module.label}
                        </Label>
                      </div>
                    ))}
                    
                    {userPermissions.length === 0 && isMembro && (
                      <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-md border border-amber-200/50">
                        <p className="text-xs text-amber-800 dark:text-amber-400">
                          <strong>Observação:</strong> Como Membro sem permissões específicas, este usuário terá acesso apenas aos 
                          Eventos, Sermões, Comunidade, Banners e ao seu próprio Perfil.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-semibold text-sm">Resumo da Conta</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Usuário:</strong> {selectedUser?.name}</p>
                  <p><strong>Congregação Original:</strong> {selectedUser?.congregation?.name || 'Nenhuma'}</p>
                  <p><strong>Data de Cadastro:</strong> {selectedUser ? new Date(selectedUser.createdAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 border-t mt-auto">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedUser(null)
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isProcessing}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
