"use client"

import { useRef, useState } from "react"
import type { ChangeEvent } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Download,
  FileText,
  Upload,
  X,
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import { toJpeg } from "html-to-image"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

const COLORS = {
  gold: "#B88736",
  darkGold: "#8C5B18",
  navy: "#172B49",
  text: "#273449",
  paper: "#FFFCF5",
}

const INITIAL_FORM = {
  tipo: "Evangelista",
  nome: "",
  dataNascimento: "",
  filhoDe: "",
  filhaDe: "",
  dataConsagracao: "",
  pastor: "Adão Teixeira de Sousa",
  secretaria: "Edilaura Miranda Angelin",
  textoPersonalizado:
    "foi consagrado(a) ao Santo Ministério em cerimônia dirigida pelo Pastor, para exercer sua função junto à Igreja, conforme os princípios bíblicos e doutrinários da Igreja do Senhor Jesus Cristo.",
}

function formatDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return ""
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Não foi possível ler o arquivo selecionado."))
        return
      }
      const image = new Image()
      image.onload = () => resolve(reader.result as string)
      image.onerror = () => reject(new Error("O arquivo selecionado não é uma imagem válida."))
      image.src = reader.result
    }
    reader.onerror = () => reject(new Error("Falha ao ler a imagem. Tente selecionar outro arquivo."))
    reader.readAsDataURL(file)
  })
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error(`A imagem "${img.alt || "do certificado"}" não carregou.`))
    }, 10000)
    const cleanup = () => {
      window.clearTimeout(timeout)
      img.removeEventListener("load", onLoad)
      img.removeEventListener("error", onError)
    }
    const onLoad = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error(`Não foi possível carregar a imagem "${img.alt || "do certificado"}".`))
    }
    img.addEventListener("load", onLoad, { once: true })
    img.addEventListener("error", onError, { once: true })
    if (img.complete && img.naturalWidth > 0) {
      cleanup()
      resolve()
    }
  })
}

