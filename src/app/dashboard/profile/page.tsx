"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Member {
  id: number
  congregationId: number
  name: string
  cpf: string | null
  rg: string | null
  birthDate: string
  age: number | null
  sex: string
  maritalStatus: string | null
  spouse: string | null
  email: string | null
  phone: string
  address: string | null
  cep: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  position: string
  baptismDate: string | null
  memberSince: string
  photoUrl: string | null
  status: string
  congregation: {
    id: number
    name: string
    city: string
    state: string
  }
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    if (user) {
      fetchMemberProfile()
    }
  }, [user])

  const fetchMemberProfile = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      
      // Usar endpoint dedicado para buscar perfil do usuário logado
      const response = await fetch('/api/members/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar perfil')
      }

      const data = await response.json()
      if (data.member) {
        setMember(data.member)
        setEditForm({
          phone: data.member.phone,
          address: data.member.address || '',
          cep: data.member.cep || '',
          neighborhood: data.member.neighborhood || '',
          city: data.member.city || '',
          state: data.member.state || '',
          maritalStatus: data.member.maritalStatus || 'não informado',
          spouse: data.member.spouse || '',
        })
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error)
      toast.error(error.message || "Erro ao carregar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!member) return

    setIsSaving(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar perfil')
      }

      toast.success("Perfil atualizado com sucesso!")
      setIsEditing(false)
      fetchMemberProfile()
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'admin_geral': 'Administrador Geral',
      'admin_sede': 'Administrador da Sede',
      'admin_congregacao': 'Administrador da Congregação',
      'membro': 'Membro'
    }
    return roles[role] || role
  }

  const getPositionLabel = (position: string) => {
    const positions: Record<string, string> = {
      'membro': 'Membro',
      'pastor': 'Pastor',
      'diacono': 'Diácono',
      'lider': 'Líder de Ministério',
      'obreiro': 'Obreiro',
      'secretario': 'Secretário',
      'tesoureiro': 'Tesoureiro'
    }
    return positions[position] || position
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
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Seu perfil de membro ainda não foi criado. Entre em contato com a administração.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 ring-4 ring-amber-500/30 ring-offset-4 ring-offset-background transition-all group-hover:ring-amber-500/50 group-hover:scale-105">
                    <AvatarImage src={member.photoUrl || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white text-3xl font-bold shadow-lg">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">{member.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {member.congregation.name} - {member.congregation.city}/{member.congregation.state}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-300 dark:border-amber-700">
                      {getPositionLabel(member.position)}
                    </Badge>
                    <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300 dark:border-blue-700">
                      {getRoleLabel(user?.role || 'membro')}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm">
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <Edit size={16} />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="church">Dados Eclesiásticos</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>
                  Suas informações básicas e documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User size={16} />
                      Nome Completo
                    </Label>
                    <Input value={member.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail size={16} />
                      E-mail
                    </Label>
                    <Input value={member.email || 'Não informado'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={member.cpf || 'Não informado'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>RG</Label>
                    <Input value={member.rg || 'Não informado'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar size={16} />
                      Data de Nascimento
                    </Label>
                    <Input 
                      value={new Date(member.birthDate).toLocaleDateString('pt-BR')} 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Idade</Label>
                    <Input value={member.age ? `${member.age} anos` : 'Não calculada'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Input value={member.sex} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado Civil</Label>
                    {isEditing ? (
                      <Select
                        value={editForm.maritalStatus}
                        onValueChange={(value) => setEditForm({ ...editForm, maritalStatus: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="não informado">Não informado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={member.maritalStatus || 'Não informado'} disabled />
                    )}
                  </div>
                  {(editForm.maritalStatus === 'casado' || member.maritalStatus === 'casado') && (
                    <div className="space-y-2">
                      <Label>Cônjuge</Label>
                      {isEditing ? (
                        <Input
                          value={editForm.spouse}
                          onChange={(e) => setEditForm({ ...editForm, spouse: e.target.value })}
                        />
                      ) : (
                        <Input value={member.spouse || 'Não informado'} disabled />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>
                  Endereço e telefone para contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone size={16} />
                      Telefone
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    ) : (
                      <Input value={member.phone} disabled />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.cep}
                        onChange={(e) => setEditForm({ ...editForm, cep: e.target.value })}
                      />
                    ) : (
                      <Input value={member.cep || 'Não informado'} disabled />
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <MapPin size={16} />
                      Endereço
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    ) : (
                      <Input value={member.address || 'Não informado'} disabled />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.neighborhood}
                        onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                      />
                    ) : (
                      <Input value={member.neighborhood || 'Não informado'} disabled />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    ) : (
                      <Input value={member.city || 'Não informado'} disabled />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        maxLength={2}
                      />
                    ) : (
                      <Input value={member.state || 'Não informado'} disabled />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="church" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Eclesiásticos</CardTitle>
                <CardDescription>
                  Informações sobre sua participação na igreja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Congregação</Label>
                    <Input 
                      value={`${member.congregation.name} - ${member.congregation.city}/${member.congregation.state}`} 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo/Função</Label>
                    <Input value={getPositionLabel(member.position)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar size={16} />
                      Membro desde
                    </Label>
                    <Input 
                      value={new Date(member.memberSince).toLocaleDateString('pt-BR')} 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data do Batismo</Label>
                    <Input 
                      value={member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : 'Não informado'} 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Input value={member.status} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isEditing && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="flex items-center justify-between py-4">
              <p className="text-sm text-muted-foreground">
                Tem alterações não salvas
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      phone: member.phone,
                      address: member.address || '',
                      cep: member.cep || '',
                      neighborhood: member.neighborhood || '',
                      city: member.city || '',
                      state: member.state || '',
                      maritalStatus: member.maritalStatus || 'não informado',
                      spouse: member.spouse || '',
                    })
                  }}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <X size={16} />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}