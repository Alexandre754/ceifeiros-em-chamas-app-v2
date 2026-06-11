"use client"

import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  TrendingUp,
  Copy,
  CheckCircle2
} from "lucide-react"
import { useState } from "react"

const recentDonations = [
  { id: 1, donor: "Anônimo", amount: 500, date: "2024-12-10", method: "PIX" },
  { id: 2, donor: "Maria Santos", amount: 200, date: "2024-12-09", method: "Cartão" },
  { id: 3, donor: "João Silva", amount: 1000, date: "2024-12-08", method: "Transferência" },
  { id: 4, donor: "Anônimo", amount: 150, date: "2024-12-07", method: "PIX" },
]

export default function DonationsPage() {
  const [copiedPix, setCopiedPix] = useState(false)

  const handleCopyPix = () => {
    navigator.clipboard.writeText("igreja.ipcecma@pix.com.br")
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Doações Online</h1>
          <p className="text-muted-foreground">
            Configure formas de receber contribuições digitais
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Este Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 12.450</div>
              <p className="text-xs text-muted-foreground">+18% do mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Doadores</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Doação Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 140</div>
              <p className="text-xs text-muted-foreground">Por doador</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Doações Recorrentes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">Mensais ativas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="quick-donate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quick-donate">Doação Rápida</TabsTrigger>
            <TabsTrigger value="methods">Métodos de Pagamento</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="transparency">Transparência</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-donate">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Doar via PIX
                  </CardTitle>
                  <CardDescription>
                    Forma rápida e segura de contribuir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center p-8 bg-muted rounded-lg">
                    <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                      <QrCode size={180} className="text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <div className="flex gap-2">
                      <Input value="igreja.ipcecma@pix.com.br" readOnly />
                      <Button onClick={handleCopyPix} variant="outline" size="icon">
                        {copiedPix ? <CheckCircle2 size={20} className="text-green-600" /> : <Copy size={20} />}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-semibold mb-1">💡 Como doar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Abra o app do seu banco</li>
                      <li>Escaneie o QR Code ou copie a chave PIX</li>
                      <li>Confirme o valor da doação</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Doar com Cartão
                  </CardTitle>
                  <CardDescription>
                    Aceito cartões de crédito e débito
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor da Doação (R$)</Label>
                    <Input id="amount" type="number" placeholder="100,00" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="h-auto py-3 flex-col">
                      <span className="text-2xl font-bold">R$ 50</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex-col">
                      <span className="text-2xl font-bold">R$ 100</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex-col">
                      <span className="text-2xl font-bold">R$ 200</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Doação</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-auto py-3">
                        <div className="text-center">
                          <div className="font-semibold">Única</div>
                          <div className="text-xs text-muted-foreground">Uma vez</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto py-3">
                        <div className="text-center">
                          <div className="font-semibold">Mensal</div>
                          <div className="text-xs text-muted-foreground">Recorrente</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    <Heart className="mr-2" size={20} />
                    Fazer Doação
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Pagamento seguro e criptografado
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento Configurados</CardTitle>
                <CardDescription>Formas disponíveis para receber doações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">PIX</h4>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Chave: igreja.ipcecma@pix.com.br
                    </p>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Cartão de Crédito</h4>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Integração: Stripe Payment
                    </p>
                    <Button variant="outline" size="sm">Configurar</Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Transferência Bancária</h4>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Banco do Brasil - Ag: 1234-5
                    </p>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-card opacity-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <h4 className="font-semibold">Boleto Bancário</h4>
                      </div>
                      <Badge variant="outline">Inativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Não configurado
                    </p>
                    <Button variant="outline" size="sm">Ativar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Doações</CardTitle>
                <CardDescription>Últimas contribuições recebidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Heart size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{donation.donor}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(donation.date).toLocaleDateString('pt-BR')} • {donation.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          + R$ {donation.amount.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transparency">
            <Card>
              <CardHeader>
                <CardTitle>Transparência no Uso das Doações</CardTitle>
                <CardDescription>
                  Mostramos como cada real doado é utilizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">Distribuição dos Recursos</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Manutenção do Templo</span>
                        <span className="font-semibold">35%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Ação Social</span>
                        <span className="font-semibold">25%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Missões e Evangelismo</span>
                        <span className="font-semibold">20%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Eventos e Cultos</span>
                        <span className="font-semibold">15%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Outros</span>
                        <span className="font-semibold">5%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">💚 Compromisso com a Transparência</h4>
                  <p className="text-sm text-muted-foreground">
                    Todas as doações são registradas e utilizadas de acordo com os princípios bíblicos 
                    de mordomia. Relatórios financeiros detalhados estão disponíveis mensalmente para 
                    todos os membros da igreja.
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
