"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, User, Mail, Phone, MapPin } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalRequest {
  id: number
  userId: number
  status: string
  requestedAt: string
  approvedBy: number | null
  approvedAt: string | null
  rejectionReason: string | null
  user: {
    id: number
    name: string
    email: string
    role: string
    congregationId: number | null
    congregation: {
      id: number
      name: string
      city: string
      state: string
    } | null
  }
}

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    if (user?.role === 'admin_geral' || (user?.role === 'admin_sede' && user?.congregation?.isHeadquarters)) {
      fetchApprovals()
    }
  }, [user])

  const fetchApprovals = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch('/api/users/approvals?status=pendente', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar solicitações')
      }

      const data = await response.json()
      setRequests(data)
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error)
      toast.error(error.message || "Erro ao carregar solicitações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (approvalId: number) => {
    setIsProcessing(true)
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch(`/api/users/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao aprovar usuário')
      }

      toast.success("Usuário aprovado com sucesso!")
      fetchApprovals()
    } catch (error: any) {
      console.error('Erro ao aprovar usuário:', error)
      toast.error(error.message || "Erro ao aprovar usuário")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    
    if (!rejectionReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição")
      return
    }

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch(`/api/users/approvals/${selectedRequest}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao rejeitar usuário')
      }

      toast.success("Usuário rejeitado com sucesso!")
      setRejectDialogOpen(false)
      setSelectedRequest(null)
      setRejectionReason("")
      fetchApprovals()
    } catch (error: any) {
      console.error('Erro ao rejeitar usuário:', error)
      toast.error(error.message || "Erro ao rejeitar usuário")
    } finally {
      setIsProcessing(false)
    }
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      'admin_geral': 'Admin Geral',
      'admin_sede': 'Admin Sede',
      'admin_congregacao': 'Admin Congregação',
      'membro': 'Membro'
    }
    return roles[role] || role
  }

  if (!user || (user.role !== 'admin_geral' && !(user.role === 'admin_sede' && user.congregation?.isHeadquarters))) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="font-semibold text-lg mb-2">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Apenas administradores gerais e administradores da sede podem acessar esta página.
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
            <h1 className="text-3xl font-bold">Aprovação de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie solicitações de cadastro de novos usuários
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovados Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nas últimas 24h</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nas últimas 24h</p>
            </CardContent>
          </Card>
        </div>

        {/* Approval Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
            <CardDescription>
              Revise e aprove ou rejeite novos cadastros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todas as solicitações foram processadas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User size={18} />
                            {request.user.name}
                          </h3>
                          <Badge variant="outline" className="mt-1">
                            {getRoleName(request.user.role)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {request.user.email}
                        </div>
                        {request.user.congregation && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            {request.user.congregation.name} - {request.user.congregation.city}/{request.user.congregation.state}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Solicitado em: {new Date(request.requestedAt).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 justify-end">
                      <Button
                        size="sm"
                        className="flex-1 md:flex-initial gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 md:flex-initial gap-1"
                        onClick={() => {
                          setSelectedRequest(request.id)
                          setRejectDialogOpen(true)
                        }}
                        disabled={isProcessing}
                      >
                        <XCircle size={14} />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo da rejeição desta solicitação de cadastro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Ex: Dados incompletos, usuário não faz parte da congregação, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setSelectedRequest(null)
                setRejectionReason("")
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                'Rejeitar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
