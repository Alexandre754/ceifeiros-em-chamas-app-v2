"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  BookOpen,
  Heart,
  Loader2,
  Video,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Clock3,
  MapPin,
  Plus,
  Church,
  LayoutDashboard,
} from "lucide-react"
import { EventSlider } from "@/components/EventSlider"
import { BannerSlider } from "@/components/BannerSlider"
import { AddEventDialog } from "@/components/AddEventDialog"

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
  congregation?: {
    id: number
    name: string
    city: string
    state: string
  } | null
  creator?: {
    id: number
    name: string
    email: string
  }
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
    label: "Transmissão ao Vivo",
    desc: "Facebook e Instagram",
    color: "from-red-500 to-rose-600",
    background: "bg-red-50 dark:bg-red-950/30",
    badge: "AO VIVO",
  },
  {
    href: "/dashboard/members",
    icon: Users,
    label: "Membros",
    desc: "Gerenciar cadastros",
    color: "from-violet-500 to-purple-600",
    background: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    href: "/dashboard/finance",
    icon: DollarSign,
    label: "Finanças",
    desc: "Dízimos e ofertas",
    color: "from-emerald-500 to-teal-600",
    background: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    href: "/dashboard/events",
    icon: Calendar,
    label: "Eventos",
    desc: "Agenda e cultos",
    color: "from-blue-500 to-indigo-600",
    background: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    href: "/dashboard/sermons",
    icon: BookOpen,
    label: "Sermões",
    desc: "Biblioteca de mensagens",
    color: "from-amber-500 to-orange-600",
    background: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    href: "/dashboard/community",
    icon: Heart,
    label: "Comunidade",
    desc: "Pedidos de oração",
    color: "from-pink-500 to-rose-600",
    background: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    href: "/dashboard/donations",
    icon: Heart,
    label: "Doações Online",
    desc: "Contribuições digitais",
    color: "from-teal-500 to-cyan-600",
    background: "bg-teal-50 dark:bg-teal-950/30",
  },
]

const stats = [
  {
    label: "Total de Membros",
    value: "1.234",
    description: "+12 este mês",
    icon: Users,
    color: "text-violet-600",
    background: "bg-violet-100 dark:bg-violet-950/50",
    trend: true,
  },
  {
    label: "Receita Mensal",
    value: "R$ 45.230",
    description: "+8% do mês anterior",
    icon: DollarSign,
    color: "text-emerald-600",
    background: "bg-emerald-100 dark:bg-emerald-950/50",
    trend: true,
  },
  {
    label: "Eventos Este Mês",
    value: "18",
    description: "8 cultos, 10 células",
    icon: Calendar,
    color: "text-blue-600",
    background: "bg-blue-100 dark:bg-blue-950/50",
    trend: false,
  },
  {
    label: "Crescimento Anual",
    value: "+15%",
    description: "Comparado ao ano passado",
    icon: TrendingUp,
    color: "text-amber-600",
    background: "bg-amber-100 dark:bg-amber-950/50",
    trend: true,
  },
]

