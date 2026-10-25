"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Calendar, User, Heart, FileText } from "lucide-react"
import { parsePositions, getPositionLabel, DEFAULT_POSITIONS, loadCustomPositions } from "@/components/members/PositionMultiSelect"
import { useMemo } from "react"

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
  position: string
  baptismDate: string | null
  memberSince: string | null
  createdAt: string
  updatedAt: string
  congregation: {
    name: string
    city: string
    state: string
  }
}

interface Props {
  member: Member
}

export default function MemberInfoTab({ member }: Props) {
  const allPositions = useMemo(
    () => [...DEFAULT_POSITIONS, ...loadCustomPositions()],
    []
  )
  const positions = useMemo(() => parsePositions(member.position), [member.position])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado"
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-1">
        <Icon size={18} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value || "Não informado"}</p>
      </div>
    </div>
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Dados pessoais do membro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <InfoItem icon={User} label="Nome Completo" value={member.name} />
          <InfoItem icon={FileText} label="CPF" value={member.cpf} />
          <InfoItem icon={FileText} label="RG" value={member.rg} />
          <InfoItem 
            icon={Calendar} 
            label="Data de Nascimento" 
            value={formatDate(member.birthDate)}
          />
          <InfoItem 
            icon={User} 
            label="Idade" 
            value={member.age ? `${member.age} anos` : null}
          />
          <InfoItem 
            icon={User} 
            label="Sexo" 
            value={member.sex === "masculino" ? "Masculino" : "Feminino"}
          />
          <InfoItem 
            icon={Heart} 
            label="Estado Civil" 
            value={member.maritalStatus}
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone size={20} />
            Informações de Contato
          </CardTitle>
          <CardDescription>Formas de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <InfoItem icon={Mail} label="E-mail" value={member.email} />
          <InfoItem icon={Phone} label="Telefone" value={member.phone} />
          <InfoItem icon={MapPin} label="Endereço" value={member.address} />
          <InfoItem icon={MapPin} label="CEP" value={member.cep} />
          <InfoItem icon={MapPin} label="Bairro" value={member.neighborhood} />
          <InfoItem 
            icon={MapPin} 
            label="Cidade/Estado" 
            value={member.city && member.state ? `${member.city} - ${member.state}` : member.city || member.state}
          />
        </CardContent>
      </Card>

      {/* Church Information */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Informações Eclesiásticas
          </CardTitle>
          <CardDescription>Dados relacionados à igreja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <InfoItem 
              icon={MapPin} 
              label="Congregação" 
              value={`${member.congregation.name} - ${member.congregation.city}`}
            />
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="mt-1">
                <User size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Cargo(s)</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {positions.length > 0 ? positions.map(v => (
                    <Badge key={v} variant="secondary" className="text-xs font-medium">
                      {getPositionLabel(v, allPositions)}
                    </Badge>
                  )) : (
                    <span className="text-sm font-semibold">Não informado</span>
                  )}
                </div>
              </div>
            </div>
            <InfoItem 
              icon={Calendar} 
              label="Data de Batismo" 
              value={formatDate(member.baptismDate)}
            />
            <InfoItem 
              icon={Calendar} 
              label="Membro Desde" 
              value={formatDate(member.memberSince)}
            />
            <InfoItem 
              icon={Calendar} 
              label="Cadastrado em" 
              value={formatDate(member.createdAt)}
            />
            <InfoItem 
              icon={Calendar} 
              label="Última Atualização" 
              value={formatDate(member.updatedAt)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
