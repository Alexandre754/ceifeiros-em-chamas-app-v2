"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [settings, setSettings] = useState({
    churchName: "",
    acronym: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    language: "pt-BR",
    currency: "BRL",
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
    pushNotifications: true,
    birthdayReminders: true,
    eventReminders: true,
    financialReports: true,
  })

  const isAdmin = user?.role === 'admin_geral' || user?.role === 'admin_sede' || user?.role === 'admin_congregacao'

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings({
          churchName: data.churchName || "",
          acronym: data.acronym || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          language: data.language || "pt-BR",
          currency: data.currency || "BRL",
            emailNotifications: data.emailNotifications ?? true,
            smsNotifications: data.smsNotifications ?? false,
            whatsappNotifications: data.whatsappNotifications ?? false,
            pushNotifications: data.pushNotifications ?? true,
          birthdayReminders: data.birthdayReminders ?? true,
          eventReminders: data.eventReminders ?? true,
          financialReports: data.financialReports ?? true,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('bearer_token')
      
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success("Configurações salvas com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar configurações")
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error("Erro ao salvar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais do aplicativo
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informações da Igreja
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da igreja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="churchName">Nome da Igreja</Label>
                    <Input
                      id="churchName"
                      value={settings.churchName}
                      onChange={(e) => setSettings({ ...settings, churchName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acronym">Sigla</Label>
                    <Input
                      id="acronym"
                      value={settings.acronym}
                      onChange={(e) => setSettings({ ...settings, acronym: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Contato</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={settings.state}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Idioma do Sistema</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências de Notificações
                </CardTitle>
                <CardDescription>
                  Configure como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Notificações por E-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações importantes por e-mail
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotifications">Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas importantes via SMS
                      </p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, smsNotifications: checked })
                      }
                    />
                  </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="whatsappNotifications">Notificações por WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações pelo WhatsApp
                        </p>
                      </div>
                      <Switch
                        id="whatsappNotifications"
                        checked={settings.whatsappNotifications}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, whatsappNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotifications">Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações no navegador
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, pushNotifications: checked })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-4">Lembretes Automáticos</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="birthdayReminders">Aniversários de Membros</Label>
                        <p className="text-sm text-muted-foreground">
                          Lembrete de aniversários dos membros
                        </p>
                      </div>
                      <Switch
                        id="birthdayReminders"
                        checked={settings.birthdayReminders}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, birthdayReminders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="eventReminders">Eventos da Igreja</Label>
                        <p className="text-sm text-muted-foreground">
                          Lembrete de eventos e cultos
                        </p>
                      </div>
                      <Switch
                        id="eventReminders"
                        checked={settings.eventReminders}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, eventReminders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="financialReports">Relatórios Financeiros</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba relatórios mensais automáticos
                        </p>
                      </div>
                      <Switch
                        id="financialReports"
                        checked={settings.financialReports}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, financialReports: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Preferências"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança e Permissões
                </CardTitle>
                <CardDescription>
                  Gerencie senhas e permissões de acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAdmin && (
                  <div className="p-6 rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-lg">
                          <Lock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-lg">Alterar Senha</h4>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Como administrador, você pode alterar sua senha de acesso ao sistema. 
                            Mantenha sua senha segura e não compartilhe com terceiros.
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/settings/change-password">
                        <Button className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 gap-2">
                          Alterar Senha
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {!isAdmin && (
                  <div className="p-6 rounded-lg border bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                      <div className="space-y-2">
                        <h4 className="font-semibold">Alterar Senha</h4>
                        <p className="text-sm text-muted-foreground">
                          Apenas administradores podem alterar suas senhas através do sistema.
                          Entre em contato com um administrador para solicitar alteração.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-4">Níveis de Permissão</h4>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Administrador Geral</p>
                          <p className="text-sm text-muted-foreground">Acesso total ao sistema</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Admin Sede</p>
                          <p className="text-sm text-muted-foreground">Acesso a todas congregações</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Admin Congregação</p>
                          <p className="text-sm text-muted-foreground">Acesso apenas à sua congregação</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Membro</p>
                          <p className="text-sm text-muted-foreground">Acesso limitado apenas para visualização</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
                  <p className="font-semibold mb-1">⚠️ Atenção</p>
                  <p className="text-muted-foreground">
                    Mantenha suas credenciais seguras e não compartilhe com terceiros. 
                    Altere sua senha regularmente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup de Dados
                </CardTitle>
                <CardDescription>
                  Configure backups automáticos e restaure dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-semibold">Backup Automático</p>
                      <p className="text-sm text-muted-foreground">
                        Último backup: {new Date().toLocaleDateString('pt-BR')} às 03:00
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequência de Backup</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-semibold">Ações de Backup</h4>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1">
                      <Database className="mr-2 h-4 w-4" />
                      Fazer Backup Agora
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Database className="mr-2 h-4 w-4" />
                      Restaurar Backup
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-semibold mb-1">💡 Dica</p>
                  <p className="text-muted-foreground">
                    Mantenha backups regulares para garantir a segurança dos dados da igreja. 
                    Os backups são armazenados de forma segura e criptografada.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}