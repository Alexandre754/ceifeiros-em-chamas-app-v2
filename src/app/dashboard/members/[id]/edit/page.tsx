"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { SpouseSelector } from "@/components/members/SpouseSelector"

interface Congregation {
  id: number
  name: string
  city: string
}

interface MemberLevel {
  id: number
  name: string
  description: string | null
  level: number
  active: boolean
}

export default function EditMemberPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    rg: "",
    birthDate: "",
    sex: "",
    maritalStatus: "",
    spouse: "",
    email: "",
    phone: "",
    address: "",
    cep: "",
    neighborhood: "",
    city: "",
    state: "",
    congregationId: "",
    position: "",
    memberLevelId: "",
    baptismDate: "",
    memberSince: "",
    photoUrl: "",
    status: "ativo"
  })

  useEffect(() => {
    if (!authLoading && user) {
      fetchCongregations()
      fetchMemberLevels()
      fetchMember()
    }
  }, [authLoading, user, memberId])

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

  const fetchMemberLevels = async () => {
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
    }
  }

  const fetchMember = async () => {
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
        setFormData({
          name: data.name || "",
          cpf: data.cpf || "",
          rg: data.rg || "",
          birthDate: data.birthDate || "",
          sex: data.sex || "",
          maritalStatus: data.maritalStatus || "",
          spouse: data.spouse || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          cep: data.cep || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
          congregationId: data.congregationId?.toString() || "",
          position: data.position || "",
          memberLevelId: data.memberLevelId?.toString() || "",
          baptismDate: data.baptismDate || "",
          memberSince: data.memberSince || "",
          photoUrl: data.photoUrl || "",
          status: data.status || "ativo"
        })
        
        if (data.photoUrl) {
          setPhotoPreview(data.photoUrl)
        }
      } else if (response.status === 401) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.")
        router.push('/login')
      } else if (response.status === 403) {
        toast.error("Você não tem permissão para editar este membro")
        router.push('/dashboard/members')
      } else if (response.status === 404) {
        toast.error("Membro não encontrado")
        router.push('/dashboard/members')
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error("Erro ao carregar dados do membro")
    } finally {
      setIsFetching(false)
    }
  }

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      return
    }

    setIsFetchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.erro) {
          toast.error("CEP não encontrado")
          return
        }

        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state
        }))
        
        toast.success("Endereço encontrado!")
      } else {
        toast.error("Erro ao buscar CEP")
      }
    } catch (error) {
      console.error('Error fetching CEP:', error)
      toast.error("Erro ao buscar CEP")
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, cep: value }))
    
    const cleanCep = value.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      fetchAddressByCep(value)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setPhotoPreview(base64)
        setFormData(prev => ({ ...prev, photoUrl: base64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ""
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age.toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('bearer_token')
      
      if (!token) {
        toast.error("Você precisa estar autenticado")
        router.push('/login')
        return
      }
      
      const age = calculateAge(formData.birthDate)
      
      const payload = {
        ...formData,
        congregationId: parseInt(formData.congregationId),
        memberLevelId: formData.memberLevelId ? parseInt(formData.memberLevelId) : null,
        age: age ? parseInt(age) : null,
        cpf: formData.cpf || null,
        rg: formData.rg || null,
        maritalStatus: formData.maritalStatus || null,
        spouse: formData.spouse || null,
        email: formData.email || null,
        address: formData.address || null,
        cep: formData.cep || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        state: formData.state || null,
        baptismDate: formData.baptismDate || null,
        memberSince: formData.memberSince || null,
        photoUrl: formData.photoUrl || null
      }

      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success("Membro atualizado com sucesso!", {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
        router.push("/dashboard/members")
      } else {
        const error = await response.json()
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Por favor, faça login novamente.")
          router.push('/login')
        } else if (response.status === 403) {
          toast.error("Você não tem permissão para editar este membro")
        } else {
          toast.error(error.error || "Erro ao atualizar membro")
        }
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error("Erro ao atualizar membro")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  if (authLoading || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    )
  }

  const canSelectCongregation = user?.role === 'admin_geral' || user?.role === 'admin_sede' || user?.hasGeneralAccess === true

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/members">
            <Button variant="outline" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Membro</h1>
            <p className="text-muted-foreground">
              Atualize os dados do membro
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Foto do Membro</CardTitle>
                <CardDescription>Faça upload de uma foto do membro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={40} className="text-muted-foreground" />
                    )}
                  </div>
                  <Label htmlFor="photo" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload size={16} className="mr-2" />
                        Alterar Foto
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleChange("cpf", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleChange("rg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleChange("birthDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Idade</Label>
                    <Input
                      id="age"
                      value={calculateAge(formData.birthDate)}
                      disabled
                      placeholder="Calculado automaticamente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sexo *</Label>
                    <Select value={formData.sex} onValueChange={(value) => handleChange("sex", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Estado Civil</Label>
                    <Select 
                      value={formData.maritalStatus} 
                      onValueChange={(value) => handleChange("maritalStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado civil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.maritalStatus === "casado" && (
                    <div className="md:col-span-2">
                      <SpouseSelector
                        value={formData.spouse}
                        onChange={(value) => handleChange("spouse", value)}
                        currentMemberSex={formData.sex}
                        currentMemberId={parseInt(memberId)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>O endereço será preenchido automaticamente ao digitar o CEP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        maxLength={9}
                      />
                      {isFetchingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-amber-600" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Preenchido automaticamente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleChange("neighborhood", e.target.value)}
                      placeholder="Preenchido automaticamente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Preenchido automaticamente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Church Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Eclesiásticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="congregation">Congregação *</Label>
                    {canSelectCongregation ? (
                      <Select 
                        value={formData.congregationId} 
                        onValueChange={(value) => handleChange("congregationId", value)} 
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a congregação" />
                        </SelectTrigger>
                        <SelectContent>
                          {congregations.map(cong => (
                            <SelectItem key={cong.id} value={cong.id.toString()}>
                              {cong.name} - {cong.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={congregations.find(c => c.id.toString() === formData.congregationId)?.name || ""}
                        disabled
                        placeholder="Sua congregação"
                      />
                    )}
                    {!canSelectCongregation && (
                      <p className="text-xs text-muted-foreground">
                        Você só pode gerenciar membros da sua congregação
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo Eclesiástico *</Label>
                    <Select value={formData.position} onValueChange={(value) => handleChange("position", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membro">Membro</SelectItem>
                        <SelectItem value="pastor">Pastor</SelectItem>
                        <SelectItem value="pastora">Pastora</SelectItem>
                        <SelectItem value="pastor-presidente">Pastor Presidente</SelectItem>
                        <SelectItem value="vice-presidente">Vice Presidente</SelectItem>
                        <SelectItem value="diacono">Diácono</SelectItem>
                        <SelectItem value="diaconisa">Diaconisa</SelectItem>
                        <SelectItem value="presbitero">Presbítero</SelectItem>
                        <SelectItem value="presbitera">Presbítera</SelectItem>
                        <SelectItem value="evangelista">Evangelista</SelectItem>
                        <SelectItem value="lider-celula">Líder de Célula</SelectItem>
                        <SelectItem value="lider-ministerio">Líder de Ministério</SelectItem>
                        <SelectItem value="1-secretaria">1ª Secretaria</SelectItem>
                        <SelectItem value="2-secretaria">2ª Secretaria</SelectItem>
                        <SelectItem value="1-tesoureiro">1º Tesoureiro</SelectItem>
                        <SelectItem value="2-tesoureiro">2º Tesoureiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberLevelId">Nível de Acesso</Label>
                    <Select 
                      value={formData.memberLevelId || "none"} 
                      onValueChange={(value) => handleChange("memberLevelId", value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {memberLevels.map(level => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            Nível {level.level} - {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Define o nível hierárquico do membro (ex: Diácono, Presbítero)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baptismDate">Data de Batismo</Label>
                    <Input
                      id="baptismDate"
                      type="date"
                      value={formData.baptismDate}
                      onChange={(e) => handleChange("baptismDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberSince">Membro Desde</Label>
                    <Input
                      id="memberSince"
                      type="date"
                      value={formData.memberSince}
                      onChange={(e) => handleChange("memberSince", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Link href="/dashboard/members">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}