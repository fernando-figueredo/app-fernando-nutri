import React from "react"
import { Apple, Leaf, Sparkles } from "lucide-react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showTagline?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  className = "",
  showTagline = true,
}) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  }[size]

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size]

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Ícone com gradiente verde nutrição */}
        <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-green-500 shadow-lg shadow-emerald-600/25 ${iconSizes}`}>
          <Leaf className="w-3/5 h-3/5 text-white transform -rotate-12 drop-shadow" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
          </div>
        </div>

        {/* Nome da Marca */}
        <div className="flex flex-col items-start leading-none">
          <div className={`font-extrabold tracking-tight text-slate-900 ${textSizes}`}>
            Fernando <span className="text-emerald-600 font-black">Nutri</span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-emerald-700/80 tracking-wider uppercase mt-0.5">
              Gestão & Nutrição Clínica
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
