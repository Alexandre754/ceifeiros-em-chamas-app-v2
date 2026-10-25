"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  role: string
  congregationId: number | null
  congregation?: {
    id: number
    name: string
    isHeadquarters: boolean
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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
        setUser(data.user)
      } else {
        localStorage.removeItem('bearer_token')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      localStorage.removeItem('bearer_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    localStorage.setItem('bearer_token', data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('bearer_token')
    setUser(null)
    router.push('/login')
  }

  const hasPermission = (requiredRole?: string) => {
    if (!user) return false
    if (user.role === 'admin_geral') return true
    if (requiredRole) {
      return user.role === requiredRole
    }
    return true
  }

  const canViewAllCongregations = () => {
    if (!user) return false
    return user.role === 'admin_geral' || 
           (user.role === 'admin_sede' && user.congregation?.isHeadquarters === true)
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    hasPermission,
    canViewAllCongregations
  }
}
