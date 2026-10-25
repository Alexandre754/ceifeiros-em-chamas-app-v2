"use client"

import { useRef, useState } from "react"
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
import { uploadFile } from "@/lib/supabase"

const CERT_WIDTH = 1122
const CERT_HEIGHT = 794

const GOLD = "#B58A3B"
const DARK_GOLD = "#805D25"
const INK = "#292821"

export default function CertificadoConsagracaoPage() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [backgroundImage, setBackgroundImage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    filhoDe: "",
    filhaDe: "",
    dataConsagracao: "",
    pastor: "Adão Teixeira de Sousa",
    secretaria: "Edilaura Miranda Angelin",
  })

  const updateField = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    const [year, month, day] = dateString.split("-").map(Number)

    if (!year || !month || !day) return ""

    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.")
      event.target.value = ""
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10 MB.")
      event.target.value = ""
      return
    }

    setIsUploading(true)

    try {
      const { url } = await uploadFile(file, "certificados")
      setBackgroundImage(url)
      toast.success("Imagem de fundo carregada!")
    } catch (error) {
      console.error("Erro no envio da imagem:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a imagem."
      )
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleDownload = async () => {
    if (!formData.nome.trim()) {
      toast.error("Informe o nome completo do obreiro.")
      return
    }

    if (!formData.dataConsagracao) {
      toast.error("Informe a data da consagração.")
      return
    }

    const element = certificateRef.current

    if (!element) {
      toast.error("Não foi possível localizar o certificado.")
      return
    }

    setIsGenerating(true)

    try {
      // Aguarda as fontes e imagens utilizadas no certificado.
      if ("fonts" in document) {
        await document.fonts.ready
      }

      const images = Array.from(element.querySelectorAll("img"))

      await Promise.all(
        images.map(async (image) => {
          if (!image.complete) {
            await new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), {
                once: true,
              })
              image.addEventListener("error", () => resolve(), {
                once: true,
              })
            })
          }

          if (image.complete && image.naturalWidth > 0) {
            try {
              await image.decode()
            } catch {
              // Algumas imagens já estão decodificadas pelo navegador.
            }
          }
        })
      )

      const imageData = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2,
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
        backgroundColor: "#FFFFFF",
        cacheBust: true,
        style: {
          width: `${CERT_WIDTH}px`,
          height: `${CERT_HEIGHT}px`,
          minWidth: `${CERT_WIDTH}px`,
          maxWidth: `${CERT_WIDTH}px`,
          transform: "none",
          margin: "0",
        },
      })

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Mantém a proporção 297:210, sem deformar o certificado.
      const imageRatio = CERT_WIDTH / CERT_HEIGHT
      const pageRatio = pageWidth / pageHeight

      let renderWidth = pageWidth
      let renderHeight = pageHeight
      let offsetX = 0
      let offsetY = 0

      if (imageRatio > pageRatio) {
        renderHeight = pageWidth / imageRatio
        offsetY = (pageHeight - renderHeight) / 2
      } else {
        renderWidth = pageHeight * imageRatio
        offsetX = (pageWidth - renderWidth) / 2
      }

      pdf.addImage(
        imageData,
        "JPEG",
        offsetX,
        offsetY,
        renderWidth,
        renderHeight,
        undefined,
        "FAST"
      )

      const safeName =
        formData.nome
          .trim()
          .normalize("NFC")
          .replace(/[^\p{L}\p{N}\s-]/gu, "")
          .replace(/\s+/g, "_") || "Obreiro"

      pdf.save(`Certificado_Consagracao_${safeName}.pdf`)

      toast.success("Certificado gerado com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar o certificado:", error)
      toast.error(
        "Não foi possível gerar o PDF. Confira as imagens e tente novamente."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const hasParentData =
    formData.dataNascimento &&
    formData.filhoDe.trim() &&
    formData.filhaDe.trim()

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Certificado de Consagração
              </h1>
              <p className="text-sm text-muted-foreground">
                Consagração de Obreiro · Documento A4 horizontal
              </p>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Dados do certificado</CardTitle>
              <CardDescription>
                Preencha as informações que serão impressas no documento.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bg-upload">Imagem de fundo (opcional)</Label>

                <div className="rounded-xl border border-dashed p-4">
                  <input
                    ref={fileInputRef}
                    id="bg-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex w-full flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors hover:bg-muted/60 disabled:opacity-50"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {isUploading
                        ? "Enviando imagem..."
                        : "Selecionar imagem"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG ou WebP · Máximo de 10 MB
                    </span>
                  </button>
                </div>

                {backgroundImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setBackgroundImage("")
                      toast.info("Imagem de fundo removida.")
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remover imagem
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo do obreiro *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(event) =>
                    updateField("nome", event.target.value)
                  }
                  placeholder="Digite o nome completo"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascimento">
                  Data de nascimento
                </Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(event) =>
                    updateField("dataNascimento", event.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="filhoDe">Nome do pai</Label>
                  <Input
                    id="filhoDe"
                    value={formData.filhoDe}
                    onChange={(event) =>
                      updateField("filhoDe", event.target.value)
                    }
                    placeholder="Nome do pai"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filhaDe">Nome da mãe</Label>
                  <Input
                    id="filhaDe"
                    value={formData.filhaDe}
                    onChange={(event) =>
                      updateField("filhaDe", event.target.value)
                    }
                    placeholder="Nome da mãe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataConsagracao">
                  Data da consagração *
                </Label>
                <Input
                  id="dataConsagracao"
                  type="date"
                  value={formData.dataConsagracao}
                  onChange={(event) =>
                    updateField("dataConsagracao", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor presidente</Label>
                <Input
                  id="pastor"
                  value={formData.pastor}
                  onChange={(event) =>
                    updateField("pastor", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretaria">Secretária</Label>
                <Input
                  id="secretaria"
                  value={formData.secretaria}
                  onChange={(event) =>
                    updateField("secretaria", event.target.value)
                  }
                />
              </div>

              <Button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || isUploading}
                className="h-11 w-full gap-2"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Gerando PDF..." : "Baixar certificado PDF"}
              </Button>

              <p className="text-xs leading-relaxed text-muted-foreground">
                O documento será gerado em A4 horizontal. Confira os nomes e
                as datas antes de baixar.
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                Documento em proporção A4. Em telas menores, deslize
                horizontalmente para visualizar os detalhes.
              </CardDescription>
            </CardHeader>

            <CardContent className="min-w-0">
              <div className="overflow-x-auto rounded-lg border bg-muted/30 p-2 sm:p-4">
                <div
                  ref={certificateRef}
                  data-certificate
                  style={{
                    width: `${CERT_WIDTH}px`,
                    height: `${CERT_HEIGHT}px`,
                    minWidth: `${CERT_WIDTH}px`,
                    position: "relative",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    backgroundColor: "#FFFFFF",
                    backgroundImage: backgroundImage
                      ? `url("${backgroundImage}")`
                      : "linear-gradient(135deg, #fffdf7 0%, #ffffff 48%, #fbf5e8 100%)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: INK,
                    flexShrink: 0,
                  }}
                >
                  {/* Moldura externa */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "24px",
                      border: `3px double ${DARK_GOLD}`,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Moldura interna */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "34px",
                      border: `1px solid ${GOLD}`,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Cantos decorativos */}
                  {[
                    { top: 29, left: 29, borderTop: true, borderLeft: true },
                    { top: 29, right: 29, borderTop: true, borderRight: true },
                    { bottom: 29, left: 29, borderBottom: true, borderLeft: true },
                    { bottom: 29, right: 29, borderBottom: true, borderRight: true },
                  ].map((corner, index) => (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        top: corner.top,
                        bottom: corner.bottom,
                        left: corner.left,
                        right: corner.right,
                        width: 27,
                        height: 27,
                        borderTop: corner.borderTop
                          ? `2px solid ${GOLD}`
                          : "none",
                        borderBottom: corner.borderBottom
                          ? `2px solid ${GOLD}`
                          : "none",
                        borderLeft: corner.borderLeft
                          ? `2px solid ${GOLD}`
                          : "none",
                        borderRight: corner.borderRight
                          ? `2px solid ${GOLD}`
                          : "none",
                        boxSizing: "border-box",
                      }}
                    />
                  ))}

                  <div
                    style={{
                      position: "absolute",
                      inset: "48px 72px 43px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Cabeçalho */}
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src="/logo-ipcecma.png"
                        alt="Logo IPCECMA"
                        crossOrigin="anonymous"
                        style={{
                          width: 65,
                          height: 65,
                          objectFit: "contain",
                          marginBottom: 5,
                        }}
                      />

                      <div
                        style={{
                          color: DARK_GOLD,
                          fontSize: 15,
                          fontWeight: 700,
                          letterSpacing: "2.2px",
                          lineHeight: 1.45,
                        }}
                      >
                        IGREJA PENTECOSTAL
                        <br />
                        CEIFEIROS EM CHAMAS
                        <br />
                        MINISTÉRIO ATIBAIA
                      </div>

                      <div
                        style={{
                          width: 190,
                          height: 2,
                          backgroundColor: GOLD,
                          marginTop: 12,
                        }}
                      />
                    </div>

                    {/* Título */}
                    <div style={{ marginTop: 15 }}>
                      <div
                        style={{
                          fontSize: 17,
                          letterSpacing: "5px",
                          color: DARK_GOLD,
                          fontWeight: 600,
                        }}
                      >
                        CERTIFICADO DE
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 29,
                          lineHeight: 1.2,
                          letterSpacing: "3px",
                          fontWeight: 700,
                          color: DARK_GOLD,
                        }}
                      >
                        CONSAGRAÇÃO DE OBREIRO
                      </div>
                    </div>

                    {/* Nome do obreiro */}
                    <div
                      style={{
                        width: "100%",
                        marginTop: 21,
                        padding: "0 10px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontFamily:
                            'var(--font-great-vibes), "Great Vibes", cursive',
                          color: DARK_GOLD,
                          fontSize: formData.nome.length > 34 ? 35 : 43,
                          lineHeight: 1.3,
                          overflowWrap: "anywhere",
                          maxHeight: 62,
                          overflow: "hidden",
                        }}
                      >
                        {formData.nome || "Nome do Obreiro"}
                      </div>

                      <div
                        style={{
                          width: "70%",
                          height: 1,
                          margin: "8px auto 0",
                          background:
                            "linear-gradient(to right, transparent, #B58A3B, transparent)",
                        }}
                      />
                    </div>

                    {/* Texto do certificado */}
                    <div
                      style={{
                        width: "90%",
                        marginTop: 17,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: INK,
                      }}
                    >
                      {hasParentData ? (
                        <p style={{ margin: 0 }}>
                          Nascido(a) em{" "}
                          <strong>{formatDate(formData.dataNascimento)}</strong>
                          , filho(a) de <strong>{formData.filhoDe}</strong> e de{" "}
                          <strong>{formData.filhaDe}</strong>, foi consagrado(a)
                          ao Senhor Jesus Cristo em cerimônia dirigida pelo
                          Pastor, para exercer sua função junto à Igreja.
                      </p>
                      ) : (
                        <p style={{ margin: 0 }}>
                          Certificamos que o(a) obreiro(a) acima identificado(a)
                          foi consagrado(a) ao Senhor Jesus Cristo em cerimônia
                          dirigida pelo Pastor, para exercer sua função junto à
                          Igreja, conforme os princípios bíblicos e doutrinários
                          da Igreja do Senhor Jesus Cristo.
                        </p>
                      )}
                    </div>

                    {/* Data */}
                    <div
                      style={{
                        marginTop: 13,
                        color: DARK_GOLD,
                        fontSize: 16,
                        fontWeight: 700,
                        fontStyle: "italic",
                      }}
                    >
                      {formData.dataConsagracao
                        ? formatDate(formData.dataConsagracao)
                        : "___ de ___________ de ____"}
                    </div>

                    {/* Assinaturas */}
                    <div
                      style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 70,
                        marginTop: "auto",
                        padding: "0 38px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ minWidth: 0, textAlign: "center" }}>
                        <div
                          style={{
                            height: 35,
                            display: "flex",
                            alignItems: "end",
                            justifyContent: "center",
                            fontFamily:
                              'var(--font-great-vibes), "Great Vibes", cursive',
                            fontSize: 23,
                            lineHeight: 1.15,
                            overflowWrap: "anywhere",
                            overflow: "hidden",
                          }}
                        >
                          {formData.pastor}
                        </div>

                        <div
                          style={{
                            borderTop: `1px solid ${DARK_GOLD}`,
                            marginTop: 4,
                          }}
                        />

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "2px",
                            color: DARK_GOLD,
                          }}
                        >
                          PASTOR PRESIDENTE
                        </div>
                      </div>

                      <div style={{ minWidth: 0, textAlign: "center" }}>
                        <div
                          style={{
                            height: 35,
                            display: "flex",
                            alignItems: "end",
                            justifyContent: "center",
                            fontFamily:
                              'var(--font-great-vibes), "Great Vibes", cursive',
                            fontSize: 23,
                            lineHeight: 1.15,
                            overflowWrap: "anywhere",
                            overflow: "hidden",
                          }}
                        >
                          {formData.secretaria}
                        </div>

                        <div
                          style={{
                            borderTop: `1px solid ${DARK_GOLD}`,
                            marginTop: 4,
                          }}
                        />

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "2px",
                            color: DARK_GOLD,
                          }}
                        >
                          SECRETÁRIA
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Confira a prévia e os dados antes de gerar o PDF. O logotipo
                deve estar disponível em{" "}
                <code>public/logo-ipcecma.png</code>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}