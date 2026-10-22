/**
 * Formata um número de telefone ou celular brasileiro
 * Aceita: 11999998888 ou 1188887777 -> (11) 99999-8888 ou (11) 8888-7777
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Converte entradas numéricas de horário para HH:mm
 * Exemplos:
 * "6" -> "06:00"
 * "730" -> "07:30"
 * "08" -> "08:00"
 * "2230" -> "22:30"
 * "23" -> "23:00"
 */
export function formatTimeInput(value: string): string {
  if (!value) return ""
  // Se o usuário digitou já com dois pontos ou texto
  const digits = value.replace(/\D/g, "")
  if (!digits) return value

  if (digits.length <= 2) {
    const num = parseInt(digits, 10)
    if (num >= 0 && num <= 23) {
      return `${String(num).padStart(2, "0")}:00`
    }
    return value
  }

  if (digits.length === 3) {
    // Ex: 630 -> 06:30
    const h = parseInt(digits.slice(0, 1), 10)
    const m = parseInt(digits.slice(1), 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }
  }

  if (digits.length >= 4) {
    // Ex: 2230 -> 22:30
    const h = parseInt(digits.slice(0, 2), 10)
    const m = parseInt(digits.slice(2, 4), 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }
  }

  return value
}

/**
 * Calcula a idade a partir da data de nascimento (YYYY-MM-DD)
 */
export function calculateAge(birthDateString: string): number | null {
  if (!birthDateString) return null
  const birth = new Date(birthDateString + "T00:00:00")
  if (isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * peso: em kg
 * altura: em cm (ex: 175)
 */
export function calculateIMC(pesoKg: number, alturaCm: number): {
  imc: number
  classificacao: string
  cor: string
} | null {
  if (!pesoKg || !alturaCm || pesoKg <= 0 || alturaCm <= 0) return null

  const alturaMetros = alturaCm / 100
  const imc = Number((pesoKg / (alturaMetros * alturaMetros)).toFixed(1))

  let classificacao = ""
  let cor = ""

  if (imc < 18.5) {
    classificacao = "Abaixo do peso"
    cor = "text-amber-600 bg-amber-50 border-amber-200"
  } else if (imc < 24.9) {
    classificacao = "Peso normal"
    cor = "text-emerald-700 bg-emerald-50 border-emerald-200"
  } else if (imc < 29.9) {
    classificacao = "Sobrepeso"
    cor = "text-amber-700 bg-amber-50 border-amber-200"
  } else if (imc < 34.9) {
    classificacao = "Obesidade Grau I"
    cor = "text-orange-700 bg-orange-50 border-orange-200"
  } else if (imc < 39.9) {
    classificacao = "Obesidade Grau II"
    cor = "text-red-700 bg-red-50 border-red-200"
  } else {
    classificacao = "Obesidade Grau III"
    cor = "text-red-800 bg-red-100 border-red-300"
  }

  return { imc, classificacao, cor }
}
