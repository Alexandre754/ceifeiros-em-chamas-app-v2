"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users, DollarSign, Calendar, TrendingUp, BookOpen, Heart, Loader2, Video,
  ArrowUpRight, ChevronRight, Sparkles, Church, Package
} from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { EventSlider } from "@/components/EventSlider"
import { BannerSlider } from "@/components/BannerSlider"
import { AddEventDialog } from "@/components/AddEventDialog"
import { toast } from "sonner"

interface Event {
  id: number
  congregationId: number
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string | null
  mediaUrl: string | null
  mediaType: string | null
  category: string | null
  attendance: number | null
  createdBy: number
  status: string
  createdAt: string
  updatedAt: string
  congregation: { id: number; name: string; city: string; state: string }
  creator: { id: number; name: string; email: string }
}

interface Banner {
  id: number
  title: string
  description: string | null
  imageUrl: string
  linkUrl: string | null
  order: number
  active: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

const quickActions = [
  {
    href: "/dashboard/live",
    icon: Video,
    label: "Transmitir ao Vivo",
    desc: "Facebook e Instagram simultâneo",
    color: "from-red-500 to-rose-600",
    badge: "MULTI",
    badgeColor: "bg-red-500",
    pulse: true,
  },
  {
    href: "/dashboard/members",
    icon: Users,
    label: "Membros",
    desc: "Gerenciar cadastros",
    color: "from-violet-500 to-purple-600",
  },
  {
    href: "/dashboard/finance",
    icon: DollarSign,
    label: "Finanças",
    desc: "Dízimos e ofertas",
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/dashboard/events",
    icon: Calendar,
    label: "Eventos",
    desc: "Agenda e cultos",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/dashboard/sermons",
    icon: BookOpen,
    label: "Sermões",
    desc: "Biblioteca de mensagens",
    color: "from-amber-500 to-orange-600",
  },
  {
    href: "/dashboard/community",
    icon: Heart,
    label: "Comunidade",
    desc: "Pedidos de oração",
    color: "from-pink-500 to-rose-600",
  },
  {
    href: "/dashboard/donations",
    icon: Heart,
    label: "Doações Online",
    desc: "Contribuições digitais",
    color: "from-teal-500 to-cyan-600",
  },
]

const stats = [
  { label: "Total de Membros", value: "1.234", change: "+12 este mês", icon: Users, trend: "up" },
  { label: "Receita Mensal", value: "R$ 45.230", change: "+8% do mês anterior", icon: DollarSign, trend: "up" },
  { label: "Eventos Este Mês", value: "18", change: "8 cultos, 10 células", icon: Calendar, trend: "neutral" },
  { label: "Crescimento Anual", value: "+15%", change: "comparado ao ano passado", icon: TrendingUp, trend: "up" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingBanners, setIsLoadingBanners] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) router.push("/login?redirect=/dashboard")
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchEvents()
      fetchBanners()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) return
      const response = await fetch('/api/events?limit=6', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFeaturedEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const fetchBanners = async () => {
    try {
      setIsLoadingBanners(true)
      const response = await fetch('/api/banners?limit=5')
      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setIsLoadingBanners(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const sliderEvents = featuredEvents.map(event => ({
    id: event.id.toString(),
    title: event.title,
    description: event.description,
    startDate: `${event.startDate}T${event.startTime}`,
    endDate: `${event.endDate}T${event.endTime}`,
    mediaUrl: event.mediaUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
    mediaType: (event.mediaType as "image" | "video") || "image",
    location: event.location || undefined
  }))

  const firstName = user.name?.split(' ')[0] || "Usuário"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary/60" />
              <span className="text-sm text-muted-foreground font-medium">{greeting}, {firstName}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Painel de Controle</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo ao sistema de gestão da <span className="font-semibold text-primary">IPCECMA</span>
            </p>
          </div>
          <AddEventDialog onEventAdd={fetchEvents} />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="card-hover border-border/50 bg-card shadow-sm hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon size={18} className="text-primary" />
                    </div>
                    {stat.trend === "up" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                        <ArrowUpRight size={11} />
                        Alta
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[13px] text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Banner Slider */}
        {isLoadingBanners ? (
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        ) : banners.length > 0 ? (
          <BannerSlider banners={banners} />
        ) : null}

        {/* Verse of the Day */}
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-gold/5 p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-primary/70" />
              <span className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Versículo do Dia</span>
            </div>
            <blockquote className="text-base font-medium text-foreground leading-relaxed">
              "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
            </blockquote>
            <cite className="text-sm text-muted-foreground mt-2 block">— João 3:16</cite>
          </div>
        </div>

        {/* Events Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Eventos em Destaque</h2>
              <p className="text-sm text-muted-foreground">Próximos eventos especiais</p>
            </div>
            <Link href="/dashboard/events">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                Ver Todos
                <ChevronRight size={13} />
              </Button>
            </Link>
          </div>

          {isLoadingEvents ? (
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
          ) : (
            <EventSlider
              events={sliderEvents}
              onEventClick={() => router.push('/dashboard/events')}
            />
          )}
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Acesso Rápido</h2>
            <p className="text-sm text-muted-foreground">Principais módulos do sistema</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 card-hover cursor-pointer h-full">
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${action.color} opacity-5 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative">
                      <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${action.color} mb-3 shadow-sm`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{action.label}</h3>
                            {action.badge && (
                              <Badge className={`text-[9px] h-4 px-1.5 ${action.badgeColor} text-white border-0 ${action.pulse ? 'animate-pulse' : ''}`}>
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Upcoming Events List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Próximos Eventos</h2>
          </div>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : featuredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calendar size={32} className="text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum evento programado</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {featuredEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary leading-none">
                          {new Date(event.startDate).getDate()}
                        </span>
                        <span className="text-[10px] text-primary/70 uppercase font-medium">
                          {new Date(event.startDate).toLocaleDateString('pt-BR', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.startTime} · {event.congregation.name}
                        </p>
                      </div>
                      <Link href="/dashboard/events">
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10">
                          Ver
                          <ChevronRight size={12} />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

      </div>
    </DashboardLayout>
  )
}
