import React, { useState } from "react"
import { Consulta } from "@/types/paciente"

interface WeightEvolutionChartProps {
  consultas: Consulta[]
  pesoInicial?: number | null
}

export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({
  consultas,
  pesoInicial,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Organiza pontos cronologicamente (da data mais antiga para a mais recente)
  const sortedPoints = React.useMemo(() => {
    // Filtra consultas que têm peso registrado válido
    const valid = consultas
      .filter((c) => c.peso !== null && c.peso !== undefined && !isNaN(Number(c.peso)))
      .map((c) => ({
        id: c.id,
        data: c.data_consulta,
        peso: Number(c.peso),
        observacoes: c.observacoes || "",
      }))

    // Ordena por data crescente
    valid.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    // Se temos pesoInicial do paciente e nenhuma consulta na mesma data, pode complementar
    return valid
  }, [consultas, pesoInicial])

  if (sortedPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
        <p className="text-xs text-slate-400 mt-0.5">
          O gráfico exibirá a curva de evolução assim que as primeiras consultas com peso forem registradas.
        </p>
      </div>
    )
  }

  // Parâmetros do SVG
  const width = 760
  const height = 240
  const paddingX = 50
  const paddingTop = 30
  const paddingBottom = 45

  // Encontra mínimo e máximo de peso para escala dinâmica com folga
  const pesos = sortedPoints.map((p) => p.peso)
  const rawMin = Math.min(...pesos)
  const rawMax = Math.max(...pesos)
  const minPeso = Math.floor(rawMin - 2)
  const maxPeso = Math.ceil(rawMax + 2)
  const range = maxPeso - minPeso || 1

  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingTop - paddingBottom

  // Converte pontos para coordenadas (x, y)
  const points = sortedPoints.map((p, idx) => {
    const x =
      sortedPoints.length === 1
        ? width / 2
        : paddingX + (idx / (sortedPoints.length - 1)) * chartWidth
    const y = paddingTop + chartHeight - ((p.peso - minPeso) / range) * chartHeight
    return { ...p, x, y }
  })

  // Path SVG para linha
  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`
    // Curva suave com bezier simples
    const prev = points[idx - 1]
    const cp1x = prev.x + (curr.x - prev.x) / 2
    const cp1y = prev.y
    const cp2x = prev.x + (curr.x - prev.x) / 2
    const cp2y = curr.y
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
  }, "")

  // Path da área sombreada gradiente
  const areaD =
    points.length === 1
      ? ""
      : `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`

  // Diferença total de peso
  const primeiroPeso = sortedPoints[0].peso
  const ultimoPeso = sortedPoints[sortedPoints.length - 1].peso
  const diff = Number((ultimoPeso - primeiroPeso).toFixed(1))

  return (
    <div className="space-y-3">
      {/* Resumo de variação */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">Peso Inicial: </span>
            <span className="font-bold text-slate-700">{primeiroPeso} kg</span>
          </div>
          <div>
            <span className="text-slate-400">Peso Atual: </span>
            <span className="font-bold text-slate-900">{ultimoPeso} kg</span>
          </div>
          <div>
            <span className="text-slate-400">Variação: </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                diff < 0
                  ? "bg-emerald-100 text-emerald-800"
                  : diff > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {diff > 0 ? `+${diff}` : diff} kg
            </span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          {sortedPoints.length} {sortedPoints.length === 1 ? "registro" : "registros ao longo do tempo"}
        </span>
      </div>

      {/* SVG Canvas do Gráfico */}
      <div className="relative w-full overflow-x-auto bg-gradient-to-b from-emerald-50/20 to-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Linhas horizontais de grade */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + chartHeight * (1 - pct)
            const valorPeso = (minPeso + range * pct).toFixed(1)
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="500"
                >
                  {valorPeso}
                </text>
              </g>
            )
          })}

          {/* Área gradiente */}
          {areaD && <path d={areaD} fill="url(#weightAreaGrad)" />}

          {/* Linha principal da evolução */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#weightLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Linhas verticais indicativas e pontos */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx
            const formattedDate = new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })

            return (
              <g key={p.id}>
                {/* Linha vertical até a base */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={paddingTop + chartHeight}
                  stroke={isHovered ? "#10b981" : "#f1f5f9"}
                  strokeWidth={isHovered ? "1.5" : "1"}
                  strokeDasharray={isHovered ? "2 2" : undefined}
                />

                {/* Rótulo da data no eixo X */}
                <text
                  x={p.x}
                  y={paddingTop + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? "#047857" : "#64748b"}
                  fontWeight={isHovered ? "700" : "500"}
                >
                  {formattedDate}
                </text>

                {/* Ponto / Nó */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? "#047857" : "#ffffff"}
                  stroke="#059669"
                  strokeWidth={isHovered ? "3.5" : "2.5"}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Rótulo de peso acima do ponto */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fontSize={isHovered ? "12" : "11"}
                  fontWeight="700"
                  fill={isHovered ? "#047857" : "#0f172a"}
                >
                  {p.peso} kg
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip de detalhes ao passar mouse */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-700 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 8}%`,
            }}
          >
            <p className="font-bold text-emerald-400">
              {new Date(points[hoveredIndex].data + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
            <p className="text-slate-200 mt-0.5">Peso: <strong className="text-white">{points[hoveredIndex].peso} kg</strong></p>
            {points[hoveredIndex].observacoes && (
              <p className="text-[10px] text-slate-400 mt-1 max-w-[160px] truncate">
                {points[hoveredIndex].observacoes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
