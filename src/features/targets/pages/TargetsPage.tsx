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
import { useLocale } from '@/i18n'
import { walletApi } from '@/features/wallets/api'
import type { Wallet } from '@/types/api'
import { TargetCard, TargetSummaryCard } from '../components/TargetPanels'


export function TargetsPage() {
  const { locale } = useLocale()
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const copy = locale === 'id'
    ? {
        title: 'Kantong Tujuan',
        subtitle: 'Kelola dompet khusus untuk menabung menuju target tertentu.',
        manageWallet: 'Atur di Dompet',
        emptyTitle: 'Belum ada Kantong Tujuan',
        emptyDesc: 'Tandai salah satu dompet sebagai Kantong Tujuan untuk mulai menabung ke target tertentu, misalnya liburan atau DP rumah.',
        openWallet: 'Buka Dompet',
      }
    : {
        title: 'Target Pockets',
        subtitle: 'Manage dedicated wallets for saving toward specific goals.',
        manageWallet: 'Manage in Wallets',
        emptyTitle: 'No Target Pockets yet',
        emptyDesc: 'Mark a wallet as a Target Pocket to start saving toward a specific goal, such as a vacation or home down payment.',
        openWallet: 'Open Wallets',
      }
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
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Link to="/app/wallets">
            <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
              {copy.manageWallet}
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
            title={copy.emptyTitle}
            description={copy.emptyDesc}
            action={
              <Link to="/app/wallets">
                <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
                  {copy.openWallet}
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
