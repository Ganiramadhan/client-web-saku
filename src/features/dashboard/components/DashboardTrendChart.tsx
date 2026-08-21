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
        <CartesianGrid stroke="#efe4dc" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#a89a91"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={trendRange === 'today' ? 2 : trendRange === '30d' ? 4 : 0}
        />
        <YAxis
          stroke="#a89a91"
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
          stroke="#059669"
          strokeWidth={2}
          fill="#10b981"
          fillOpacity={0.14}
          name={incomeLabel}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#ec5b4f"
          strokeWidth={2}
          fill="#ff6f61"
          fillOpacity={0.14}
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
    <div className="rounded-2xl border border-[#17120f]/14 bg-[#fffaf6] px-3 py-2 text-xs shadow-xl shadow-[#17120f]/10">
      {label ? <p className="mb-1 font-bold text-[#17120f]">{label}</p> : null}

      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-[#6f625b]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>

            <span className="font-semibold text-[#17120f]">
              {formatCurrency(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
