import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlinePlus,
} from 'react-icons/hi2'
import { categoryApi } from '@/features/categories/api'
import { Button, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { useT } from '@/i18n'
import type { Category, TransactionType } from '@/types/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { CategoryGroup, CategoryModal, FilterPill } from '../components/CategoriesPanels'

export function CategoriesPage() {
  const t = useT()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'' | TransactionType>('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const q = useQuery({
    queryKey: ['categories', filter || 'all'],
    queryFn: () => categoryApi.list(filter || undefined),
  })

  const remove = useMutation({
    mutationFn: categoryApi.remove,
    onSuccess: () => {
      toast.success('Category deleted')
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const all = q.data ?? []
  const grouped = useMemo(() => ({
    income: all.filter((c) => c.type === 'income'),
    expense: all.filter((c) => c.type === 'expense'),
  }), [all])

  return (
    <div>
      <PageHeader
        title={t.categories.title}
        subtitle={t.categories.subtitle}
        action={
          <Button
            leftIcon={<HiOutlinePlus className="h-4 w-4" />}
            onClick={() => { setEditing(null); setOpen(true) }}
          >
            {t.categories.newCategory}
          </Button>
        }
      />

      {/* Filter pills */}
      <div className="mb-5 inline-flex items-center gap-1 rounded-2xl border border-white/80 bg-white/65 p-1 shadow-sm backdrop-blur-xl">
        <FilterPill active={filter === ''} onClick={() => setFilter('')}>
          Semua ({all.length})
        </FilterPill>
        <FilterPill active={filter === 'income'} onClick={() => setFilter('income')}>
          {t.transactions.income} ({grouped.income.length})
        </FilterPill>
        <FilterPill active={filter === 'expense'} onClick={() => setFilter('expense')}>
          {t.transactions.expense} ({grouped.expense.length})
        </FilterPill>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : all.length === 0 ? (
        <Card>
          <EmptyState
            title={t.common.empty}
            description="Belum ada kategori. Tambahkan kategori untuk mengelompokkan transaksimu."
            action={<Button leftIcon={<HiOutlinePlus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true) }}>{t.categories.newCategory}</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {(filter === '' || filter === 'expense') && grouped.expense.length > 0 ? (
            <CategoryGroup
              title={t.transactions.expense}
              Icon={HiOutlineArrowTrendingDown}
              tone="rose"
              items={grouped.expense}
              onEdit={(c) => { setEditing(c); setOpen(true) }}
              onRemove={(c) => remove.mutate(c.id)}
              t={t}
            />
          ) : null}
          {(filter === '' || filter === 'income') && grouped.income.length > 0 ? (
            <CategoryGroup
              title={t.transactions.income}
              Icon={HiOutlineArrowTrendingUp}
              tone="emerald"
              items={grouped.income}
              onEdit={(c) => { setEditing(c); setOpen(true) }}
              onRemove={(c) => remove.mutate(c.id)}
              t={t}
            />
          ) : null}
        </div>
      )}

      <CategoryModal key={editing?.id ?? 'new'} open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}
