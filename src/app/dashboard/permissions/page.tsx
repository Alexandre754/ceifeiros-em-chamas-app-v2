"use client"

import { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Shield, 
  Users, 
  UsersRound, 
  BookOpen, 
  DollarSign, 
  Package, 
  Calendar, 
  Image as ImageIcon,
  Crown,
  Search,
  Save
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Permission {
  id: string
  name: string
  permissions: {
    view?: boolean
    edit?: boolean
    add?: boolean
    remove?: boolean
  }
}

interface Module {
  id: string
  name: string
  icon: any
  sections: Permission[]
}

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const modules: Module[] = [
    {
      id: "pessoas",
      name: "Módulo Pessoas",
      icon: Users,
      sections: [
        {
          id: "manage-people",
          name: "Gerenciar todas as pessoas",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "custom-fields",
          name: "Gerenciar campos adicionais",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "people-categories",
          name: "Gerenciar categorias de pessoas",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "positions",
          name: "Gerenciar cargos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "card-templates",
          name: "Gerenciar modelos de cartões",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "people-reports",
          name: "Gerenciar relatórios",
          permissions: { view: true }
        },
        {
          id: "import-export-people",
          name: "Exportar/importar dados",
          permissions: { view: true, add: true }
        }
      ]
    },
    {
      id: "grupos",
      name: "Módulo Grupos",
      icon: UsersRound,
      sections: [
        {
          id: "manage-groups",
          name: "Gerenciar todos os grupos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "group-categories",
          name: "Gerenciar categorias",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "group-reports",
          name: "Gerenciar relatórios",
          permissions: { view: true }
        },
        {
          id: "import-export-groups",
          name: "Exportar/importar dados",
          permissions: { view: true, add: true }
        }
      ]
    },
    {
      id: "ensino",
      name: "Módulo Ensino",
      icon: BookOpen,
      sections: [
        {
          id: "manage-studies",
          name: "Gerenciar todos os estudos",
          permissions: { edit: true, add: true, remove: true }
        },
        {
          id: "study-categories",
          name: "Gerenciar categorias de estudos",
          permissions: { edit: true, add: true, remove: true }
        },
        {
          id: "personal-tracking",
          name: "Gerenciar todos acompanhamentos pessoais",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "tracking-reports",
          name: "Gerenciar relatórios de acompanhamentos pessoais",
          permissions: { view: true }
        },
        {
          id: "manage-schools",
          name: "Gerenciar todas as escolas",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-classes",
          name: "Gerenciar todas as turmas",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "school-reports",
          name: "Gerenciar relatórios de escolas",
          permissions: { view: true }
        },
        {
          id: "import-export-teaching",
          name: "Exportar/importar dados",
          permissions: { view: true, add: true }
        }
      ]
    },
    {
      id: "financeiro",
      name: "Módulo Financeiro",
      icon: DollarSign,
      sections: [
        {
          id: "manage-transactions",
          name: "Gerenciar transações",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "financial-reports",
          name: "Gerenciar relatórios",
          permissions: { view: true }
        },
        {
          id: "financial-categories",
          name: "Gerenciar categorias",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-accounts",
          name: "Gerenciar contas",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-contacts",
          name: "Gerenciar contatos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "cost-centers",
          name: "Gerenciar centros de custos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "import-export-financial",
          name: "Exportar/importar dados",
          permissions: { view: true, add: true }
        }
      ]
    },
    {
      id: "patrimonio",
      name: "Módulo Patrimônio",
      icon: Package,
      sections: [
        {
          id: "manage-items",
          name: "Gerenciar todos os itens",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "asset-categories",
          name: "Gerenciar categorias",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-locations",
          name: "Gerenciar locais",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "asset-reports",
          name: "Gerenciar relatórios",
          permissions: { view: true }
        },
        {
          id: "import-export-assets",
          name: "Exportar/importar dados",
          permissions: { view: true, add: true }
        }
      ]
    },
    {
      id: "agenda",
      name: "Módulo Agenda",
      icon: Calendar,
      sections: [
        {
          id: "manage-calendar",
          name: "Gerenciar calendário",
          permissions: { edit: true, add: true, remove: true }
        },
        {
          id: "calendar-categories",
          name: "Gerenciar categorias de calendário",
          permissions: { edit: true, add: true, remove: true }
        },
        {
          id: "manage-board",
          name: "Gerenciar mural",
          permissions: { edit: true, add: true, remove: true }
        },
        {
          id: "manage-events",
          name: "Gerenciar todos os eventos",
          permissions: { view: true, edit: true, add: true, remove: true }
        }
      ]
    },
    {
      id: "midias",
      name: "Módulo Mídias",
      icon: ImageIcon,
      sections: [
        {
          id: "manage-photos",
          name: "Gerenciar todas as fotos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-photo-albums",
          name: "Gerenciar todos os álbuns de fotos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-videos",
          name: "Gerenciar todos os vídeos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-video-albums",
          name: "Gerenciar todos os álbuns de vídeos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "document-templates",
          name: "Gerenciar modelos de documentos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-files",
          name: "Gerenciar todos os arquivos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-folders",
          name: "Gerenciar todas as pastas de arquivos",
          permissions: { view: true, edit: true, add: true, remove: true }
        },
        {
          id: "manage-forms",
          name: "Gerenciar todos os formulários",
          permissions: { view: true, edit: true, add: true, remove: true }
        }
      ]
    }
  ]

  const [permissions, setPermissions] = useState(modules)

  const togglePermission = (moduleId: string, sectionId: string, permission: string) => {
    setPermissions(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          sections: module.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                permissions: {
                  ...section.permissions,
                  [permission]: !section.permissions[permission as keyof typeof section.permissions]
                }
              }
            }
            return section
          })
        }
      }
      return module
    }))
  }

  const filteredModules = permissions.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.sections.some(section => 
      section.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg text-white">
                <Shield className="h-6 w-6" />
              </div>
              Gerenciamento de Permissões
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure permissões detalhadas por módulo e perfil de usuário
            </p>
          </div>
          <Button className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold shadow-lg">
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar módulos ou permissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="border-2 border-amber-200/50 dark:border-amber-800/30">
          <CardHeader className="bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 border-b border-amber-200/30 dark:border-amber-800/20">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              Super Administrador
            </CardTitle>
            <CardDescription>
              Acesso completo a todos os módulos e funcionalidades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="multiple" className="w-full">
              {filteredModules.map((module, idx) => (
                <AccordionItem 
                  key={module.id} 
                  value={module.id}
                  className={idx === filteredModules.length - 1 ? "border-b-0" : ""}
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 group-hover:from-amber-200 group-hover:to-yellow-200 dark:group-hover:from-amber-800/30 dark:group-hover:to-yellow-800/30 transition-colors">
                        <module.icon className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{module.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {module.sections.length} seções disponíveis
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 bg-muted/20">
                    <div className="space-y-4 pt-2">
                      {module.sections.map((section) => (
                        <div 
                          key={section.id}
                          className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Label className="font-semibold text-base">
                              {section.name}
                            </Label>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(section.permissions).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <Switch
                                  id={`${section.id}-${key}`}
                                  checked={value}
                                  onCheckedChange={() => togglePermission(module.id, section.id, key)}
                                  className="data-[state=checked]:bg-amber-600"
                                />
                                <Label
                                  htmlFor={`${section.id}-${key}`}
                                  className="text-sm capitalize cursor-pointer"
                                >
                                  {key === 'view' && 'Ver'}
                                  {key === 'edit' && 'Editar'}
                                  {key === 'add' && 'Adicionar'}
                                  {key === 'remove' && 'Remover'}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/10 rounded-lg p-6 border-2 border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-600 rounded-lg text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Sobre as Permissões</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                O sistema de permissões permite um controle granular sobre o acesso de cada usuário. 
                Configure cuidadosamente as permissões de acordo com as responsabilidades de cada perfil.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong className="text-foreground">Ver:</strong> Visualizar informações e dados</li>
                <li><strong className="text-foreground">Editar:</strong> Modificar informações existentes</li>
                <li><strong className="text-foreground">Adicionar:</strong> Criar novos registros</li>
                <li><strong className="text-foreground">Remover:</strong> Excluir registros existentes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
