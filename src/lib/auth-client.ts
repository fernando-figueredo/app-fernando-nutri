import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  "https://ep-flat-forest-b6g38229.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth"

export const NEON_DATA_API_URL =
  import.meta.env.VITE_NEON_DATA_API_URL ||
  "https://ep-flat-forest-b6g38229.apirest.c-2.sa-east-1.aws.neon.tech/neondb/rest/v1"

// Better Auth React Client instance com suporte a JWT
export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
  plugins: [jwtClient()],
  fetchOptions: {
    credentials: "include",
  },
})

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt?: string
}

export interface AuthSession {
  user: AuthUser
  token?: string
  expiresAt?: string
}

const LOCAL_STORAGE_SESSION_KEY = "fernando_nutri_session"

/**
 * Salva a sessão localmente para garantir persistência contínua
 */
export function saveLocalSession(session: AuthSession) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session))
  } catch (e) {
    console.error("Erro ao salvar sessão localmente:", e)
  }
}

/**
 * Recupera sessão salva localmente
 */
export function getLocalSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch (e) {
    console.error("Erro ao carregar sessão local:", e)
    return null
  }
}

/**
 * Limpa a sessão local
 */
export function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
  } catch (e) {
    console.error("Erro ao limpar sessão local:", e)
  }
}

/**
 * Registra ou atualiza explicitamente o nutricionista na tabela public.nutricionistas
 * (Além do trigger automático trg_sync_neon_auth_user no Postgres)
 */
export async function syncNutricionistaToDatabase(
  user: { id: string; name: string; email: string },
  token?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Chamada à Data API do Neon na tabela public.nutricionistas
    await fetch(`${NEON_DATA_API_URL}/nutricionistas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: user.id,
        nome: user.name,
        email: user.email,
      }),
    })
  } catch (err) {
    // Caso a Data API não responda ou haja trigger no Postgres, logamos sem quebrar o fluxo
    console.warn("Aviso na sincronização explícita via Data API (trigger do banco atua como garantia):", err)
  }
}

/**
 * Tradutor de mensagens de erro para mensagens amigáveis em português
 */
export function formatAuthError(error: any): string {
  if (!error) return "Ocorreu um erro inesperado. Tente novamente."

  const code = error.code || ""
  const message = error.message || ""

  if (code === "INVALID_EMAIL_OR_PASSWORD" || message.toLowerCase().includes("invalid email or password")) {
    return "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
  }

  if (code === "USER_ALREADY_EXISTS" || message.toLowerCase().includes("already exists")) {
    return "Este email já está cadastrado no sistema. Faça login ou use outro endereço."
  }

  if (code === "VALIDATION_ERROR" || message.toLowerCase().includes("validation")) {
    if (message.includes("password")) {
      return "A senha deve ter no mínimo 9 caracteres."
    }
    if (message.includes("email")) {
      return "Por favor, informe um endereço de email válido."
    }
    if (message.includes("name")) {
      return "Por favor, informe seu nome completo."
    }
    return "Dados inválidos. Por favor, revise os campos do formulário."
  }

  if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("network")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão de internet."
  }

  return message || "Falha na autenticação. Verifique os dados e tente novamente."
}
