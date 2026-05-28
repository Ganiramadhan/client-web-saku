import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

type TrendPoint = {
  label: string
  income: number
  expense: number
}

type TrendRange = 'today' | '7d' | '30d' | '6mo'

export function DashboardTrendChart({
  data,
  trendRange,
  incomeLabel,
  expenseLabel,
}: {
  data: TrendPoint[]
  trendRange: TrendRange
  incomeLabel: string
  expenseLabel: string
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#94a3b8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={trendRange === 'today' ? 2 : trendRange === '30d' ? 4 : 0}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => compactCurrency(Number(value))}
          width={55}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          fill="#10b981"
          fillOpacity={0.12}
          name={incomeLabel}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#f43f5e"
          strokeWidth={2}
          fill="#f43f5e"
          fillOpacity={0.1}
          name={expenseLabel}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function compactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`

  return String(value)
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      {label ? <p className="mb-1 font-semibold text-slate-700">{label}</p> : null}

      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>

            <span className="font-semibold text-slate-950">
              {formatCurrency(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