export default function CertificadoOrdenacaoPage() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [backgroundImage, setBackgroundImage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({ ...INITIAL_FORM })

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    input.value = ""
    const supportedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!supportedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Selecione PNG, JPG ou WebP.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("A imagem ultrapassa o limite de 10 MB.")
      return
    }
    setIsUploading(true)
    try {
      const dataUrl = await readImageAsDataUrl(file)
      setBackgroundImage(dataUrl)
      toast.success("Imagem carregada. Ela aparecerá no certificado e no PDF.")
    } catch (error) {
      console.error("Erro ao carregar imagem:", error)
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar a imagem.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setBackgroundImage("")
    toast.info("Fundo personalizado removido.")
  }

  const handleReset = () => {
    setFormData({ ...INITIAL_FORM })
    setBackgroundImage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast.success("Formulário limpo.")
  }

  const handleDownload = async () => {
    if (!formData.tipo.trim()) {
      toast.error("Informe o cargo ou tipo de ordenação.")
      return
    }
    if (!formData.nome.trim()) {
      toast.error("Informe o nome completo do consagrado.")
      return
    }
    if (!formData.dataConsagracao) {
      toast.error("Informe a data da ordenação.")
      return
    }
    const element = certificateRef.current
    if (!element) {
      toast.error("Não foi possível localizar o certificado.")
      return
    }
    setIsGenerating(true)
    try {
      if ("fonts" in document) {
        await document.fonts.ready
      }
      const images = Array.from(element.querySelectorAll("img"))
      await Promise.all(images.map(waitForImage))

      const imageData = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: false,
        backgroundColor: COLORS.paper,
      })

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST")

      const cleanFileName = (value: string) =>
        value
          .trim()
          .normalize("NFC")
          .replace(/[^\p{L}\p{N}\s_-]/gu, "")
          .replace(/\s+/g, "_")
          .slice(0, 80)

      const safeName = cleanFileName(formData.nome) || "Consagrado"
      const safeRole = cleanFileName(formData.tipo) || "Ordenacao"

      pdf.save(`Certificado_${safeRole}_${safeName}.pdf`)
      toast.success("Certificado PDF gerado com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar certificado:", error)
      toast.error(
        error instanceof Error
          ? `Erro ao gerar PDF: ${error.message}`
          : "Não foi possível gerar o PDF. Verifique as imagens e tente novamente.",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const fieldClass =
    "h-10 rounded-lg border-slate-200 bg-white shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/30"

  const certificateStyle = {
    position: "relative",
    width: "100%",
    aspectRatio: "297/210",
    overflow: "hidden",
    boxSizing: "border-box",
    backgroundColor: COLORS.paper,
    backgroundImage: backgroundImage
      ? `url("${backgroundImage}")`
      : "radial-gradient(ellipse at center, #fffef9 0%, #f8f0df 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: COLORS.text,
    fontFamily: 'Georgia, "Times New Roman", serif',
  } as React.CSSProperties

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Certificado de Ordenação
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Crie certificados personalizados para Evangelistas, Diáconos,
                Presbíteros, Pastores e outros cargos.
              </p>
            </div>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
            <FileText className="h-4 w-4" />
            Formato A4 horizontal
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
          {/* FORMULÁRIO */}
          <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white pb-5">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <FileText className="h-5 w-5 text-amber-700" />
                Dados do certificado
              </CardTitle>
              <CardDescription>
                Preencha os dados que aparecerão no documento.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              <div className="space-y-2">
                <Label htmlFor="tipo">
                  Cargo ou função <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tipo"
                  className={fieldClass}
                  value={formData.tipo}
                  onChange={(event) => updateField("tipo", event.target.value)}
                  placeholder="Ex.: Evangelista, Diácono, Pastor"
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-upload">Imagem de fundo (opcional)</Label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <input
                    ref={fileInputRef}
                    id="bg-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                      {isUploading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {isUploading ? "Carregando imagem..." : "Adicione seu próprio fundo"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">PNG, JPG ou WebP · máximo de 10 MB</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Selecionar imagem
                    </Button>
                  </div>
                </div>
                {backgroundImage && (
                  <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-800">
                        <ImageIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">Fundo personalizado carregado</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                    <img
                      src={backgroundImage}
                      alt="Prévia do fundo escolhido"
                      className="h-24 w-full rounded-md border border-emerald-200 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100" />

              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  className={fieldClass}
                  value={formData.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                  placeholder="Nome completo do consagrado"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  className={fieldClass}
                  value={formData.dataNascimento}
                  onChange={(event) => updateField("dataNascimento", event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="filhoDe">Filho(a) de</Label>
                  <Input
                    id="filhoDe"
                    className={fieldClass}
                    value={formData.filhoDe}
                    onChange={(event) => updateField("filhoDe", event.target.value)}
                    placeholder="Nome do pai"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filhaDe">E de</Label>
                  <Input
                    id="filhaDe"
                    className={fieldClass}
                    value={formData.filhaDe}
                    onChange={(event) => updateField("filhaDe", event.target.value)}
                    placeholder="Nome da mãe"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataConsagracao">
                  Data da ordenação <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dataConsagracao"
                  type="date"
                  className={fieldClass}
                  value={formData.dataConsagracao}
                  onChange={(event) => updateField("dataConsagracao", event.target.value)}
                />
              </div>

              <div className="border-t border-slate-100" />

              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor presidente</Label>
                <Input
                  id="pastor"
                  className={fieldClass}
                  value={formData.pastor}
                  onChange={(event) => updateField("pastor", event.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretaria">Secretária</Label>
                <Input
                  id="secretaria"
                  className={fieldClass}
                  value={formData.secretaria}
                  onChange={(event) => updateField("secretaria", event.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="textoPersonalizado">Texto do certificado</Label>
                  <span className="text-xs text-slate-400">
                    {formData.textoPersonalizado.length}/1000
                  </span>
                </div>
                <Textarea
                  id="textoPersonalizado"
                  value={formData.textoPersonalizado}
                  onChange={(event) =>
                    updateField("textoPersonalizado", event.target.value.slice(0, 1000))
                  }
                  rows={5}
                  className="resize-y rounded-lg border-slate-200 leading-relaxed shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500/30"
                  placeholder="Digite o texto do certificado."
                />
              </div>

              {/* BOTÃO DE DOWNLOAD - MOVIDO PARA CÁ */}
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-[1fr_auto]">
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={isGenerating || isUploading}
                  className="h-11 rounded-lg bg-amber-700 font-semibold text-white shadow-sm hover:bg-amber-800"
                >
                  {isGenerating ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isGenerating ? "Gerando PDF..." : "Baixar certificado"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isGenerating || isUploading}
                  className="h-11 rounded-lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>

              <p className="text-center text-xs leading-relaxed text-slate-500">
                Confira os dados na prévia antes de baixar o documento.
              </p>
            </CardContent>
          </Card>

          {/* PRÉ-VISUALIZAÇÃO */}
          <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white pb-5">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Eye className="h-5 w-5 text-amber-700" />
                Pré-visualização
              </CardTitle>
              <CardDescription>
                Visualização do certificado em A4 horizontal · 29,7 × 21 cm
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-4 sm:p-5">
              <div
                ref={certificateRef}
                data-certificate
                style={certificateStyle}
              >
                {/* Borda dourada externa */}
                <div
                  style={{
                    position: "absolute",
                    inset: "3%",
                    border: `2px solid ${COLORS.gold}`,
                    pointerEvents: "none",
                  }}
                />
                {/* Borda dourada interna */}
                <div
                  style={{
                    position: "absolute",
                    inset: "4%",
                    border: "1px solid #D8B66F",
                    pointerEvents: "none",
                  }}
                />

                {/* Faixa superior decorativa */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "1.5%",
                    background: `linear-gradient(90deg, ${COLORS.navy}, ${COLORS.gold}, ${COLORS.navy})`,
                  }}
                />

                {/* Conteúdo do certificado */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    height: "100%",
                    boxSizing: "border-box",
                    padding: "5% 10%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "center",
                  }}
                >
                  {/* Cabeçalho */}
                  <div style={{ width: "100%" }}>
                    <img
                      src="/logo-ipcecma.png"
                      alt="Logo IPCECMA"
                      style={{
                        width: "9%",
                        height: "9%",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 1%",
                      }}
                    />
                    <h1
                      style={{
                        margin: 0,
                        color: COLORS.navy,
                        fontSize: "1.2vw",
                        lineHeight: 1.45,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                      }}
                    >
                      IGREJA PENTECOSTAL
                      <br />
                      CEIFEIROS EM CHAMAS
                      <br />
                      MINISTÉRIO ATIBAIA
                    </h1>
                    <div
                      style={{
                        width: "20%",
                        height: "2px",
                        margin: "1.5% auto 0",
                        background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
                      }}
                    />
                  </div>

                  {/* Título */}
                  <div style={{ width: "100%", marginTop: "1.5%" }}>
                    <p
                      style={{
                        margin: 0,
                        color: COLORS.navy,
                        fontSize: "1.6vw",
                        fontWeight: 700,
                        letterSpacing: "0.5em",
                      }}
                    >
                      CERTIFICADO DE
                    </p>
                    <h2
                      style={{
                        margin: "0.5% 0 0",
                        color: COLORS.darkGold,
                        fontSize: "3.2vw",
                        lineHeight: 1.15,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {formData.tipo || "ORDENAÇÃO"}
                    </h2>
                    <div
                      style={{
                        width: "30%",
                        maxWidth: "75%",
                        height: "1px",
                        margin: "1.5% auto 0",
                        background: COLORS.gold,
                      }}
                    />
                  </div>

                  {/* Nome */}
                  <div style={{ width: "100%", marginTop: "1%" }}>
                    <p
                      style={{
                        margin: 0,
                        color: COLORS.navy,
                        fontFamily: '"Great Vibes", "Brush Script MT", cursive',
                        fontSize: "3.8vw",
                        lineHeight: 1.25,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {formData.nome || "Nome do Consagrado"}
                    </p>
                    <div
                      style={{
                        width: "70%",
                        height: "1px",
                        margin: "1% auto 0",
                        background: "#C6A46A",
                      }}
                    />
                  </div>

                  {/* Texto */}
                  <div
                    style={{
                      width: "90%",
                      margin: "1.5% auto",
                      color: "#39465A",
                      fontSize: "1.2vw",
                      lineHeight: 1.7,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {formData.dataNascimento && (
                      <p style={{ margin: "0 0 0.5em" }}>
                        Nascido(a) em <strong>{formatDate(formData.dataNascimento)}</strong>
                        {formData.filhoDe && <> , filho(a) de <strong>{formData.filhoDe}</strong></>}
                        {formData.filhaDe && <> e de <strong>{formData.filhaDe}</strong></>}.
                      </p>
                    )}
                    <p style={{ margin: 0 }}>{formData.textoPersonalizado}</p>
                  </div>

                  {/* Data */}
                  <div style={{ margin: "0.5% 0 1%" }}>
                    <p
                      style={{
                        margin: 0,
                        color: COLORS.darkGold,
                        fontSize: "1.3vw",
                        fontStyle: "italic",
                        fontWeight: 700,
                      }}
                    >
                      {formData.dataConsagracao
                        ? formatDate(formData.dataConsagracao)
                        : "___ de __________ de ____"}
                    </p>
                    <div
                      style={{
                        width: "25%",
                        maxWidth: "100%",
                        height: "1px",
                        margin: "1% auto 0",
                        background: COLORS.gold,
                      }}
                    />
                  </div>

                  {/* Assinaturas */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10%",
                      width: "100%",
                      alignItems: "end",
                      marginTop: "1%",
                    }}
                  >
                    {[
                      { name: formData.pastor, title: "PASTOR PRESIDENTE" },
                      { name: formData.secretaria, title: "SECRETÁRIA" },
                    ].map((signature) => (
                      <div key={signature.title} style={{ minWidth: 0 }}>
                        <p
                          style={{
                            minHeight: "2em",
                            margin: "0 0 0.5em",
                            color: COLORS.navy,
                            fontFamily: '"Great Vibes", "Brush Script MT", cursive',
                            fontSize: "1.8vw",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {signature.name}
                        </p>
                        <div style={{ borderTop: `1px solid ${COLORS.darkGold}` }} />
                        <p
                          style={{
                            margin: "0.7em 0 0",
                            color: COLORS.navy,
                            fontSize: "0.9vw",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                          }}
                        >
                          {signature.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                O certificado se adapta ao tamanho da tela para facilitar a visualização.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}