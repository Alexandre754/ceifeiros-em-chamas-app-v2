"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Plus, Loader2, Share2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Post {
  id: number
  congregationId: number
  userId: number
  type: string
  title: string
  content: string
  prayersCount: number
  likesCount: number
  commentsCount: number
  status: string
  createdAt: string
  updatedAt: string
  congregation: {
    id: number
    name: string
    city: string
    state: string
  }
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("prayer")
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [congregations, setCongregations] = useState<any[]>([])
  const [selectedCongregation, setSelectedCongregation] = useState("")

  useEffect(() => {
    fetchPosts()
    fetchCongregations()
  }, [activeTab])

  const fetchCongregations = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/congregations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCongregations(data)
        if (user?.congregationId) {
          setSelectedCongregation(user.congregationId.toString())
        } else if (data.length > 0) {
          setSelectedCongregation(data[0].id.toString())
        }
      }
    } catch (error) {
      console.error('Erro ao buscar congregações:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        toast.error("Você precisa estar autenticado")
        return
      }

      const response = await fetch(`/api/community?type=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar posts')
      }

      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error: any) {
      console.error('Erro ao buscar posts:', error)
      toast.error(error.message || "Erro ao carregar posts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPostContent.trim()) {
      toast.error("Por favor, escreva algo")
      return
    }

    if (!selectedCongregation) {
      toast.error("Selecione uma congregação")
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          congregationId: parseInt(selectedCongregation),
          type: activeTab,
          title: newPostTitle || (activeTab === 'prayer' ? 'Pedido de Oração' : 'Testemunho'),
          content: newPostContent
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar post')
      }

      toast.success("Publicado com sucesso!")
      setNewPostTitle("")
      setNewPostContent("")
      fetchPosts()
    } catch (error: any) {
      console.error('Erro ao criar post:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIncrement = async (postId: number, field: 'prayers' | 'likes') => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/community/${postId}/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ field })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar')
      }

      fetchPosts()
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message)
    }
  }

  const handleShareWhatsApp = (post: Post) => {
    const message = `*${post.type === 'prayer' ? '🙏 Pedido de Oração' : '✝️ Testemunho'}*\n\n${post.content}\n\n_Compartilhado por ${post.user.name} - ${post.congregation.name}_`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    
    // Open in new window (works in iframe)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    toast.success("Abrindo WhatsApp...")
  }

  const prayerPosts = posts.filter(p => p.type === 'prayer')
  const testimonyPosts = posts.filter(p => p.type === 'testimony')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Comunidade</h1>
          <p className="text-muted-foreground">
            Compartilhe pedidos de oração e testemunhos
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pedidos de Oração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prayerPosts.length}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Testemunhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testimonyPosts.length}</div>
              <p className="text-xs text-muted-foreground">Compartilhados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + p.prayersCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Curtidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + p.likesCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="prayer">Pedidos de Oração</TabsTrigger>
            <TabsTrigger value="testimony">Testemunhos</TabsTrigger>
            <TabsTrigger value="forum">Fórum</TabsTrigger>
          </TabsList>

          <TabsContent value="prayer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Novo Pedido de Oração</CardTitle>
                <CardDescription>Compartilhe sua necessidade com a igreja</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Congregação *</Label>
                    <Select
                      value={selectedCongregation}
                      onValueChange={setSelectedCongregation}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a congregação" />
                      </SelectTrigger>
                      <SelectContent>
                        {congregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id.toString()}>
                            {cong.name} - {cong.city}/{cong.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea 
                    placeholder="Compartilhe seu pedido de oração..."
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" className="gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Publicar Pedido
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : prayerPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum pedido de oração ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prayerPosts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{post.user.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {post.congregation.name} • {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge>Pedido de Oração</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground">{post.content}</p>
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleIncrement(post.id, 'prayers')}
                        >
                          <Heart size={16} />
                          {post.prayersCount} orações
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageCircle size={16} />
                          {post.commentsCount} comentários
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 ml-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleShareWhatsApp(post)}
                        >
                          <Share2 size={16} />
                          Compartilhar no WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="testimony" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compartilhar Testemunho</CardTitle>
                <CardDescription>Conte como Deus tem agido em sua vida</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Congregação *</Label>
                    <Select
                      value={selectedCongregation}
                      onValueChange={setSelectedCongregation}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a congregação" />
                      </SelectTrigger>
                      <SelectContent>
                        {congregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id.toString()}>
                            {cong.name} - {cong.city}/{cong.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Título do testemunho"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Textarea 
                    placeholder="Compartilhe seu testemunho..."
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" className="gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Publicar Testemunho
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : testimonyPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum testemunho ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {testimonyPosts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{post.user.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {post.congregation.name} • {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge variant="secondary">Testemunho</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {post.title && <h3 className="text-xl font-semibold">{post.title}</h3>}
                      <p className="text-foreground">{post.content}</p>
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleIncrement(post.id, 'likes')}
                        >
                          <Heart size={16} />
                          {post.likesCount} glorificaram a Deus
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageCircle size={16} />
                          {post.commentsCount} comentários
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 ml-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleShareWhatsApp(post)}
                        >
                          <Share2 size={16} />
                          Compartilhar no WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="forum">
            <Card>
              <CardHeader>
                <CardTitle>Fórum da Comunidade</CardTitle>
                <CardDescription>Em breve - Discussões e temas diversos</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}