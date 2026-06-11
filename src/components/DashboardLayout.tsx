"use client"

import { ReactNode, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Users,
  DollarSign,
  Calendar,
  BookOpen,
  MessageSquare,
  Settings,
  Menu,
  LogOut,
  Church,
  Heart,
  Shield,
  UserCheck,
  Package,
  FileText,
  User,
  Key,
  Image as ImageIcon,
  Video,
  ChevronDown,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { NotificationCenter } from "@/components/NotificationCenter"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/contexts/AuthContext"

const menuItems = [
  { icon: Home, label: "Início", href: "/dashboard", group: "principal" },
  { icon: User, label: "Meu Perfil", href: "/dashboard/profile", group: "principal" },
  { icon: Video, label: "Transmissão ao Vivo", href: "/dashboard/live", group: "principal", badge: "AO VIVO" },
  { icon: Users, label: "Membros", href: "/dashboard/members", group: "gestao" },
  { icon: DollarSign, label: "Finanças", href: "/dashboard/finance", group: "gestao" },
  { icon: Calendar, label: "Eventos", href: "/dashboard/events", group: "gestao" },
  { icon: BookOpen, label: "Sermões", href: "/dashboard/sermons", group: "conteudo" },
  { icon: MessageSquare, label: "Comunidade", href: "/dashboard/community", group: "conteudo" },
  { icon: Church, label: "Congregações", href: "/dashboard/congregations", group: "gestao" },
  { icon: Package, label: "Patrimônio", href: "/dashboard/assets", group: "gestao" },
  { icon: Heart, label: "Doações", href: "/dashboard/donations", group: "gestao" },
  { icon: FileText, label: "Certificados", href: "/dashboard/certificados/batismo", hasSubmenu: true, group: "conteudo" },
  { icon: UserCheck, label: "Aprovações", href: "/dashboard/approvals", group: "admin" },
  { icon: Shield, label: "Usuários", href: "/dashboard/users", group: "admin" },
  { icon: Key, label: "Credenciais", href: "/dashboard/user-credentials", group: "admin" },
  { icon: ImageIcon, label: "Banners", href: "/dashboard/banners", group: "admin" },
  { icon: Shield, label: "Permissões", href: "/dashboard/permissions", group: "admin" },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings", group: "admin" },
]

const certificadosSubmenu = [
  { label: "Certificado de Batismo", href: "/dashboard/certificados/batismo" },
  { label: "Carta de Apresentação", href: "/dashboard/certificados/apresentacao" },
]

const groupLabels: Record<string, string> = {
  principal: "Principal",
  gestao: "Gestão",
  conteudo: "Conteúdo",
  admin: "Administração",
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [certificadosOpen, setCertificadosOpen] = useState(pathname.includes('/certificados'))

  const handleLogout = async () => {
    await logout()
  }

  const userPermissions = (user as any)?.permissions || []
  const isAdminGeral = user?.role === 'admin_geral'
  const isHeadquartersAdmin = user?.role === 'admin_sede' && user?.congregation?.isHeadquarters
  const hasGeneralAccess = user?.hasGeneralAccess === true

  const canSeeAdminItems = isAdminGeral || isHeadquartersAdmin || hasGeneralAccess

  const hasPermission = (href: string) => {
    const publicRoutes = [
      '/dashboard',
      '/dashboard/profile',
      '/dashboard/events',
      '/dashboard/sermons',
      '/dashboard/community',
      '/dashboard/banners',
      '/dashboard/live'
    ]

    if (publicRoutes.includes(href)) return true

    const adminOnlyRoutes = [
      '/dashboard/users',
      '/dashboard/user-credentials',
      '/dashboard/permissions',
      '/dashboard/approvals',
      '/dashboard/settings',
      '/dashboard/congregations'
    ]

    if (adminOnlyRoutes.includes(href)) {
      if (canSeeAdminItems) return true
      if (href.includes('users') && userPermissions.includes('module:users')) return true
      if (href.includes('permissions') && userPermissions.includes('module:permissions')) return true
      if (href.includes('settings') && userPermissions.includes('module:settings')) return true
      if (href.includes('congregations') && userPermissions.includes('module:congregations')) return true
      return false
    }

    if (href.includes('/dashboard/finance') && (canSeeAdminItems || userPermissions.includes('module:finance'))) return true
    if (href.includes('/dashboard/members') && (canSeeAdminItems || userPermissions.includes('module:members'))) return true
    if (href.includes('/dashboard/assets') && (canSeeAdminItems || userPermissions.includes('module:assets'))) return true
    if (href.includes('/dashboard/donations') && (canSeeAdminItems || userPermissions.includes('module:donations'))) return true
    if (href.includes('/dashboard/certificados') && (canSeeAdminItems || userPermissions.includes('module:certificates'))) return true

    return canSeeAdminItems || user?.role !== 'membro'
  }

  const visibleItems = menuItems.filter(item => hasPermission(item.href))

  const getGroupedItems = () => {
    const groups: Record<string, typeof menuItems> = {}
    visibleItems.forEach(item => {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    })
    return groups
  }

  const groupedItems = getGroupedItems()

  const getUserInitials = () => {
    if (!user?.name) return "U"
    return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "bg-sidebar" : "bg-sidebar"}`}>
      {/* Logo Area */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-sidebar-primary/30 bg-white/10 flex-shrink-0">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IPCECMA__2_-removebg-preview-removebg-preview-min-1762377142669.png?width=8000&height=8000&resize=contain"
              alt="IPCECMA"
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-sidebar-primary leading-tight">IPCECMA</h1>
            <p className="text-xs text-sidebar-foreground/50 truncate">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
              {groupLabels[group]}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.hasSubmenu && pathname.includes('/certificados'))

                if (item.hasSubmenu) {
                  return (
                    <div key={item.href}>
                      <button
                        onClick={() => setCertificadosOpen(!certificadosOpen)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md nav-active-shimmer"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={17} className="flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown size={14} className={`flex-shrink-0 transition-transform duration-200 ${certificadosOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {certificadosOpen && (
                        <div className="ml-7 mt-0.5 pl-3 border-l border-sidebar-border/50 space-y-0.5">
                          {certificadosSubmenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => mobile && setMobileMenuOpen(false)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all ${
                                pathname === subItem.href
                                  ? "text-sidebar-primary font-semibold"
                                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                              }`}
                            >
                              <ChevronRight size={12} />
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => mobile && setMobileMenuOpen(false)}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md nav-active-shimmer"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} className="flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {(item as any).badge && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-red-500 text-white border-0 animate-pulse">
                        {(item as any).badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary flex-shrink-0">
            {getUserInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || "Usuário"}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 border-r border-sidebar-border">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-primary/10">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IPCECMA__2_-removebg-preview-removebg-preview-min-1762377142669.png?width=8000&height=8000&resize=contain"
                alt="IPCECMA"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-sm gradient-text-primary">IPCECMA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationCenter />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-60 bg-sidebar border-sidebar-border">
                <Sidebar mobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border items-center justify-between px-8 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary/60" />
            <span className="text-sm text-muted-foreground font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationCenter />
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {getUserInitials()}
              </div>
              <span className="text-sm font-medium text-foreground/80">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <div className="lg:p-8 p-4 pt-20 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
