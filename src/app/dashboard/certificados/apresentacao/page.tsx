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
import { toJpeg } from "html-to-image"

export default function CartaApresentacaoPage() {
  const letterRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    cidade: "Atibaia",
    estado: "SÃO PAULO",
    pastor: "Adão Teixeira de Sousa",
    secretaria: "Edilaura Miranda Angelin"
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
      if (!element) {
        toast.error("Elemento da carta não encontrado")
        setIsGenerating(false)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 1500))

      const imgData = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')

      const safeName = formData.nome
        .trim()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, "_")

      pdf.save(`Carta_Apresentacao_${safeName}.pdf`)

      toast.success("Carta baixada com sucesso!")
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error)
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
            Preencha os dados e baixe a carta em PDF (A4 Vertical)
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
                Visualize como ficará a carta (A4 Vertical)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <div
                  ref={letterRef}
                  data-letter
                  style={{
                    width: '100%',
                    aspectRatio: '210/297',
                    backgroundColor: '#ffffff',
                    position: 'relative',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {/* Borda dourada externa */}
                  <div style={{
                    position: 'absolute',
                    inset: '8mm',
                    border: '1.5px solid #D4AF37',
                    pointerEvents: 'none',
                  }} />

                  {/* Borda dourada interna */}
                  <div style={{
                    position: 'absolute',
                    inset: '10mm',
                    border: '0.5px solid #D4AF37',
                    pointerEvents: 'none',
                  }} />

                  {/* Conteúdo */}
                  <div style={{
                    position: 'relative',
                    padding: '14mm 16mm 18mm',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>

                    {/* CABEÇALHO */}
                    <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
                      <img
                        src="/logo-ipcecma.png"
                        alt="Logo IPCECMA"
                        crossOrigin="anonymous"
                        style={{
                          width: '16mm',
                          height: '16mm',
                          objectFit: 'contain',
                          margin: '0 auto 2mm',
                          display: 'block',
                        }}
                      />
                      <h1 style={{
                        fontSize: '10pt',
                        fontWeight: 'bold',
                        color: '#B45309',
                        letterSpacing: '0.05em',
                        lineHeight: 1.25,
                        margin: '0 0 1.5mm',
                      }}>
                        IGREJA PENTECOSTAL<br />
                        CEIFEIROS EM CHAMAS<br />
                        MINISTÉRIO ATIBAIA
                      </h1>
                      <div style={{
                        width: '30mm',
                        height: '1px',
                        backgroundColor: '#D4AF37',
                        margin: '1.5mm auto',
                      }} />
                      <p style={{
                        fontSize: '6.5pt',
                        color: '#6B7280',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: 1.3,
                        margin: '0',
                      }}>
                        Rua Tameyuki Nakasu, n° 183 — Jardim Cerejeiras — Atibaia/SP<br />
                        CEP: 12951590 &nbsp;•&nbsp; CNPJ: 55.190.743/0001-63
                      </p>
                    </div>

                    {/* TÍTULO */}
                    <div style={{ textAlign: 'center', margin: '3mm 0 4mm' }}>
                      <h2 style={{
                        fontSize: '11pt',
                        fontWeight: 'bold',
                        color: '#B45309',
                        letterSpacing: '0.1em',
                        margin: '0',
                        paddingBottom: '1.5mm',
                        borderBottom: '1.5px solid #D4AF37',
                        display: 'inline-block',
                      }}>
                        CARTA DE APRESENTAÇÃO
                      </h2>
                    </div>

                    {/* CORPO DA CARTA */}
                    <div style={{
                      fontSize: '9pt',
                      color: '#1F2937',
                      lineHeight: 1.55,
                      textAlign: 'justify',
                    }}>
                      <p style={{ margin: '0 0 2.5mm', fontWeight: 'bold', color: '#B45309' }}>
                        Prezados irmãos em Cristo,
                      </p>

                      <p style={{ textIndent: '8mm', margin: '0 0 2.5mm' }}>
                        É com muita satisfação que a denominação{" "}
                        <strong style={{ color: '#92400E' }}>
                          IGREJA PENTECOSTAL CEIFEIROS EM CHAMAS MINISTÉRIO ATIBAIA
                        </strong>, da cidade de{" "}
                        <strong>{formData.cidade || "Atibaia"}</strong>, do estado de{" "}
                        <strong>{formData.estado || "SÃO PAULO"}</strong>, vem através desta informar-lhe da situação{" "}
                        <strong style={{ color: '#15803D' }}>Ativa e Regular</strong>, dentro dos princípios bíblicos e doutrinários da Igreja do Senhor Jesus Cristo, o(a) irmão(ã),{" "}
                        <strong style={{
                          color: '#92400E',
                          fontSize: '10pt',
                          borderBottom: '1px solid #D4AF37',
                          paddingBottom: '1px',
                        }}>
                          {formData.nome || "Nome do Membro"}
                        </strong>, podendo assim, atuar na obra de Cristo.
                      </p>

                      <p style={{ textIndent: '8mm', margin: '0 0 2.5mm' }}>
                        Desde já agradecemos. <strong style={{ color: '#B45309' }}>Deus os abençoe.</strong>
                      </p>
                    </div>

                    {/* DATA */}
                    <p style={{
                      textAlign: 'right',
                      marginTop: '5mm',
                      marginBottom: '8mm',
                      fontStyle: 'italic',
                      color: '#374151',
                      fontSize: '9pt',
                    }}>
                      {formData.cidade || "Atibaia"}/SP,{" "}
                      <strong style={{ color: '#B45309' }}>
                        {formData.data ? formatDate(formData.data) : "___ de ___________ de ____"}
                      </strong>
                    </p>

                    {/* ASSINATURAS */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10mm',
                      marginBottom: '4mm',
                    }}>
                      {/* PASTOR */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{
                          fontSize: '10pt',
                          color: '#1F2937',
                          margin: '0 0 1mm',
                          fontFamily: 'var(--font-great-vibes), "Great Vibes", cursive',
                        }}>
                          {formData.pastor}
                        </p>
                        <div style={{
                          borderTop: '1px solid #B45309',
                          marginBottom: '1.5mm',
                        }} />
                        <p style={{
                          fontSize: '8pt',
                          color: '#B45309',
                          margin: 0,
                          fontFamily: 'var(--font-great-vibes), "Great Vibes", cursive',
                        }}>
                          Pastor Presidente
                        </p>
                      </div>

                      {/* SECRETÁRIA */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{
                          fontSize: '10pt',
                          color: '#1F2937',
                          margin: '0 0 1mm',
                          fontFamily: 'var(--font-great-vibes), "Great Vibes", cursive',
                        }}>
                          {formData.secretaria}
                        </p>
                        <div style={{
                          borderTop: '1px solid #B45309',
                          marginBottom: '1.5mm',
                        }} />
                        <p style={{
                          fontSize: '8pt',
                          color: '#B45309',
                          margin: 0,
                          fontFamily: 'var(--font-great-vibes), "Great Vibes", cursive',
                        }}>
                          Secretária
                        </p>
                      </div>
                    </div>

                    {/* VALIDADE */}
                    <div style={{
                      textAlign: 'center',
                      marginTop: '3mm',
                      paddingTop: '2mm',
                      borderTop: '0.5px solid #E5E7EB',
                    }}>
                      <p style={{
                        fontSize: '7pt',
                        color: '#6B7280',
                        fontStyle: 'italic',
                        margin: 0,
                        fontFamily: 'Arial, sans-serif',
                      }}>
                        Válido por 30 dias a partir da data citada acima.
                      </p>
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