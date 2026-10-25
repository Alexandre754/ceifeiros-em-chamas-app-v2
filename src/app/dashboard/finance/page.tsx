"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown, DollarSign, Download, Pencil, Trash2, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Transaction {
  id: number
  congregationId: number
  type: string
  category: string
  amount: number
  date: string
  description: string | null
  paymentMethod: string | null
  accountId: string | null
  titheGiverName: string | null
  status: string
  congregation: {
    id: number
    name: string
    city: string
    state: string
  }
}

export default function FinancePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar transações')
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error)
      toast.error(error.message || "Erro ao carregar transações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction)
    setEditDialogOpen(true)
  }

  const handleUpdateTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!transactionToEdit) return

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const formData = new FormData(e.currentTarget)
      
      const response = await fetch(`/api/transactions/${transactionToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formData.get('type'),
          category: formData.get('category'),
          amount: formData.get('amount'),
          date: formData.get('date'),
          description: formData.get('description'),
          paymentMethod: formData.get('paymentMethod'),
          accountId: formData.get('accountId'),
          titheGiverName: formData.get('titheGiverName'),
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar transação')
      }

      toast.success("Transação atualizada com sucesso!")
      setEditDialogOpen(false)
      fetchTransactions()
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error)
      toast.error(error.message || "Erro ao atualizar transação")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      
      const response = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir transação')
      }

      toast.success("Transação excluída com sucesso!")
      setDeleteDialogOpen(false)
      fetchTransactions()
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error)
      toast.error(error.message || "Erro ao excluir transação")
    } finally {
      setIsDeleting(false)
      setTransactionToDelete(null)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const params = new URLSearchParams()
      
      if (user?.congregationId) {
        params.append('congregationId', user.congregationId.toString())
      }
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/transactions/report?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      const data = await response.json()
      
      const csv = generateCSV(data.transactions)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success("Relatório baixado com sucesso!")
    } catch (error: any) {
      console.error('Erro ao baixar relatório:', error)
      toast.error(error.message || "Erro ao baixar relatório")
    }
  }

  const generateCSV = (data: Transaction[]) => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição', 'Dizimista', 'Congregação']
    const rows = data.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.category,
      `R$ ${Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      t.description || '',
      t.titheGiverName || '',
      t.congregation.name
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const totalIncome = transactions
    .filter(t => t.type === "entrada" && t.status === "ativo")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = Math.abs(transactions
    .filter(t => t.type === "saida" && t.status === "ativo")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0))

  const balance = totalIncome - totalExpenses

  const activeTransactions = transactions.filter(t => t.status === "ativo")
  const canModify = user?.role !== 'membro'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">
              Controle completo das finanças da igreja
            </p>
          </div>
          {canModify && (
            <Link href="/dashboard/finance/add">
              <Button size="lg" className="gap-2">
                <Plus size={20} />
                Nova Transação
              </Button>
            </Link>
          )}
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Este período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Este período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Diferença entre entradas e saídas</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
            <CardDescription>Filtre e baixe relatórios financeiros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleDownloadReport} className="gap-2">
                  <Download size={16} />
                  Baixar Relatório (CSV)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="income">Entradas</TabsTrigger>
            <TabsTrigger value="expenses">Saídas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Todas as movimentações financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                  </div>
                ) : activeTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma transação registrada</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Dizimista</TableHead>
                          <TableHead>Congregação</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          {canModify && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={transaction.type === "entrada" ? "default" : "destructive"}
                              >
                                {transaction.type === "entrada" ? "Entrada" : "Saída"}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{transaction.category}</TableCell>
                            <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                            <TableCell>{transaction.titheGiverName || '-'}</TableCell>
                            <TableCell>{transaction.congregation.name}</TableCell>
                            <TableCell className={`text-right font-semibold ${
                              transaction.type === "entrada" ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === "entrada" ? '+' : '-'}
                              R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            {canModify && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(transaction)}
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setTransactionToDelete(transaction.id)
                                      setDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            {/* Similar structure for income */}
          </TabsContent>

          <TabsContent value="expenses">
            {/* Similar structure for expenses */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na transação
            </DialogDescription>
          </DialogHeader>
          {transactionToEdit && (
            <form onSubmit={handleUpdateTransaction}>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Tipo *</Label>
                    <Select name="type" defaultValue={transactionToEdit.type} required>
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
                    <Label htmlFor="edit-category">Categoria *</Label>
                    <Input
                      id="edit-category"
                      name="category"
                      defaultValue={transactionToEdit.category}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Valor (R$) *</Label>
                    <Input
                      id="edit-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      defaultValue={Math.abs(transactionToEdit.amount)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Data *</Label>
                    <Input
                      id="edit-date"
                      name="date"
                      type="date"
                      defaultValue={transactionToEdit.date}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-titheGiverName">Nome do Dizimista</Label>
                    <Input
                      id="edit-titheGiverName"
                      name="titheGiverName"
                      defaultValue={transactionToEdit.titheGiverName || ''}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      defaultValue={transactionToEdit.description || ''}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}