function formatEventDate(date: string) {
  if (!date) return { day: "--", month: "---" }

  const parsed = new Date(`${date}T12:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return { day: "--", month: "---" }
  }

  return {
    day: parsed.getDate().toString().padStart(2, "0"),
    month: parsed
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingBanners, setIsLoadingBanners] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/dashboard")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return

    fetchEvents()
    fetchBanners()
  }, [user])

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true)

      const token = localStorage.getItem("bearer_token")

      if (!token) {
        setFeaturedEvents([])
        return
      }

      const response = await fetch("/api/events?limit=6", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Não foi possível carregar os eventos.")
      }

      const data = await response.json()
      setFeaturedEvents(data.events || [])
    } catch (error) {
      console.error("Erro ao buscar eventos:", error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const fetchBanners = async () => {
    try {
      setIsLoadingBanners(true)

      const response = await fetch("/api/banners?limit=5")

      if (!response.ok) {
        throw new Error("Não foi possível carregar os banners.")
      }

      const data = await response.json()
      setBanners(data.banners || [])
    } catch (error) {
      console.error("Erro ao buscar banners:", error)
    } finally {
      setIsLoadingBanners(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Preparando seu painel...
          </p>
        </div>
      </div>
    )
  }

  const sliderEvents = featuredEvents.map((event) => ({
    id: event.id.toString(),
    title: event.title,
    description: event.description,
    startDate: `${event.startDate}T${event.startTime}`,
    endDate: `${event.endDate}T${event.endTime}`,
    mediaUrl:
      event.mediaUrl ||
      "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80",
    mediaType: (event.mediaType as "image" | "video") || "image",
    location: event.location || undefined,
  }))

  const firstName = user.name?.split(" ")[0] || "Usuário"
  const hour = new Date().getHours()

  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1600px] space-y-7 pb-10">

        {/* CABEÇALHO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                SISTEMA DE GESTÃO IPCECMA
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  {greeting}, {firstName}!
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Painel de Controle
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Gerencie sua igreja, acompanhe atividades e mantenha tudo
                  organizado em um só lugar.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="capitalize">{today}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl bg-background/80"
                onClick={() => router.push("/dashboard/events")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Ver agenda
              </Button>

              <AddEventDialog onEventAdd={fetchEvents} />
            </div>
          </div>
        </section>

        {/* INDICADORES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Visão geral
              </h2>
              <p className="text-sm text-muted-foreground">
                Indicadores do sistema
              </p>
            </div>

            <Badge variant="outline" className="rounded-full px-3 py-1">
              <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
              Resumo
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <Card
                  key={stat.label}
                  className="group overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.background}`}
                      >
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>

                      {stat.trend && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <ArrowUpRight className="h-3 w-3" />
                          Positivo
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>

                      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {stat.value}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* BANNERS */}
        {isLoadingBanners ? (
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        ) : banners.length > 0 ? (
          <section className="overflow-hidden rounded-2xl">
            <BannerSlider banners={banners} />
          </section>
        ) : null}

        {/* VERSÍCULO */}
        <section className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-card to-primary/5 p-6 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-card dark:to-primary/10 sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <BookOpen className="h-6 w-6" />
            </div>

            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                Palavra do dia
              </p>

              <blockquote className="mt-3 text-base font-medium leading-relaxed text-foreground sm:text-lg">
                “Porque Deus amou o mundo de tal maneira que deu o seu Filho
                unigênito, para que todo aquele que nele crê não pereça, mas
                tenha a vida eterna.”
              </blockquote>

              <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
                João 3:16
              </p>
            </div>
          </div>
        </section>

        {/* EVENTOS EM DESTAQUE */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Eventos em destaque
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe os próximos eventos da igreja
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => router.push("/dashboard/events")}
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {isLoadingEvents ? (
            <div className="h-52 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <EventSlider
              events={sliderEvents}
              onEventClick={() => router.push("/dashboard/events")}
            />
          )}
        </section>

        {/* ACESSO RÁPIDO */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Acesso rápido
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse os principais módulos da administração
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group block outline-none"
                >
                  <Card className="relative h-full overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary">
                    <CardContent className="relative flex items-center gap-4 p-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} shadow-sm transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {action.label}
                          </h3>

                          {action.badge && (
                            <Badge className="h-5 rounded-full border-0 bg-red-600 px-2 text-[9px] font-bold text-white">
                              <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                              {action.badge}
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {action.desc}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* PRÓXIMOS EVENTOS */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Próximos eventos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Programação e compromissos da igreja
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-primary hover:bg-primary/10"
              onClick={() => router.push("/dashboard/events")}
            >
              <Plus className="mr-1 h-4 w-4" />
              Novo evento
            </Button>
          </div>

          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-0">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : featuredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Calendar className="h-7 w-7 text-primary" />
                  </div>

                  <h3 className="font-semibold text-foreground">
                    Nenhum evento programado
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Quando novos eventos forem cadastrados, eles aparecerão
                    aqui.
                  </p>

                  <Button
                    size="sm"
                    className="mt-4 rounded-xl"
                    onClick={() => router.push("/dashboard/events")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Acessar eventos
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {featuredEvents.slice(0, 5).map((event) => {
                    const date = formatEventDate(event.startDate)

                    return (
                      <div
                        key={event.id}
                        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-6"
                      >
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-primary/10 bg-primary/5">
                          <span className="text-xl font-bold leading-none text-primary">
                            {date.day}
                          </span>

                          <span className="mt-1 text-[9px] font-bold tracking-wider text-primary/70">
                            {date.month}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            {event.title}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {event.startTime || "Horário não informado"}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Church className="h-3.5 w-3.5" />
                              {event.congregation?.name || "Congregação"}
                            </span>

                            {event.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 rounded-xl text-primary hover:bg-primary/10"
                          onClick={() => router.push("/dashboard/events")}
                        >
                          Ver
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RODAPÉ */}
        <footer className="border-t border-border/60 pt-5">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <p>
              <span className="font-semibold text-foreground">IPCECMA</span>
              {" "}· Sistema de Gestão
            </p>

            <p>
              Organização, cuidado e excelência no serviço do Reino.
            </p>
          </div>
        </footer>

      </main>
    </DashboardLayout>
  )
}