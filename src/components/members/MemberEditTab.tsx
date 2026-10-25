"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import PositionMultiSelect, { parsePositions, serializePositions } from "@/components/members/PositionMultiSelect"

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
}

interface Congregation {
  id: number
  name: string
  city: string
}

interface Props {
  member: Member
  onUpdate: () => void
}

export default function MemberEditTab({ member, onUpdate }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(member.photoUrl)
  // positions stored as string[] internally, serialized on submit
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    parsePositions(member.position)
  )
  const [formData, setFormData] = useState({
    name: member.name,
    cpf: member.cpf || "",
    rg: member.rg || "",
    birthDate: member.birthDate,
    sex: member.sex,
    maritalStatus: member.maritalStatus || "",
    email: member.email || "",
    phone: member.phone,
    address: member.address || "",
    cep: member.cep || "",
    neighborhood: member.neighborhood || "",
    city: member.city || "",
    state: member.state || "",
    congregationId: member.congregationId.toString(),
    baptismDate: member.baptismDate || "",
    memberSince: member.memberSince || "",
    photoUrl: member.photoUrl || "",
    status: member.status
  })

  useEffect(() => {
    fetchCongregations()
  }, [])

  const fetchCongregations = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/congregations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
      }
    } catch (error) {
      console.error('Error fetching congregations:', error)
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
        if (data.erro) { toast.error("CEP não encontrado"); return }
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
      console.error('Error fetching CEP:', error)
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, cep: value }))
    if (value.replace(/\D/g, '').length === 8) fetchAddressByCep(value)
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age.toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPositions.length === 0) {
      toast.error("Selecione pelo menos um cargo eclesiástico")
      return
    }
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
        position: serializePositions(selectedPositions),
        congregationId: parseInt(formData.congregationId),
        age: age ? parseInt(age) : null,
        cpf: formData.cpf || null,
        rg: formData.rg || null,
        maritalStatus: formData.maritalStatus || null,
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

      const response = await fetch(`/api/members/${member.id}`, {
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
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar membro")
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

  const canSelectCongregation = user?.role === 'admin_geral' || user?.role === 'admin_sede' || user?.hasGeneralAccess === true

  return (
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
                <Select value={formData.maritalStatus} onValueChange={(value) => handleChange("maritalStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="viúvo(a)">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <Button type="submit" disabled={isLoading} size="lg">
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
  )
}
