import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HiOutlinePlus } from 'react-icons/hi2'

import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  Skeleton,
} from '@/components/ui'
import { walletApi } from '@/features/wallets/api'
import type { Wallet } from '@/types/api'
import { TargetCard, TargetSummaryCard } from '../components/TargetPanels'


export function TargetsPage() {
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const [now] = useState(() => Date.now())

  const pockets = useMemo<Wallet[]>(
    () =>
      (wallets.data ?? []).filter(
        (w) => w.target_amount != null && Number(w.target_amount) > 0,
      ),
    [wallets.data],
  )

  const totalSaved = pockets.reduce((s, w) => s + Number(w.balance ?? 0), 0)
  const totalTarget = pockets.reduce((s, w) => s + Number(w.target_amount ?? 0), 0)
  const overallPct =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kantong Tujuan"
        subtitle="Kelola dompet khusus untuk menabung menuju target tertentu — gaya Bank Jago."
        action={
          <Link to="/app/wallets">
            <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
              Atur di Dompet
            </Button>
          </Link>
        }
      />

      {/* Summary */}
      {pockets.length > 0 ? (
        <TargetSummaryCard
          count={pockets.length}
          totalSaved={totalSaved}
          totalTarget={totalTarget}
          overallPct={overallPct}
        />
      ) : null}

      {/* List */}
      {wallets.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : pockets.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada Kantong Tujuan"
            description="Tandai salah satu dompet sebagai Kantong Tujuan untuk mulai menabung ke target tertentu (mis. Liburan, DP Rumah)."
            action={
              <Link to="/app/wallets">
                <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
                  Buka Dompet
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pockets.map((wallet) => (
            <TargetCard key={wallet.id} wallet={wallet} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}
