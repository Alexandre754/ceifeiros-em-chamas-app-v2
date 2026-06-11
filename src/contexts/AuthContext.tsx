"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: 'admin_geral' | 'admin_sede' | 'admin_congregacao' | 'membro'
  congregationId: number | null
  hasGeneralAccess: boolean
  congregation?: {
    id: number
    name: string
    city: string
    state: string
    address: string | null
    isHeadquarters: boolean
  } | null
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Verificar sessão ao carregar
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Sessão verificada, usuário:', data.user.name)
        setUser(data.user)
      } else {
        // Token inválido
        console.log('❌ Token inválido, removendo...')
        localStorage.removeItem('bearer_token')
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      localStorage.removeItem('bearer_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    console.log('🔵 AuthContext: Iniciando login para:', email)
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ AuthContext: Erro na resposta de login:', error)
      throw new Error(error.error || 'Erro ao fazer login')
    }

    const data = await response.json()
    console.log('✅ AuthContext: Login bem-sucedido, salvando token...')
    console.log('🔑 Token recebido:', data.token.substring(0, 20) + '...')
    
    // Salvar token IMEDIATAMENTE
    localStorage.setItem('bearer_token', data.token)
    console.log('✅ Token salvo no localStorage')
    
    // Verificar se foi realmente salvo
    const savedToken = localStorage.getItem('bearer_token')
    console.log('🔍 Verificando token salvo:', savedToken ? savedToken.substring(0, 20) + '...' : 'NENHUM TOKEN!')
    
    // Atualizar user
    setUser(data.user)
    console.log('✅ AuthContext: Usuário definido:', data.user.name)
  }

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    phone: string
  ) => {
    console.log('🔵 AuthContext: Iniciando cadastro para:', email)
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name, 
        email, 
        password, 
        phone
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ AuthContext: Erro no cadastro:', error)
      throw new Error(error.error || 'Erro ao cadastrar')
    }
    
    console.log('✅ AuthContext: Cadastro realizado com sucesso')
  }

  const logout = async () => {
    try {
      console.log('🔵 AuthContext: Iniciando logout...')
      const token = localStorage.getItem('bearer_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      console.log('✅ AuthContext: Removendo token e redirecionando...')
      localStorage.removeItem('bearer_token')
      setUser(null)
      router.push('/login')
    }
  }

  const refreshUser = async () => {
    console.log('🔵 AuthContext: Atualizando dados do usuário...')
    await checkSession()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}