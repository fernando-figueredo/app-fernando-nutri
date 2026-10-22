import React, { createContext, useContext, useEffect, useState } from "react"
import {
  authClient,
  type AuthUser,
  type AuthSession,
  saveLocalSession,
  getLocalSession,
  clearLocalSession,
  syncNutricionistaToDatabase,
  formatAuthError,
  NEON_AUTH_URL,
} from "@/lib/auth-client"

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa já com a sessão local se existir, evitando flash de deslogado
  const [session, setSession] = useState<AuthSession | null>(() => getLocalSession())
  const [user, setUser] = useState<AuthUser | null>(() => getLocalSession()?.user || null)
  const [isLoading, setIsLoading] = useState(true)

  // Verifica a sessão atual com o Neon Auth ao montar
  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const { data, error } = await authClient.getSession()

        if (!isMounted) return

        if (data && data.user) {
          // Tenta obter o JWT assinado para a Data API
          let token: string | undefined = (data as any)?.session?.token || (data as any)?.token
          try {
            const tokenRes = await (authClient as any).token?.()
            if (tokenRes?.data?.token) {
              token = tokenRes.data.token
            }
          } catch {
            // Continua com o token de sessão padrão se falhar
          }

          const authUser: AuthUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            createdAt: data.user.createdAt ? String(data.user.createdAt) : undefined,
          }
          const newSession: AuthSession = {
            user: authUser,
            token,
            expiresAt: (data as any)?.session?.expiresAt,
          }
          setUser(authUser)
          setSession(newSession)
          saveLocalSession(newSession)
        } else if (error) {
          // Se falhou e não temos sessão local válida
          if (!getLocalSession()) {
            setUser(null)
            setSession(null)
            clearLocalSession()
          }
        }
      } catch (err) {
        console.warn("Aviso ao validar sessão no Neon Auth:", err)
        // Mantém sessão local se existir, caso seja falha de rede temporária
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  // Login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Chamar signIn do better-auth com Origin
      const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || data.error || (data.code && data.code !== "OK")) {
        const errMessage = formatAuthError(data.error || data)
        return { success: false, error: errMessage }
      }

      // Extrai dados do usuário e token
      const loggedUser: AuthUser = {
        id: data.user?.id || data.id,
        name: data.user?.name || data.name || email.split("@")[0],
        email: data.user?.email || data.email || email,
      }

      let token = data.token || data.session?.token || response.headers.get("set-auth-jwt") || undefined
      try {
        const tokenRes = await (authClient as any).token?.()
        if (tokenRes?.data?.token) {
          token = tokenRes.data.token
        }
      } catch {
        // Fallback
      }

      const newSession: AuthSession = {
        user: loggedUser,
        token,
        expiresAt: data.session?.expiresAt,
      }

      setUser(loggedUser)
      setSession(newSession)
      saveLocalSession(newSession)

      // Garante sincronização com a tabela nutricionistas do Neon
      syncNutricionistaToDatabase(loggedUser, token)

      return { success: true }
    } catch (err: any) {
      console.error("Erro no login:", err)
      return { success: false, error: formatAuthError(err) }
    }
  }

  // Cadastro
  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Chamar sign-up do better-auth
      const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok || data.error || (data.code && data.code !== "OK")) {
        const errMessage = formatAuthError(data.error || data)
        return { success: false, error: errMessage }
      }

      const createdUser: AuthUser = {
        id: data.user?.id || data.id,
        name: data.user?.name || data.name || name,
        email: data.user?.email || data.email || email,
      }

      let token = data.token || data.session?.token || response.headers.get("set-auth-jwt") || undefined
      try {
        const tokenRes = await (authClient as any).token?.()
        if (tokenRes?.data?.token) {
          token = tokenRes.data.token
        }
      } catch {
        // Fallback
      }

      const newSession: AuthSession = {
        user: createdUser,
        token,
        expiresAt: data.session?.expiresAt,
      }

      setUser(createdUser)
      setSession(newSession)
      saveLocalSession(newSession)

      // Regra importante: Salvar o nome e email do nutricionista na tabela nutricionistas do Neon
      await syncNutricionistaToDatabase(createdUser, token)

      return { success: true }
    } catch (err: any) {
      console.error("Erro no cadastro:", err)
      return { success: false, error: formatAuthError(err) }
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await fetch(`${NEON_AUTH_URL}/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        credentials: "include",
        body: JSON.stringify({}),
      })
    } catch (e) {
      console.warn("Aviso ao deslogar no servidor:", e)
    } finally {
      setUser(null)
      setSession(null)
      clearLocalSession()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider")
  }
  return context
}
