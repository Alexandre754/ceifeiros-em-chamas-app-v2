"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { SpouseSelector } from "@/components/members/SpouseSelector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import PositionMultiSelect, { serializePositions } from "@/components/members/PositionMultiSelect"

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

export default function AddMemberPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
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
    memberLevelId: "",
    baptismDate: "",
    memberSince: "",
    photoUrl: ""
  })

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Você precisa estar autenticado para adicionar membros")
      router.replace("/login?redirect=/dashboard/members/add")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user) {
      fetchCongregations()
      fetchMemberLevels()

      if (user.role === 'admin_congregacao' || user.role === 'membro') {
        if (user.congregationId) {
          setFormData(prev => ({ ...prev, congregationId: user.congregationId!.toString() }))
        }
      }
    }
  }, [authLoading, user])

  const fetchCongregations = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) return

      const response = await fetch('/api/congregations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
        if (data.length === 0) {
          toast.error("Nenhuma congregação cadastrada. Por favor, cadastre uma congregação primeiro.")
        }
      } else if (response.status === 401) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.")
        localStorage.removeItem('bearer_token')
        router.replace("/login?redirect=/dashboard/members/add")
      }
    } catch (error) {
      console.error('Erro ao buscar congregações:', error)
    }
  }

  const fetchMemberLevels = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) return

      const response = await fetch('/api/member-levels?active=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMemberLevels(data)
      }
    } catch (error) {
      console.error('Erro ao buscar níveis:', error)
    }
  }

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

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
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP")
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, cep: value }))
    const cleanCep = value.replace(/\D/g, '')
    if (cleanCep.length === 8) fetchAddressByCep(value)
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
    
    if (!formData.congregationId) {
      toast.error("Por favor, selecione uma congregação")
      return
    }
    if (!formData.name.trim()) {
      toast.error("Por favor, preencha o nome completo")
      return
    }
    if (!formData.birthDate) {
      toast.error("Por favor, preencha a data de nascimento")
      return
    }
    if (!formData.sex) {
      toast.error("Por favor, selecione o sexo")
      return
    }
    if (!formData.phone.trim()) {
      toast.error("Por favor, preencha o telefone")
      return
    }
    if (selectedPositions.length === 0) {
      toast.error("Por favor, selecione pelo menos um cargo eclesiástico")
      return
    }

    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.")
        router.replace('/login?redirect=/dashboard/members/add')
        return
      }
      
      const age = calculateAge(formData.birthDate)
      
      const payload = {
        congregationId: parseInt(formData.congregationId),
        name: formData.name.trim(),
        cpf: formData.cpf || null,
        rg: formData.rg || null,
        birthDate: formData.birthDate,
        age: age ? parseInt(age) : null,
        sex: formData.sex,
        maritalStatus: formData.maritalStatus || null,
        spouse: formData.spouse || null,
        email: formData.email || null,
        phone: formData.phone.trim(),
        address: formData.address || null,
        cep: formData.cep || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        state: formData.state || null,
        position: serializePositions(selectedPositions),
        memberLevelId: formData.memberLevelId && formData.memberLevelId !== "none" ? parseInt(formData.memberLevelId) : null,
        baptismDate: formData.baptismDate || null,
        memberSince: formData.memberSince || null,
        photoUrl: formData.photoUrl || null,
        status: "ativo"
      }

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()

      if (response.ok) {
        toast.success("Membro cadastrado com sucesso!")
        router.push("/dashboard/members")
      } else {
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Por favor, faça login novamente.")
          localStorage.removeItem('bearer_token')
          router.replace('/login?redirect=/dashboard/members/add')
        } else if (response.status === 403) {
          toast.error("Você não tem permissão para adicionar membros a esta congregação")
        } else if (response.status === 400) {
          if (responseData.code === 'DUPLICATE_CPF') {
            toast.error("Este CPF já está cadastrado no sistema")
          } else if (responseData.code === 'MISSING_REQUIRED_FIELDS') {
            toast.error("Por favor, preencha todos os campos obrigatórios")
          } else {
            toast.error(responseData.error || "Erro ao cadastrar membro")
          }
        } else {
          toast.error(responseData.error || "Erro ao cadastrar membro")
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar membro:', error)
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null

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
            <h1 className="text-3xl font-bold">Adicionar Novo Membro</h1>
            <p className="text-muted-foreground">Preencha os dados do novo membro da igreja</p>
          </div>
        </div>

        {congregations.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Nenhuma congregação cadastrada.{" "}
              <Link href="/dashboard/congregations" className="underline font-medium">
                Ir para Congregações
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Foto do Membro</CardTitle>
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
                      <span><Upload size={16} className="mr-2" />Selecionar Foto</span>
                    </Button>
                  </Label>
                  <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => handleChange("cpf", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input id="rg" value={formData.rg} onChange={(e) => handleChange("rg", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento *</Label>
                    <Input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => handleChange("birthDate", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Idade</Label>
                    <Input id="age" value={calculateAge(formData.birthDate)} disabled placeholder="Calculado automaticamente" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sexo *</Label>
                    <Select value={formData.sex} onValueChange={(value) => handleChange("sex", value)}>
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
                    <Select value={formData.maritalStatus} onValueChange={(value) => handleChange("maritalStatus", value)}>
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
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} required />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <Input id="cep" placeholder="00000-000" value={formData.cep} onChange={(e) => handleCepChange(e.target.value)} maxLength={9} />
                      {isFetchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-amber-600" />}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" value={formData.neighborhood} onChange={(e) => handleChange("neighborhood", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} maxLength={2} placeholder="SP" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Eclesiásticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="congregation">Congregação *</Label>
                    {canSelectCongregation ? (
                      <Select value={formData.congregationId} onValueChange={(value) => handleChange("congregationId", value)}>
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
                      <Input value={congregations.find(c => c.id.toString() === formData.congregationId)?.name || ""} disabled />
                    )}
                  </div>
                  <div className="space-y-2 relative">
                    <Label>Cargo(s) Eclesiástico(s) *</Label>
                    <PositionMultiSelect
                      value={selectedPositions}
                      onChange={setSelectedPositions}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberLevelId">Nível de Acesso</Label>
                    <Select value={formData.memberLevelId || "none"} onValueChange={(value) => handleChange("memberLevelId", value === "none" ? "" : value)}>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baptismDate">Data de Batismo</Label>
                    <Input id="baptismDate" type="date" value={formData.baptismDate} onChange={(e) => handleChange("baptismDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberSince">Membro Desde</Label>
                    <Input id="memberSince" type="date" value={formData.memberSince} onChange={(e) => handleChange("memberSince", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Link href="/dashboard/members">
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isLoading || congregations.length === 0} className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" />Salvar Membro</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}