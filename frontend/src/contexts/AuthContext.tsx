import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import apiService from '../services/api.service'

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
        setLoading(false)
        // Silently verify in background — only clear if 401 (not network error)
        try {
          const response = await apiService.checkAuth()
          if (response?.user) {
            setUser(response.user)
            localStorage.setItem('user', JSON.stringify(response.user))
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            setUser(null)
            localStorage.removeItem('user')
          }
          // Any other error (network, 404, etc.) — keep the stored user
        }
        return
      }

      // No stored user — check backend
      try {
        const response = await apiService.checkAuth()
        if (response?.user) {
          setUser(response.user)
          localStorage.setItem('user', JSON.stringify(response.user))
        }
      } catch {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (newUser: User) => {
    // Backend sets cookie, we just store user data
    localStorage.setItem('user', JSON.stringify(newUser))
    setUser(newUser)
  }

  const logout = async () => {
    try {
      // Try to call backend to clear cookie
      // This will fail if backend endpoint doesn't exist yet - that's OK
      await apiService.logout()
    } catch (error) {
      console.log('Logout endpoint not ready - clearing local data only')
    } finally {
      // Always clear local data
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
