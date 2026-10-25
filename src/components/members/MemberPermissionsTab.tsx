"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Loader2, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Member {
  id: number
  name: string
}

interface Props {
  member: Member
}

interface PermissionNode {
  key: string
  label: string
  children?: PermissionNode[]
}

// Estrutura hierárquica de permissões
const permissionsTree: PermissionNode[] = [
  {
    key: "super_admin",
    label: "Super administrador",
  },
  {
    key: "people",
    label: "Módulo Pessoas",
    children: [
      {
        key: "people.manage_all",
        label: "Gerenciar todas as pessoas",
        children: [
          { key: "people.manage_all.view", label: "Ver" },
          { key: "people.manage_all.edit", label: "Editar" },
          { key: "people.manage_all.add", label: "Adicionar" },
          { key: "people.manage_all.remove", label: "Remover" },
        ],
      },
      {
        key: "people.additional_fields",
        label: "Gerenciar campos adicionais",
        children: [
          { key: "people.additional_fields.view", label: "Ver" },
          { key: "people.additional_fields.edit", label: "Editar" },
          { key: "people.additional_fields.add", label: "Adicionar" },
          { key: "people.additional_fields.remove", label: "Remover" },
        ],
      },
      {
        key: "people.categories",
        label: "Gerenciar categorias de pessoas",
        children: [
          { key: "people.categories.view", label: "Ver" },
          { key: "people.categories.edit", label: "Editar" },
          { key: "people.categories.add", label: "Adicionar" },
          { key: "people.categories.remove", label: "Remover" },
        ],
      },
      {
        key: "people.positions",
        label: "Gerenciar cargos",
        children: [
          { key: "people.positions.view", label: "Ver" },
          { key: "people.positions.edit", label: "Editar" },
          { key: "people.positions.add", label: "Adicionar" },
          { key: "people.positions.remove", label: "Remover" },
        ],
      },
      {
        key: "people.card_templates",
        label: "Gerenciar modelos de cartões",
        children: [
          { key: "people.card_templates.view", label: "Ver" },
          { key: "people.card_templates.edit", label: "Editar" },
          { key: "people.card_templates.add", label: "Adicionar" },
          { key: "people.card_templates.remove", label: "Remover" },
        ],
      },
      {
        key: "people.reports",
        label: "Gerenciar relatórios",
        children: [
          { key: "people.reports.view", label: "Ver" },
        ],
      },
      {
        key: "people.import_export",
        label: "Exportar/importar dados",
        children: [
          { key: "people.import_export.view", label: "Ver" },
          { key: "people.import_export.add", label: "Adicionar" },
        ],
      },
    ],
  },
  {
    key: "groups",
    label: "Módulo Grupos",
    children: [
      {
        key: "groups.manage_all",
        label: "Gerenciar todos os grupos",
        children: [
          { key: "groups.manage_all.view", label: "Ver" },
          { key: "groups.manage_all.edit", label: "Editar" },
          { key: "groups.manage_all.add", label: "Adicionar" },
          { key: "groups.manage_all.remove", label: "Remover" },
        ],
      },
      {
        key: "groups.categories",
        label: "Gerenciar categorias",
        children: [
          { key: "groups.categories.view", label: "Ver" },
          { key: "groups.categories.edit", label: "Editar" },
          { key: "groups.categories.add", label: "Adicionar" },
          { key: "groups.categories.remove", label: "Remover" },
        ],
      },
      {
        key: "groups.reports",
        label: "Gerenciar relatórios",
        children: [
          { key: "groups.reports.view", label: "Ver" },
        ],
      },
      {
        key: "groups.import_export",
        label: "Exportar/importar dados",
        children: [
          { key: "groups.import_export.view", label: "Ver" },
          { key: "groups.import_export.add", label: "Adicionar" },
        ],
      },
    ],
  },
  {
    key: "teaching",
    label: "Módulo Ensino",
    children: [
      {
        key: "teaching.studies",
        label: "Gerenciar todos os estudos",
        children: [
          { key: "teaching.studies.edit", label: "Editar" },
          { key: "teaching.studies.add", label: "Adicionar" },
          { key: "teaching.studies.remove", label: "Remover" },
        ],
      },
      {
        key: "teaching.study_categories",
        label: "Gerenciar categorias de estudos",
        children: [
          { key: "teaching.study_categories.edit", label: "Editar" },
          { key: "teaching.study_categories.add", label: "Adicionar" },
          { key: "teaching.study_categories.remove", label: "Remover" },
        ],
      },
      {
        key: "teaching.personal_monitoring",
        label: "Gerenciar todos acompanhamentos pessoais",
        children: [
          { key: "teaching.personal_monitoring.view", label: "Ver" },
          { key: "teaching.personal_monitoring.edit", label: "Editar" },
          { key: "teaching.personal_monitoring.add", label: "Adicionar" },
          { key: "teaching.personal_monitoring.remove", label: "Remover" },
        ],
      },
      {
        key: "teaching.monitoring_reports",
        label: "Gerenciar relatórios de acompanhamentos pessoais",
        children: [
          { key: "teaching.monitoring_reports.view", label: "Ver" },
        ],
      },
      {
        key: "teaching.schools",
        label: "Gerenciar todas as escolas",
        children: [
          { key: "teaching.schools.view", label: "Ver" },
          { key: "teaching.schools.edit", label: "Editar" },
          { key: "teaching.schools.add", label: "Adicionar" },
          { key: "teaching.schools.remove", label: "Remover" },
        ],
      },
      {
        key: "teaching.classes",
        label: "Gerenciar todas as turmas",
        children: [
          { key: "teaching.classes.view", label: "Ver" },
          { key: "teaching.classes.edit", label: "Editar" },
          { key: "teaching.classes.add", label: "Adicionar" },
          { key: "teaching.classes.remove", label: "Remover" },
        ],
      },
      {
        key: "teaching.school_reports",
        label: "Gerenciar relatórios de escolas",
        children: [
          { key: "teaching.school_reports.view", label: "Ver" },
        ],
      },
      {
        key: "teaching.import_export",
        label: "Exportar/importar dados",
        children: [
          { key: "teaching.import_export.view", label: "Ver" },
          { key: "teaching.import_export.add", label: "Adicionar" },
        ],
      },
    ],
  },
  {
    key: "finance",
    label: "Módulo Financeiro",
    children: [
      {
        key: "finance.transactions",
        label: "Gerenciar transações",
        children: [
          { key: "finance.transactions.view", label: "Ver" },
          { key: "finance.transactions.edit", label: "Editar" },
          { key: "finance.transactions.add", label: "Adicionar" },
          { key: "finance.transactions.remove", label: "Remover" },
        ],
      },
      {
        key: "finance.reports",
        label: "Gerenciar relatórios",
        children: [
          { key: "finance.reports.view", label: "Ver" },
        ],
      },
      {
        key: "finance.categories",
        label: "Gerenciar categorias",
        children: [
          { key: "finance.categories.view", label: "Ver" },
          { key: "finance.categories.edit", label: "Editar" },
          { key: "finance.categories.add", label: "Adicionar" },
          { key: "finance.categories.remove", label: "Remover" },
        ],
      },
      {
        key: "finance.accounts",
        label: "Gerenciar contas",
        children: [
          { key: "finance.accounts.view", label: "Ver" },
          { key: "finance.accounts.edit", label: "Editar" },
          { key: "finance.accounts.add", label: "Adicionar" },
          { key: "finance.accounts.remove", label: "Remover" },
        ],
      },
      {
        key: "finance.contacts",
        label: "Gerenciar contatos",
        children: [
          { key: "finance.contacts.view", label: "Ver" },
          { key: "finance.contacts.edit", label: "Editar" },
          { key: "finance.contacts.add", label: "Adicionar" },
          { key: "finance.contacts.remove", label: "Remover" },
        ],
      },
      {
        key: "finance.cost_centers",
        label: "Gerenciar centros de custos",
        children: [
          { key: "finance.cost_centers.view", label: "Ver" },
          { key: "finance.cost_centers.edit", label: "Editar" },
          { key: "finance.cost_centers.add", label: "Adicionar" },
          { key: "finance.cost_centers.remove", label: "Remover" },
        ],
      },
      {
        key: "finance.import_export",
        label: "Exportar/importar dados",
        children: [
          { key: "finance.import_export.view", label: "Ver" },
          { key: "finance.import_export.add", label: "Adicionar" },
        ],
      },
    ],
  },
  {
    key: "assets",
    label: "Módulo Patrimônio",
    children: [
      {
        key: "assets.items",
        label: "Gerenciar todos os itens",
        children: [
          { key: "assets.items.view", label: "Ver" },
          { key: "assets.items.edit", label: "Editar" },
          { key: "assets.items.add", label: "Adicionar" },
          { key: "assets.items.remove", label: "Remover" },
        ],
      },
      {
        key: "assets.categories",
        label: "Gerenciar categorias",
        children: [
          { key: "assets.categories.view", label: "Ver" },
          { key: "assets.categories.edit", label: "Editar" },
          { key: "assets.categories.add", label: "Adicionar" },
          { key: "assets.categories.remove", label: "Remover" },
        ],
      },
      {
        key: "assets.locations",
        label: "Gerenciar locais",
        children: [
          { key: "assets.locations.view", label: "Ver" },
          { key: "assets.locations.edit", label: "Editar" },
          { key: "assets.locations.add", label: "Adicionar" },
          { key: "assets.locations.remove", label: "Remover" },
        ],
      },
      {
        key: "assets.reports",
        label: "Gerenciar relatórios",
        children: [
          { key: "assets.reports.view", label: "Ver" },
        ],
      },
      {
        key: "assets.import_export",
        label: "Exportar/importar dados",
        children: [
          { key: "assets.import_export.view", label: "Ver" },
          { key: "assets.import_export.add", label: "Adicionar" },
        ],
      },
    ],
  },
  {
    key: "calendar",
    label: "Módulo Agenda",
    children: [
      {
        key: "calendar.manage",
        label: "Gerenciar calendário",
        children: [
          { key: "calendar.manage.edit", label: "Editar" },
          { key: "calendar.manage.add", label: "Adicionar" },
          { key: "calendar.manage.remove", label: "Remover" },
        ],
      },
      {
        key: "calendar.categories",
        label: "Gerenciar categorias de calendário",
        children: [
          { key: "calendar.categories.edit", label: "Editar" },
          { key: "calendar.categories.add", label: "Adicionar" },
          { key: "calendar.categories.remove", label: "Remover" },
        ],
      },
      {
        key: "calendar.board",
        label: "Gerenciar mural",
        children: [
          { key: "calendar.board.edit", label: "Editar" },
          { key: "calendar.board.add", label: "Adicionar" },
          { key: "calendar.board.remove", label: "Remover" },
        ],
      },
      {
        key: "calendar.events",
        label: "Gerenciar todos os eventos",
        children: [
          { key: "calendar.events.view", label: "Ver" },
          { key: "calendar.events.edit", label: "Editar" },
          { key: "calendar.events.add", label: "Adicionar" },
          { key: "calendar.events.remove", label: "Remover" },
        ],
      },
    ],
  },
  {
    key: "media",
    label: "Módulo Mídias",
    children: [
      {
        key: "media.photos",
        label: "Gerenciar todas as fotos",
        children: [
          { key: "media.photos.view", label: "Ver" },
          { key: "media.photos.edit", label: "Editar" },
          { key: "media.photos.add", label: "Adicionar" },
          { key: "media.photos.remove", label: "Remover" },
        ],
      },
      {
        key: "media.photo_albums",
        label: "Gerenciar todos os álbuns de fotos",
        children: [
          { key: "media.photo_albums.view", label: "Ver" },
          { key: "media.photo_albums.edit", label: "Editar" },
          { key: "media.photo_albums.add", label: "Adicionar" },
          { key: "media.photo_albums.remove", label: "Remover" },
        ],
      },
      {
        key: "media.videos",
        label: "Gerenciar todos os vídeos",
        children: [
          { key: "media.videos.view", label: "Ver" },
          { key: "media.videos.edit", label: "Editar" },
          { key: "media.videos.add", label: "Adicionar" },
          { key: "media.videos.remove", label: "Remover" },
        ],
      },
      {
        key: "media.video_albums",
        label: "Gerenciar todos os álbuns de vídeos",
        children: [
          { key: "media.video_albums.view", label: "Ver" },
          { key: "media.video_albums.edit", label: "Editar" },
          { key: "media.video_albums.add", label: "Adicionar" },
          { key: "media.video_albums.remove", label: "Remover" },
        ],
      },
      {
        key: "media.document_templates",
        label: "Gerenciar modelos de documentos",
        children: [
          { key: "media.document_templates.view", label: "Ver" },
          { key: "media.document_templates.edit", label: "Editar" },
          { key: "media.document_templates.add", label: "Adicionar" },
          { key: "media.document_templates.remove", label: "Remover" },
        ],
      },
      {
        key: "media.files",
        label: "Gerenciar todos os arquivos",
        children: [
          { key: "media.files.view", label: "Ver" },
          { key: "media.files.edit", label: "Editar" },
          { key: "media.files.add", label: "Adicionar" },
          { key: "media.files.remove", label: "Remover" },
        ],
      },
      {
        key: "media.folders",
        label: "Gerenciar todas as pastas de arquivos",
        children: [
          { key: "media.folders.view", label: "Ver" },
          { key: "media.folders.edit", label: "Editar" },
          { key: "media.folders.add", label: "Adicionar" },
          { key: "media.folders.remove", label: "Remover" },
        ],
      },
      {
        key: "media.forms",
        label: "Gerenciar todos os formulários",
        children: [
          { key: "media.forms.view", label: "Ver" },
          { key: "media.forms.edit", label: "Editar" },
          { key: "media.forms.add", label: "Adicionar" },
          { key: "media.forms.remove", label: "Remover" },
        ],
      },
    ],
  },
]

