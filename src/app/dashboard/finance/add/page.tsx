"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface Congregation {
  id: number
  name: string
  city: string
  state: string
}

export default function AddFinancePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [formData, setFormData] = useState({
    congregationId: "",
    type: "entrada",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    paymentMethod: "",
    accountId: "",
    titheGiverName: ""
  })

  useEffect(() => {
    if (user) {
      fetchCongregations()
      if (user.congregationId && !formData.congregationId) {
        setFormData(prev => ({ ...prev, congregationId: user.congregationId!.toString() }))
      }
    }
  }, [user])

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
        console.error('Erro ao buscar congregações:', error)
      }
    }
  
    const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    
    if (!formData.congregationId || !formData.category || !formData.amount || !formData.date) {
      toast.error("Preencha todos os campos obrigatórios")
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

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          congregationId: parseInt(formData.congregationId),
          type: formData.type,
          category: formData.category.trim(),
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description.trim() || null,
          paymentMethod: formData.paymentMethod.trim() || null,
          accountId: formData.accountId.trim() || null,
          titheGiverName: formData.titheGiverName.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar transação')
      }

      toast.success("Transação registrada com sucesso!")
      router.push('/dashboard/finance')
    } catch (error: any) {
      console.error('Erro ao criar transação:', error)
      toast.error(error.message || "Erro ao registrar transação")
    } finally {
      setIsLoading(false)
    }
  }

  const canSelectCongregation = user?.role === 'admin_geral' || 
    (user?.role === 'admin_sede' && user?.congregation?.isHeadquarters) ||
    user?.hasGeneralAccess === true

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nova Transação</h1>
            <p className="text-muted-foreground">
              Registre entradas e saídas financeiras
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Transação</CardTitle>
            <CardDescription>Preencha as informações abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="congregationId">Congregação *</Label>
                  <Select
                    value={formData.congregationId}
                    onValueChange={(value) => setFormData({ ...formData, congregationId: value })}
                    disabled={!canSelectCongregation || isLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a congregação" />
                    </SelectTrigger>
                    <SelectContent>
                      {congregations.map((cong) => (
                        <SelectItem key={cong.id} value={cong.id.toString()}>
                          {cong.name} - {cong.city}/{cong.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === 'entrada' ? (
                        <>
                          <SelectItem value="dizimo">Dízimo</SelectItem>
                          <SelectItem value="oferta">Oferta</SelectItem>
                          <SelectItem value="doacao">Doação</SelectItem>
                          <SelectItem value="campanha">Campanha</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="agua">Água</SelectItem>
                          <SelectItem value="luz">Luz</SelectItem>
                          <SelectItem value="internet">Internet</SelectItem>
                          <SelectItem value="aluguel">Aluguel</SelectItem>
                          <SelectItem value="salario">Salário</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'entrada' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="titheGiverName">Nome do Dizimista/Ofertante</Label>
                    <Input
                      id="titheGiverName"
                      value={formData.titheGiverName}
                      onChange={(e) => setFormData({ ...formData, titheGiverName: e.target.value })}
                      placeholder="Nome da pessoa (opcional)"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Informações adicionais sobre a transação (opcional)"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/finance')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Transação'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}