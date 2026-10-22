import { authClient, NEON_DATA_API_URL } from "@/lib/auth-client"

/**
 * Utilitário centralizado para requisições autenticadas à Neon Data API
 */
export async function dataApiFetch<T = any>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    body?: any
    token?: string
    prefer?: string
  } = {}
): Promise<T> {
  const { method = "GET", body, token, prefer } = options

  let activeToken = token

  // Se não temos o token explicitamente, busca via authClient.token()
  if (!activeToken) {
    try {
      const tokenRes = await (authClient as any).token?.()
      if (tokenRes?.data?.token) {
        activeToken = tokenRes.data.token
      }
    } catch (e) {
      console.warn("Aviso ao buscar token JWT no dataApiFetch:", e)
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`
  }

  if (prefer) {
    headers["Prefer"] = prefer
  }

  const res = await fetch(`${NEON_DATA_API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    console.error(`Erro na Data API [${method} ${path}] (${res.status}):`, errorText)
    throw new Error(`Erro na Data API: ${res.status} - ${errorText || res.statusText}`)
  }

  // Se não tem conteúdo (ex: 204 No Content, 201 Created sem representation, ou corpo vazio)
  if (res.status === 204 || res.status === 201 && !prefer?.includes("return=representation")) {
    const text = await res.text().catch(() => "")
    if (!text || !text.trim()) {
      return null as T
    }
    try {
      return JSON.parse(text) as T
    } catch {
      return null as T
    }
  }

  const rawText = await res.text().catch(() => "")
  if (!rawText || !rawText.trim()) {
    return null as T
  }

  try {
    return JSON.parse(rawText) as T
  } catch (parseErr) {
    console.warn("Aviso: Resposta da Data API não era um JSON válido:", rawText)
    return null as T
  }
}
