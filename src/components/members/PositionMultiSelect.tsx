"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, X, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const DEFAULT_POSITIONS = [
  { value: "membro", label: "Membro" },
  { value: "cooperado", label: "Cooperado" },
  { value: "pastor", label: "Pastor" },
  { value: "pastora", label: "Pastora" },
  { value: "pastor-presidente", label: "Pastor Presidente" },
  { value: "vice-presidente", label: "Vice Presidente" },
  { value: "diacono", label: "Diácono" },
  { value: "diaconisa", label: "Diaconisa" },
  { value: "presbitero", label: "Presbítero" },
  { value: "presbitera", label: "Presbítera" },
  { value: "evangelista", label: "Evangelista" },
  { value: "lider-celula", label: "Líder de Célula" },
  { value: "lider-ministerio", label: "Líder de Ministério" },
  { value: "1-secretaria", label: "1ª Secretaria" },
  { value: "2-secretaria", label: "2ª Secretaria" },
  { value: "1-tesoureiro", label: "1º Tesoureiro" },
  { value: "2-tesoureiro", label: "2º Tesoureiro" },
]

const CUSTOM_POSITIONS_KEY = "ipcecma_custom_positions"

export function loadCustomPositions(): { value: string; label: string }[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_POSITIONS_KEY) || "[]")
  } catch {
    return []
  }
}

export function saveCustomPositions(positions: { value: string; label: string }[]) {
  localStorage.setItem(CUSTOM_POSITIONS_KEY, JSON.stringify(positions))
}

/** Parse position field: supports JSON array or legacy single string */
export function parsePositions(raw: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {
    // legacy single value
  }
  return [raw]
}

/** Serialize array to JSON string for storage */
export function serializePositions(values: string[]): string {
  return JSON.stringify(values)
}

/** Get label for a position value */
export function getPositionLabel(
  value: string,
  allPositions: { value: string; label: string }[]
): string {
  return allPositions.find(p => p.value === value)?.label ?? value
}

interface PositionMultiSelectProps {
  value: string[]
  onChange: (values: string[]) => void
  required?: boolean
}

export default function PositionMultiSelect({
  value: selectedValues,
  onChange,
  required = false,
}: PositionMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [customPositions, setCustomPositions] = useState<{ value: string; label: string }[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [newPositionLabel, setNewPositionLabel] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCustomPositions(loadCustomPositions())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const allPositions = [...DEFAULT_POSITIONS, ...customPositions]

  const toggle = (val: string) => {
    if (selectedValues.includes(val)) {
      const next = selectedValues.filter(v => v !== val)
      onChange(next.length === 0 && required ? [val] : next)
    } else {
      onChange([...selectedValues, val])
    }
  }

  const removeChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = selectedValues.filter(v => v !== val)
    if (next.length === 0 && required) return
    onChange(next)
  }

  const handleAddPosition = () => {
    const trimmed = newPositionLabel.trim()
    if (!trimmed) { toast.error("Digite o nome do cargo"); return }
    const val = trimmed.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (allPositions.some(p => p.value === val || p.label.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Este cargo já existe"); return
    }
    const updated = [...customPositions, { value: val, label: trimmed }]
    setCustomPositions(updated)
    saveCustomPositions(updated)
    onChange([...selectedValues, val])
    setNewPositionLabel("")
    setShowAddDialog(false)
    toast.success(`Cargo "${trimmed}" adicionado!`)
  }

  const handleDeleteCustom = (val: string) => {
    const updated = customPositions.filter(p => p.value !== val)
    setCustomPositions(updated)
    saveCustomPositions(updated)
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val))
    }
    toast.success("Cargo removido")
  }

  const displayLabels = selectedValues
    .map(v => getPositionLabel(v, allPositions))

  return (
    <>
      <div className="space-y-1.5" ref={dropdownRef}>
        {/* Trigger */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(o => !o)}
          onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}
          className={cn(
            "min-h-10 w-full flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open && "ring-2 ring-ring"
          )}
        >
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground flex-1">Selecione o(s) cargo(s)</span>
          ) : (
            displayLabels.map((label, i) => (
              <Badge
                key={selectedValues[i]}
                variant="secondary"
                className="gap-1 pr-1 text-xs font-medium"
              >
                {label}
                <button
                  type="button"
                  onClick={e => removeChip(selectedValues[i], e)}
                  className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))
          )}
          <ChevronDown
            size={16}
            className={cn(
              "ml-auto shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full max-w-sm rounded-md border border-border bg-popover shadow-md overflow-hidden">
            {/* Actions bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
              <span className="text-xs text-muted-foreground font-medium">
                {selectedValues.length} selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                {customPositions.length > 0 && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setOpen(false); setShowManageDialog(true) }}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Pencil size={11} />
                    Gerenciar ({customPositions.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setOpen(false); setShowAddDialog(true) }}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                >
                  <Plus size={12} />
                  Novo cargo
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto py-1">
              {DEFAULT_POSITIONS.map(p => {
                const checked = selectedValues.includes(p.value)
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => toggle(p.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      checked
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "border-muted-foreground/40"
                    )}>
                      {checked && <Check size={10} strokeWidth={3} />}
                    </div>
                    {p.label}
                  </button>
                )
              })}

              {customPositions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 border-t border-border mt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cargos Personalizados
                    </p>
                  </div>
                  {customPositions.map(p => {
                    const checked = selectedValues.includes(p.value)
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => toggle(p.value)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                          checked
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "border-muted-foreground/40"
                        )}>
                          {checked && <Check size={10} strokeWidth={3} />}
                        </div>
                        {p.label}
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Adicionar novo cargo */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Adicionar Novo Cargo
            </DialogTitle>
            <DialogDescription>
              Crie um cargo eclesiástico personalizado disponível para todos os membros.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="newPosLabel">Nome do Cargo *</Label>
            <Input
              id="newPosLabel"
              value={newPositionLabel}
              onChange={e => setNewPositionLabel(e.target.value)}
              placeholder="Ex: Missionário, Obreiro, Cantor..."
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddPosition())}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              O cargo será salvo localmente neste dispositivo.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); setNewPositionLabel("") }}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddPosition}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gerenciar cargos personalizados */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Gerenciar Cargos Personalizados
            </DialogTitle>
            <DialogDescription>
              Remova cargos personalizados que não são mais necessários.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
            {customPositions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum cargo personalizado criado.</p>
            ) : (
              customPositions.map(p => (
                <div key={p.value} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{p.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(p.value)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remover cargo"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowManageDialog(false)}>
              Fechar
            </Button>
            <Button type="button" onClick={() => { setShowManageDialog(false); setShowAddDialog(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
