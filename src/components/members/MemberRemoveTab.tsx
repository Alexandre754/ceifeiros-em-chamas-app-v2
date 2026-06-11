"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
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

interface Member {
  id: number
  name: string
  status: string
}

interface Props {
  member: Member
}

export default function MemberRemoveTab({ member }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      
      if (!token) {
        toast.error("Você precisa estar autenticado")
        router.push('/login')
        return
      }

      const response = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Membro desativado com sucesso!")
        router.push('/dashboard/members')
      } else {
        const error = await response.json()
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Por favor, faça login novamente.")
          router.push('/login')
        } else if (response.status === 403) {
          toast.error("Você não tem permissão para excluir este membro")
        } else {
          toast.error(error.error || "Erro ao excluir membro")
        }
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error("Erro ao excluir membro")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={20} />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam o membro {member.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h3 className="font-semibold text-destructive mb-2">Desativar Membro</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ao desativar este membro, ele será marcado como inativo no sistema. 
              Esta ação pode ser revertida posteriormente através da edição do cadastro.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4 list-disc list-inside">
              <li>O membro não aparecerá nas listagens de membros ativos</li>
              <li>Todos os dados serão preservados</li>
              <li>As permissões serão mantidas</li>
              <li>Você poderá reativar este membro a qualquer momento</li>
            </ul>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={member.status === "inativo"}
            >
              <Trash2 size={16} />
              {member.status === "inativo" ? "Membro já está inativo" : "Desativar Membro"}
            </Button>
          </div>

          {member.status === "inativo" && (
            <div className="p-4 bg-muted border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Status atual:</strong> Este membro está inativo. 
                Para reativá-lo, vá até a aba <strong>Editar</strong> e altere o status para <strong>Ativo</strong>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a desativar o membro <strong>{member.name}</strong>. 
              <br /><br />
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Marcar o membro como inativo</li>
                <li>Remover da lista de membros ativos</li>
                <li>Preservar todos os dados e histórico</li>
              </ul>
              <br />
              Você pode reativar este membro a qualquer momento através da edição do cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desativar Membro
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