export default function MemberPermissionsTab({ member }: Props) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPermissions()
  }, [member.id])

  const fetchPermissions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const permissionKeys = data.map((p: any) => p.permissionKey)
        setPermissions(new Set(permissionKeys))
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast.error("Erro ao carregar permissões")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para obter todos os filhos de um nó recursivamente
  const getAllChildren = (node: PermissionNode): string[] => {
    const children = [node.key]
    if (node.children) {
      node.children.forEach(child => {
        children.push(...getAllChildren(child))
      })
    }
    return children
  }

  // Função para verificar se um nó tem todos os filhos marcados
  const hasAllChildrenChecked = (node: PermissionNode): boolean => {
    if (!node.children || node.children.length === 0) {
      return permissions.has(node.key)
    }
    return node.children.every(child => hasAllChildrenChecked(child))
  }

  // Função para verificar se um nó tem alguns filhos marcados
  const hasSomeChildrenChecked = (node: PermissionNode): boolean => {
    if (!node.children || node.children.length === 0) {
      return permissions.has(node.key)
    }
    return node.children.some(child => hasSomeChildrenChecked(child))
  }

  const handlePermissionToggle = (node: PermissionNode, checked: boolean) => {
    const newPermissions = new Set(permissions)
    
    if (checked) {
      // Adicionar este nó e todos os filhos
      const allKeys = getAllChildren(node)
      allKeys.forEach(key => newPermissions.add(key))
    } else {
      // Remover este nó e todos os filhos
      const allKeys = getAllChildren(node)
      allKeys.forEach(key => newPermissions.delete(key))
    }
    
    setPermissions(newPermissions)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/members/${member.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          permissions: Array.from(permissions)
        })
      })

      if (response.ok) {
        toast.success("Permissões atualizadas com sucesso!", {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar permissões")
      }
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error("Erro ao salvar permissões")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleNode = (key: string) => {
    const newOpenNodes = new Set(openNodes)
    if (newOpenNodes.has(key)) {
      newOpenNodes.delete(key)
    } else {
      newOpenNodes.add(key)
    }
    setOpenNodes(newOpenNodes)
  }

  const renderPermissionNode = (node: PermissionNode, level: number = 0) => {
    const isChecked = hasAllChildrenChecked(node)
    const isIndeterminate = !isChecked && hasSomeChildrenChecked(node)
    const hasChildren = node.children && node.children.length > 0
    const isOpen = openNodes.has(node.key)

    return (
      <div key={node.key} className="space-y-2">
        <div 
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          style={{ marginLeft: `${level * 24}px` }}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleNode(node.key)}
              className="p-1 hover:bg-muted rounded"
            >
              {isOpen ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <Checkbox
            id={node.key}
            checked={isChecked}
            onCheckedChange={(checked) => handlePermissionToggle(node, checked as boolean)}
            className={isIndeterminate ? "data-[state=checked]:bg-amber-400" : ""}
          />
          <label
            htmlFor={node.key}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
          >
            {node.label}
          </label>
        </div>

        {hasChildren && isOpen && (
          <div className="space-y-2">
            {node.children!.map(child => renderPermissionNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Permissões de {member.name}
            </CardTitle>
            <CardDescription>
              Configure as permissões de acesso do membro. Ao marcar uma opção pai, todas as opções filhas são habilitadas automaticamente.
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Permissões"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <strong>Nota:</strong> Cada congregação vê apenas seus membros, exceto a sede que tem acesso a todas as congregações.
            </p>
          </div>

          <div className="space-y-2">
            {permissionsTree.map(node => renderPermissionNode(node))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
