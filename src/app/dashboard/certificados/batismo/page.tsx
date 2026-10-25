"use client"

import { useState, useRef } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText, Upload, X } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import { toJpeg } from "html-to-image"

export default function CertificadoBatismoPage() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>("/certificado-bg.jpg")
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    pastor: "Adão Teixeira de Sousa",
    diacona: "Edilaura Miranda Angelin",
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem é muito grande. Máximo: 10MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string)
      toast.success("Imagem de fundo carregada!")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setBackgroundImage("/certificado-bg.jpg")
    toast.info("Imagem restaurada para o padrão.")
  }

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

      await new Promise((resolve) => setTimeout(resolve, 1200))

      const imgData = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        cacheBust: true,
      })

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")

      const safeName = formData.nome
        .trim()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, "_")

      pdf.save("Certificado_Batismo_" + safeName + ".pdf")

      toast.success("Certificado baixado com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast.error("Erro ao gerar certificado. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const [year, month, day] = dateStr.split("-")
    return `${day} de ${getMonthName(parseInt(month))} de ${year}`
  }

  const getMonthName = (month: number) => {
    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ]
    return months[month - 1]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificado de Batismo</h1>
          <p className="text-muted-foreground mt-1">
            Personalize os dados e visualize o certificado em formato A4 horizontal.
          </p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* FORMULÁRIO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados do Certificado
              </CardTitle>
              <CardDescription>
                Preencha as informações que aparecerão no certificado.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Imagem de Fundo</Label>
                <div className="border-2 border-dashed rounded-xl p-5 hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="bg-upload"
                  />
                  <label
                    htmlFor="bg-upload"
                    className="cursor-pointer flex flex-col items-center gap-2 text-center"
                  >
                    <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Clique para enviar a imagem</p>
                    <p className="text-xs text-muted-foreground">PNG ou JPG • máximo 10MB</p>
                  </label>
                </div>
                {backgroundImage !== "/certificado-bg.jpg" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Restaurar imagem padrão
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data do Batismo *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor Presidente</Label>
                <Input
                  id="pastor"
                  value={formData.pastor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pastor: e.target.value }))}
                  placeholder="Nome do pastor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diacona">Secretária</Label>
                <Input
                  id="diacona"
                  value={formData.diacona}
                  onChange={(e) => setFormData((prev) => ({ ...prev, diacona: e.target.value }))}
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

          {/* PREVIEW */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>A4 Horizontal — 29,7 × 21 cm</CardDescription>
            </CardHeader>

            <CardContent>
              <div
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #d6d6d6",
                  boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
                  background: "#fff",
                }}
              >
                <div
                  ref={certificateRef}
                  data-certificate
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "297 / 210",
                    minHeight: "500px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                  }}
                >
                  <img
                    src={backgroundImage}
                    alt="Fundo do certificado"
                    crossOrigin="anonymous"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.28))",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: "3.2%",
                      border: "1px solid rgba(212,175,55,0.80)",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: "4.1%",
                      border: "1px solid rgba(255,255,255,0.32)",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      padding: "6.5% 8% 5%",
                      color: "#fff",
                    }}
                  >
                    <div
                      style={{
                        width: "70px",
                        height: "2px",
                        background: "#D4AF37",
                        marginBottom: "9px",
                        opacity: 0.9,
                      }}
                    />

                    <h1
                      style={{
                        margin: 0,
                        color: "#F0D477",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: "clamp(1rem, 2vw, 1.65rem)",
                        fontWeight: 500,
                        letterSpacing: "0.28em",
                        lineHeight: 1.2,
                        textShadow: "0 2px 5px rgba(0,0,0,0.45)",
                      }}
                    >
                      CERTIFICADO DE
                    </h1>

                    <h2
                      style={{
                        margin: "3px 0 3px",
                        color: "#D4AF37",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: "clamp(2rem, 4.2vw, 3.5rem)",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        lineHeight: 1,
                        textShadow: "0 2px 7px rgba(0,0,0,0.5)",
                      }}
                    >
                      BATISMO
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "min(280px, 60%)",
                        margin: "7px 0 8px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: "1px",
                          background: "rgba(212,175,55,0.75)",
                        }}
                      />
                      <span style={{ color: "#D4AF37", fontSize: "10px" }}>◆</span>
                      <div
                        style={{
                          flex: 1,
                          height: "1px",
                          background: "rgba(212,175,55,0.75)",
                        }}
                      />
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: "#F8E8B0",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: "clamp(0.65rem, 1.2vw, 0.95rem)",
                        fontStyle: "italic",
                        lineHeight: 1.4,
                        textShadow: "0 2px 4px rgba(0,0,0,0.55)",
                      }}
                    >
                      A Igreja Pentecostal Ceifeiros Em Chamas
                    </p>

                    <p
                      style={{
                        margin: "2px 0 0",
                        color: "#F8E8B0",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: "clamp(0.58rem, 1vw, 0.78rem)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        textShadow: "0 2px 4px rgba(0,0,0,0.55)",
                      }}
                    >
                      Ministério Atibaia
                    </p>

                    {/* NOME DO BATIZADO (FONTE MENOR + NOWRAP) */}
                    <div
                      style={{
                        width: "100%",
                        margin: "clamp(10px, 2vw, 18px) 0 8px",
                        padding: "0 2%",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: "#FFF4C7",
                          fontFamily: "var(--font-great-vibes), 'Great Vibes', cursive",
                          fontSize: "clamp(1.4rem, 3.2vw, 2.6rem)", // ✅ MENOR
                          lineHeight: 1.15,
                          fontWeight: 400,
                          textShadow: "0 2px 6px rgba(0,0,0,0.65)",
                          whiteSpace: "nowrap", // ✅ NÃO QUEBRA LINHA
                          overflowWrap: "break-word",
                        }}
                      >
                        {formData.nome || "Vinicios Souza Carvalho"}
                      </p>

                      <div
                        style={{
                          width: "min(420px, 70%)",
                          height: "1px",
                          background:
                            "linear-gradient(to right, transparent, #D4AF37, transparent)",
                          margin: "5px auto 0",
                        }}
                      />
                    </div>

                    <p
                      style={{
                        width: "min(650px, 90%)",
                        margin: "5px auto 0",
                        color: "#FFFFFF",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: "clamp(0.62rem, 1.2vw, 0.90rem)",
                        fontWeight: 400,
                        lineHeight: 1.55,
                        textShadow: "0 2px 4px rgba(0,0,0,0.7)",
                      }}
                    >
                      Batizou-se nas águas em nome do Pai, do Filho e do Espírito Santo, nessa Igreja conforme mandamento do{" "}
                      <span style={{ color: "#F0D477", fontWeight: 700 }}>
                        Senhor Jesus Cristo
                      </span>
                      , escrito no evangelho de Mateus (28:19), no dia{" "}
                      <span style={{ color: "#F0D477", fontWeight: 700 }}>
                        {formData.data ? formatDate(formData.data) : "27 de julho de 2025"}
                      </span>
                      .
                    </p>

                    <div
                      style={{
                        width: "100%",
                        maxWidth: "760px",
                        marginTop: "auto",
                        display: "grid",
                        gridTemplateColumns: "1fr 80px 1fr",
                        alignItems: "end",
                        columnGap: "clamp(10px, 3vw, 35px)",
                      }}
                    >
                      {/* PASTOR (FONTE MENOR + NOWRAP) */}
                      <div style={{ textAlign: "center", minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 5px",
                            color: "#FFFFFF",
                            fontFamily: "var(--font-great-vibes), 'Great Vibes', cursive",
                            fontSize: "clamp(0.7rem, 1.4vw, 1.1rem)", // ✅ MENOR
                            lineHeight: 1.2,
                            whiteSpace: "nowrap", // ✅ NÃO QUEBRA LINHA
                            overflowWrap: "break-word",
                            textShadow: "0 2px 4px rgba(0,0,0,0.7)",
                          }}
                        >
                          {formData.pastor}
                        </p>
                        <div style={{ borderTop: "1px solid #D4AF37", paddingTop: "5px" }}>
                          <p
                            style={{
                              margin: 0,
                              color: "#F0D477",
                              fontFamily: "Georgia, serif",
                              fontSize: "clamp(0.55rem, 1vw, 0.72rem)",
                              fontWeight: 700,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Presidente
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src="/logo-ipcecma.png"
                          alt="Logo da igreja"
                          crossOrigin="anonymous"
                          style={{
                            width: "68px",
                            height: "68px",
                            objectFit: "contain",
                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                          }}
                        />
                      </div>

                      {/* SECRETÁRIA (FONTE MENOR + NOWRAP) */}
                      <div style={{ textAlign: "center", minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 5px",
                            color: "#FFFFFF",
                            fontFamily: "var(--font-great-vibes), 'Great Vibes', cursive",
                            fontSize: "clamp(0.7rem, 1.4vw, 1.1rem)", // ✅ MENOR
                            lineHeight: 1.2,
                            whiteSpace: "nowrap", // ✅ NÃO QUEBRA LINHA
                            overflowWrap: "break-word",
                            textShadow: "0 2px 4px rgba(0,0,0,0.7)",
                          }}
                        >
                          {formData.diacona}
                        </p>
                        <div style={{ borderTop: "1px solid #D4AF37", paddingTop: "5px" }}>
                          <p
                            style={{
                              margin: 0,
                              color: "#F0D477",
                              fontFamily: "Georgia, serif",
                              fontSize: "clamp(0.55rem, 1vw, 0.72rem)",
                              fontWeight: 700,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Secretária
                          </p>
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