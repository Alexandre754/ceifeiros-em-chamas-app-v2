"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Member {
  id: number
  name: string
}

interface Props {
  member: Member
}

export default function MemberAdditionalFieldsTab({ member }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Campos Adicionais
            </CardTitle>
            <CardDescription>
              Informações customizadas para {member.name}
            </CardDescription>
          </div>
          <Button className="gap-2">
            <Plus size={16} />
            Adicionar Campo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum campo adicional cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Campos adicionais permitem armazenar informações customizadas sobre o membro
          </p>
          <Button variant="outline" className="gap-2">
            <Plus size={16} />
            Criar Primeiro Campo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
