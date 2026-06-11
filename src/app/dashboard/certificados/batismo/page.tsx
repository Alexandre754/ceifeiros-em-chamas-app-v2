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

export default function CertificadoBatismoPage() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    pastor: "Pr. Adão Teixeira de Sousa",
    diacona: "Diaconisa Edilaura Miranda Angelin"
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!formData.nome || !formData.data) {
      toast.error("Preencha o nome e a data do batismo")
      return
    }

    setIsGenerating(true)
    
    try {
      const element = certificateRef.current
      if (!element) {
        toast.error("Elemento do certificado não encontrado")
        setIsGenerating(false)
        return
      }

      // Aguardar imagens carregarem
      await new Promise(resolve => setTimeout(resolve, 800))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-certificate]') as HTMLElement
          if (clonedElement) {
            clonedElement.style.transform = 'scale(1)'
            clonedElement.style.width = '100%'
          }
        }
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      
      // Formato A4 horizontal (paisagem): 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(`Certificado_Batismo_${formData.nome.replace(/\s/g, '_')}.pdf`)
      
      toast.success("Certificado baixado com sucesso!")
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error("Erro ao gerar certificado. Tente novamente.")
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
          <h1 className="text-3xl font-bold mb-2">Certificado de Batismo</h1>
          <p className="text-muted-foreground">
            Preencha os dados e baixe o certificado em PDF (Formato A4 Horizontal: 29,7 x 21 cm)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados do Certificado
              </CardTitle>
              <CardDescription>
                Preencha as informações para gerar o certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data do Batismo *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor Presidente</Label>
                <Input
                  id="pastor"
                  value={formData.pastor}
                  onChange={(e) => setFormData(prev => ({ ...prev, pastor: e.target.value }))}
                  placeholder="Nome do pastor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diacona">Secretária</Label>
                <Input
                  id="diacona"
                  value={formData.diacona}
                  onChange={(e) => setFormData(prev => ({ ...prev, diacona: e.target.value }))}
                  placeholder="Nome da secretária"
                />
              </div>

              <Button 
                onClick={handleDownload} 
                className="w-full gap-2"
                size="lg"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Gerando PDF..." : "Baixar Certificado (PDF)"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                Visualize como ficará o certificado (A4 Horizontal - 29,7 x 21 cm)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-border rounded-lg overflow-hidden">
                <div 
                  ref={certificateRef}
                  data-certificate
                  className="w-full relative bg-white"
                  style={{ 
                    aspectRatio: '297/210',
                    minHeight: '500px'
                  }}
                >
                  {/* Background Image - Foto subaquática */}
                  <div className="absolute inset-0">
                    <Image
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/foto-1764690315202.jpg"
                      alt="Background"
                      fill
                      className="object-cover"
                      crossOrigin="anonymous"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/40" />
                  </div>
                  
                  {/* Borda decorativa dourada */}
                  <div className="absolute inset-6 border-[6px] border-amber-400 rounded-lg shadow-2xl" style={{ borderImage: 'linear-gradient(45deg, #d4af37, #ffd700, #d4af37) 1' }} />
                  <div className="absolute inset-7 border-2 border-amber-300/60 rounded-lg" />
                  
                  {/* Decorações de canto com folhas */}
                  <div className="absolute top-4 left-4 w-20 h-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-500 drop-shadow-lg opacity-90">
                      <path d="M5,50 Q10,30 30,25 Q40,22 45,30 Q48,35 45,40 Q42,45 35,45 Q25,45 20,50 Q15,55 15,60 Q15,70 25,75 L5,75 Z" />
                      <path d="M50,5 Q30,10 25,30 Q22,40 30,45 Q35,48 40,45 Q45,42 45,35 Q45,25 50,20 Q55,15 60,15 Q70,15 75,25 L75,5 Z" />
                    </svg>
                  </div>
                  <div className="absolute top-4 right-4 w-20 h-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-500 drop-shadow-lg opacity-90 scale-x-[-1]">
                      <path d="M5,50 Q10,30 30,25 Q40,22 45,30 Q48,35 45,40 Q42,45 35,45 Q25,45 20,50 Q15,55 15,60 Q15,70 25,75 L5,75 Z" />
                      <path d="M50,5 Q30,10 25,30 Q22,40 30,45 Q35,48 40,45 Q45,42 45,35 Q45,25 50,20 Q55,15 60,15 Q70,15 75,25 L75,5 Z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-4 left-4 w-20 h-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-500 drop-shadow-lg opacity-90 scale-y-[-1]">
                      <path d="M5,50 Q10,30 30,25 Q40,22 45,30 Q48,35 45,40 Q42,45 35,45 Q25,45 20,50 Q15,55 15,60 Q15,70 25,75 L5,75 Z" />
                      <path d="M50,5 Q30,10 25,30 Q22,40 30,45 Q35,48 40,45 Q45,42 45,35 Q45,25 50,20 Q55,15 60,15 Q70,15 75,25 L75,5 Z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-4 right-4 w-20 h-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-500 drop-shadow-lg opacity-90 scale-[-1]">
                      <path d="M5,50 Q10,30 30,25 Q40,22 45,30 Q48,35 45,40 Q42,45 35,45 Q25,45 20,50 Q15,55 15,60 Q15,70 25,75 L5,75 Z" />
                      <path d="M50,5 Q30,10 25,30 Q22,40 30,45 Q35,48 40,45 Q45,42 45,35 Q45,25 50,20 Q55,15 60,15 Q70,15 75,25 L75,5 Z" />
                    </svg>
                  </div>

                  {/* Conteúdo */}
                  <div className="relative h-full flex flex-col items-center justify-center text-center space-y-4 px-12 py-10">
                    {/* Logo IPCECMA no topo */}
                    <div className="mb-2">
                      <div className="relative w-24 h-24">
                        <Image
                          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IPCECMA__2_-removebg-preview-removebg-preview-min-1762377142669.png"
                          alt="Logo IPCECMA"
                          fill
                          className="object-contain drop-shadow-2xl"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>

                    {/* Ornamento superior */}
                    <div className="text-amber-500 text-4xl mb-2 drop-shadow-md" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>✦</div>
                    
                    <h1 className="text-4xl font-bold text-amber-600 tracking-wide drop-shadow-md" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(255,215,0,0.5)' }}>
                      CERTIFICADO DE
                    </h1>
                    <h2 className="text-6xl font-bold text-amber-700 tracking-wider drop-shadow-lg mb-3" style={{ fontFamily: 'Georgia, serif', textShadow: '3px 3px 6px rgba(0,0,0,0.4), 0 0 15px rgba(255,215,0,0.6)' }}>
                      BATISMO
                    </h2>
                    
                    <p className="text-lg text-amber-700 italic max-w-2xl leading-relaxed font-semibold drop-shadow" style={{ textShadow: '1px 1px 3px rgba(255,255,255,0.8)' }}>
                      A Igreja Pentecostal Ceifeiros Em Chamas Ministério Atibaia
                    </p>

                    <div className="my-5 w-full max-w-3xl">
                      <div className="text-3xl font-bold text-amber-800 bg-white/85 backdrop-blur-sm rounded-lg px-8 py-4 shadow-xl border-2 border-amber-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                        {formData.nome || "Vinicios Souza Carvalho"}
                      </div>
                    </div>

                    <p className="text-base text-blue-900 font-medium max-w-2xl leading-relaxed bg-white/75 backdrop-blur-sm px-8 py-4 rounded-lg shadow-lg" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
                      Batizou-se nas águas em nome do Pai, do Filho e do Espírito Santo,
                      nessa Igreja conforme mandamento do <span className="font-bold text-red-700">Senhor Jesus Cristo</span>, escrito no
                      evangelho de Mateus (28:19), no dia <span className="font-bold text-amber-800">{formData.data ? formatDate(formData.data) : "27 de julho de 2025"}</span>.
                    </p>

                    {/* Assinaturas */}
                    <div className="grid grid-cols-2 gap-10 w-full max-w-2xl mt-8">
                      <div className="text-center">
                        <div className="border-t-2 border-amber-700 pt-2 bg-white/70 backdrop-blur-sm px-4 py-3 rounded shadow-md">
                          <p className="text-base italic text-gray-800 font-medium">{formData.pastor}</p>
                          <p className="text-sm font-bold text-amber-700">presidente</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t-2 border-amber-700 pt-2 bg-white/70 backdrop-blur-sm px-4 py-3 rounded shadow-md">
                          <p className="text-base italic text-gray-800 font-medium">{formData.diacona}</p>
                          <p className="text-sm font-bold text-amber-700">secretária</p>
                        </div>
                      </div>
                    </div>
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