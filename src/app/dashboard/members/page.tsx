"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Filter, Edit, Trash2, FileDown, Loader2, Eye } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function MembersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [members, setMembers] = useState<any[]>([])
  const [congregations, setCongregations] = useState<any[]>([])
  const [selectedCongregation, setSelectedCongregation] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    byCongregation: {} as Record<string, number>
  })

  useEffect(() => {
    fetchCongregations()
    fetchMembers()
  }, [selectedCongregation, searchTerm])

  const fetchCongregations = async () => {
    try {
      const response = await fetch('/api/congregations')
      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
      }
    } catch (error) {
      console.error('Erro ao buscar congregações:', error)
    }
  }

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      let url = '/api/members?limit=100'
      if (selectedCongregation !== "all") {
        url += `&congregationId=${selectedCongregation}`
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
        
        const total = data.total || 0
        const byCongregation: Record<string, number> = {}
        
        data.members.forEach((member: any) => {
          const congName = member.congregationName || "Sem congregação"
          byCongregation[congName] = (byCongregation[congName] || 0) + 1
        })
        
        setStats({ total, byCongregation })
      } else {
        toast.error("Erro ao carregar membros")
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (member: any) => {
    setMemberToDelete(member)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch(`/api/members/${memberToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success("Membro desativado com sucesso!")
        setDeleteDialogOpen(false)
        setMemberToDelete(null)
        fetchMembers()
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
    }
  }

  const exportMemberToPDF = (member: any) => {
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("FICHA DE MEMBRO", 105, 20, { align: "center" })
    
    doc.setFontSize(14)
    doc.text("IPCECMA - Igreja Pentecostal Ceifeiros Em Chamas", 105, 28, { align: "center" })
    
    doc.setFontSize(10)
    doc.text("Ministério Atibaia", 105, 34, { align: "center" })
    
    // Linha separadora
    doc.setLineWidth(0.5)
    doc.line(20, 38, 190, 38)
    
    // Dados do membro
    let y = 48
    
    // Informações Pessoais
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMAÇÕES PESSOAIS", 20, y)
    y += 8
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    
    const personalInfo = [
      ["Nome Completo:", member.name || ""],
      ["CPF:", member.cpf || "Não informado"],
      ["RG:", member.rg || "Não informado"],
      ["Data de Nascimento:", member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : ""],
      ["Idade:", member.age ? `${member.age} anos` : ""],
      ["Sexo:", member.sex === "masculino" ? "Masculino" : "Feminino"],
      ["Estado Civil:", member.maritalStatus || "Não informado"],
    ]
    
    personalInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 20, y)
      doc.setFont("helvetica", "normal")
      doc.text(value, 65, y)
      y += 6
    })
    
    y += 4
    
    // Informações de Contato
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("INFORMAÇÕES DE CONTATO", 20, y)
    y += 8
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    
    const contactInfo = [
      ["E-mail:", member.email || "Não informado"],
      ["Telefone:", member.phone || ""],
      ["Endereço:", member.address || "Não informado"],
      ["CEP:", member.cep || ""],
      ["Bairro:", member.neighborhood || ""],
      ["Cidade/Estado:", `${member.city || ""} - ${member.state || ""}`],
    ]
    
    contactInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 20, y)
      doc.setFont("helvetica", "normal")
      doc.text(value, 65, y)
      y += 6
    })
    
    y += 4
    
    // Informações Eclesiásticas
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("INFORMAÇÕES ECLESIÁSTICAS", 20, y)
    y += 8
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    
    const churchInfo = [
      ["Congregação:", member.congregationName || ""],
      ["Cargo:", member.position || ""],
      ["Data de Batismo:", member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : "Não informado"],
      ["Membro Desde:", member.memberSince ? new Date(member.memberSince).toLocaleDateString('pt-BR') : "Não informado"],
      ["Status:", member.status || "Ativo"],
    ]
    
    churchInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 20, y)
      doc.setFont("helvetica", "normal")
      doc.text(value, 65, y)
      y += 6
    })
    
    // Rodapé
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 285, { align: "center" })
    
    // Salvar PDF
    doc.save(`ficha-membro-${member.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    toast.success("PDF gerado com sucesso!")
  }

  const exportAllToPDF = () => {
    if (members.length === 0) {
      toast.error("Nenhum membro para exportar")
      return
    }

    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("LISTA DE MEMBROS", 105, 15, { align: "center" })
    
    doc.setFontSize(12)
    doc.text("IPCECMA - Igreja Pentecostal Ceifeiros Em Chamas", 105, 22, { align: "center" })
    
    // Preparar dados para tabela
    const tableData = members.map(m => [
      m.name,
      m.cpf || "-",
      m.age ? `${m.age}` : "-",
      m.congregationName || "-",
      m.position || "-",
      m.phone || "-"
    ])
    
    // Gerar tabela
    autoTable(doc, {
      head: [['Nome', 'CPF', 'Idade', 'Congregação', 'Cargo', 'Telefone']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 119, 6] }
    })
    
    doc.save(`lista-membros-${new Date().toLocaleDateString('pt-BR')}.pdf`)
    toast.success("PDF gerado com sucesso!")
  }

  const canViewAllCongregations = () => {
    if (!user) return false
    return user.role === 'admin_geral' || 
           (user.role === 'admin_sede' && user.congregation?.isHeadquarters === true)
  }

  const canEditMember = () => {
    return true
  }

  const canDeleteMember = () => {
    return true
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Membros</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie todos os membros da igreja
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportAllToPDF} className="gap-2">
              <FileDown size={18} />
              Exportar Lista
            </Button>
            <Link href="/dashboard/members/add">
              <Button size="lg" className="gap-2">
                <Plus size={20} />
                Novo Membro
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          {Object.entries(stats.byCongregation).map(([cong, count]) => (
            <Card key={cong}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{cong}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Membros</CardTitle>
            <CardDescription>
              {user && !canViewAllCongregations() && user.congregation
                ? `Visualizando membros da congregação: ${user.congregation.name}`
                : "Pesquise e filtre membros cadastrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {canViewAllCongregations() && (
                <Select value={selectedCongregation} onValueChange={setSelectedCongregation}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Todas congregações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas congregações</SelectItem>
                    {congregations.map((cong) => (
                      <SelectItem key={cong.id} value={cong.id.toString()}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Congregação</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum membro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <Link 
                              href={`/dashboard/members/${member.id}`}
                              className="hover:text-amber-600 hover:underline transition-colors"
                            >
                              {member.name}
                            </Link>
                          </TableCell>
                          <TableCell>{member.cpf || "-"}</TableCell>
                          <TableCell>{member.age ? `${member.age} anos` : "-"}</TableCell>
                          <TableCell>{member.congregationName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={member.position === "pastor" ? "default" : "secondary"}>
                              {member.position}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                member.status === "ativo" 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Visualizar"
                                onClick={() => router.push(`/dashboard/members/${member.id}`)}
                              >
                                <Eye size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Exportar PDF"
                                onClick={() => exportMemberToPDF(member)}
                              >
                                <FileDown size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Editar"
                                onClick={() => router.push(`/dashboard/members/${member.id}/edit`)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Excluir"
                                onClick={() => handleDeleteClick(member)}
                              >
                                <Trash2 size={16} className="text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a desativar o membro <strong>{memberToDelete?.name}</strong>. 
              Esta ação pode ser revertida editando o membro e alterando o status para "Ativo".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar Membro"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}