"use client"

import { useState, useRef } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"

export default function CartaApresentacaoPage() {
  const letterRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    cidade: "Atibaia",
    estado: "SÃO PAULO",
    pastor: "Pr. Adão Teixeira de Sousa",
    secretaria: "Diaconisa Edilaura Miranda Angelin"
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!formData.nome || !formData.data) {
      toast.error("Preencha o nome e a data")
      return
    }

    setIsGenerating(true)

    try {
      const element = letterRef.current
      if (!element) return

      // Aguardar um pouco para garantir que as imagens carregaram
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-letter]') as HTMLElement
          if (clonedElement) {
            clonedElement.style.transform = 'scale(1)'
          }
        }
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(`Carta_Apresentacao_${formData.nome.replace(/\s/g, '_')}.pdf`)
      
      toast.success("Carta baixada com sucesso!")
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error("Erro ao gerar carta. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const [year, month, day] = dateStr.split('-')
    return `${day} de ${getMonthName(parseInt(month))} de ${year}`
  }

  const getMonthName = (month: number) => {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]
    return months[month - 1]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">Carta de Apresentação de Membros</h1>
          <p className="text-muted-foreground">
            Preencha os dados e baixe a carta em PDF
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados da Carta
              </CardTitle>
              <CardDescription>
                Preencha as informações para gerar a carta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo do Membro *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data da Carta *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor Presidente</Label>
                <Input
                  id="pastor"
                  value={formData.pastor}
                  onChange={(e) => setFormData(prev => ({ ...prev, pastor: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretaria">Secretária</Label>
                <Input
                  id="secretaria"
                  value={formData.secretaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretaria: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleDownload} 
                className="w-full gap-2"
                size="lg"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Gerando PDF..." : "Baixar Carta (PDF)"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                Visualize como ficará a carta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-border rounded-lg overflow-hidden">
                <div 
                  ref={letterRef}
                  data-letter
                  className="w-full bg-white"
                  style={{ minHeight: '842px', aspectRatio: '210/297' }}
                >
                  {/* Header moderno com gradiente e logo */}
                  <div className="relative">
                    {/* Gradiente superior */}
                    <div className="h-32 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 relative overflow-hidden">
                      {/* Padrão decorativo de fundo */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
                        <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
                        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white rounded-full translate-y-12"></div>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between px-8 h-full">
                        {/* Logo */}
                        <div className="relative w-20 h-20 bg-white rounded-full shadow-2xl p-2 border-4 border-amber-200">
                          <Image
                            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Igreja-Pentecostal-Ceifeiros-Em-Chamas-Ministerio-Atibaia-2-1764688722781.png"
                            alt="Logo IPCECMA"
                            fill
                            className="object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                        
                        {/* Título */}
                        <div className="flex-1 text-center px-4">
                          <h2 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                            IGREJA PENTECOSTAL<br />CEIFEIROS EM CHAMAS<br />MINISTÉRIO ATIBAIA
                          </h2>
                        </div>
                        
                        {/* Espaço para simetria */}
                        <div className="w-20"></div>
                      </div>
                    </div>
                    
                    {/* Onda decorativa */}
                    <svg className="w-full -mt-1" height="40" viewBox="0 0 1200 40" preserveAspectRatio="none">
                      <path 
                        d="M0,20 Q200,0 400,20 T800,20 T1200,20 L1200,40 L0,40 Z" 
                        fill="url(#waveGradient)" 
                      />
                      <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.4 }} />
                          <stop offset="50%" style={{ stopColor: '#eab308', stopOpacity: 0.4 }} />
                          <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.4 }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Conteúdo principal */}
                  <div className="px-12 py-6">
                    {/* Informações da igreja */}
                    <div className="text-center mb-6 text-xs text-gray-600 space-y-1 border-b-2 border-amber-200 pb-4">
                      <p className="font-semibold text-amber-700">Rua Avelino Antônio de Campos n°259 Caetetuba Atibaia SP</p>
                      <p>CEP: 12951-670 | CNPJ: nº 55.190.743/0001-63</p>
                    </div>

                    {/* Título da carta */}
                    <div className="relative mb-8">
                      <div className="text-center">
                        <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-3 rounded-lg shadow-lg">
                          <h1 className="text-xl font-bold tracking-wide">
                            CARTA DE APRESENTAÇÃO DE MEMBROS
                          </h1>
                        </div>
                      </div>
                      {/* Decoração lateral */}
                      <div className="absolute top-1/2 left-0 w-12 h-0.5 bg-gradient-to-r from-amber-400 to-transparent -translate-y-1/2"></div>
                      <div className="absolute top-1/2 right-0 w-12 h-0.5 bg-gradient-to-l from-amber-400 to-transparent -translate-y-1/2"></div>
                    </div>

                    {/* Corpo da carta */}
                    <div className="space-y-5 text-sm text-gray-800 leading-relaxed text-justify bg-gradient-to-b from-amber-50/30 to-transparent p-6 rounded-lg border-l-4 border-amber-400">
                      <p>
                        <span className="font-semibold text-amber-700">Prezados irmãos em Cristo,</span>
                      </p>

                      <p className="indent-8">
                        É com muita satisfação que a denominação{" "}
                        <span className="font-bold text-amber-800 bg-amber-100 px-1 rounded">
                          IGREJA PENTECOSTAL CEIFEIROS EM CHAMAS MINISTÉRIO ATIBAIA
                        </span>, 
                        da cidade de{" "}
                        <span className="font-semibold text-gray-900">{formData.cidade || "Atibaia"}</span>, 
                        do estado de{" "}
                        <span className="font-semibold text-gray-900">{formData.estado || "SÃO PAULO"}</span>, 
                        vem através desta informar-lhe da situação <span className="font-bold text-green-700">Ativa e Regular</span>, dentro dos princípios bíblicos e doutrinários da Igreja 
                        do Senhor Jesus Cristo, a irmã,{" "}
                        <span className="font-bold text-amber-800 text-base bg-amber-100 px-2 py-0.5 rounded border-b-2 border-amber-400">
                          {formData.nome || "Nome do Membro"}
                        </span>, 
                        podendo assim, atuar na obra de Cristo.
                      </p>

                      <p className="indent-8">
                        Desde já agradecemos.{" "}
                        <span className="font-semibold text-amber-700">Deus os abençoe.</span>
                      </p>

                      <p className="text-right mt-6 font-medium text-gray-700">
                        {formData.cidade || "Atibaia"} SP,{" "}
                        <span className="text-amber-700 font-semibold">
                          {formData.data ? formatDate(formData.data) : "___________________"}
                        </span>
                      </p>
                    </div>

                    {/* Logo central com frase */}
                    <div className="flex flex-col items-center my-8 space-y-2">
                      <div className="relative w-24 h-24 opacity-20 grayscale">
                        <Image
                          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Igreja-Pentecostal-Ceifeiros-Em-Chamas-Ministerio-Atibaia-2-1764688722781.png"
                          alt="Logo"
                          fill
                          className="object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <p className="text-xs italic text-amber-600 font-semibold">
                        Avivamento em chamas: Colhendo vidas para cristo
                      </p>
                    </div>

                    {/* Assinaturas */}
                    <div className="grid grid-cols-2 gap-12 mt-10">
                      <div className="text-center">
                        <div className="border-t-2 border-amber-600 pt-2 px-4">
                          <p className="text-sm italic text-gray-800 font-medium">{formData.pastor}</p>
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pastor Presidente</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t-2 border-amber-600 pt-2 px-4">
                          <p className="text-sm italic text-gray-800 font-medium">{formData.secretaria}</p>
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Secretária</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer com validade */}
                    <div className="mt-10 text-center">
                      <div className="inline-block bg-amber-100 border-2 border-amber-400 rounded-lg px-6 py-2">
                        <p className="text-xs font-semibold text-amber-800">
                          ⏰ Validade: 30 dias a partir da data citada acima
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer decorativo */}
                  <div className="mt-4">
                    <svg className="w-full" height="30" viewBox="0 0 1200 30" preserveAspectRatio="none">
                      <path 
                        d="M0,15 Q300,5 600,15 T1200,15 L1200,30 L0,30 Z" 
                        fill="url(#footerGradient)" 
                      />
                      <defs>
                        <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.3 }} />
                          <stop offset="50%" style={{ stopColor: '#eab308', stopOpacity: 0.3 }} />
                          <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.3 }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}