import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HiOutlineLockClosed, HiOutlinePencilSquare, HiOutlineTag, HiOutlineTrash } from 'react-icons/hi2'
import { categoryApi, type CategoryPayload } from '@/features/categories/api'
import { Button, Input, Modal, RSelect, type SelectOption } from '@/components/ui'
import { useT } from '@/i18n'
import type { Category, TransactionType } from '@/types/api'
import { toErrorMessage } from '@/lib/api'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

/* ─── Helpers ────────────────────────────────────────────────────── */

export function FilterPill({
  active, onClick, children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 active:scale-[0.98]',
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  )
}

export function CategoryGroup({
  title, Icon, tone, items, onEdit, onRemove, t,
}: {
  title: string
  Icon: ComponentType<{ className?: string }>
  tone: 'rose' | 'emerald'
  items: Category[]
  onEdit: (c: Category) => void
  onRemove: (c: Category) => void
  t: ReturnType<typeof useT>
}) {
  const headerCls = tone === 'rose'
    ? 'bg-rose-50 text-rose-700 ring-rose-100'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1', headerCls)}>
          <Icon className="h-4 w-4" /> {title}
        </span>
        <span className="text-xs text-slate-500">{items.length} kategori</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((c) => (
          <div
            key={c.id}
            className="group flex items-start gap-3 rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/85 hover:shadow-lg"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: c.color || '#10b981' }}
            >
              <HiOutlineTag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-sm font-semibold text-slate-900">{c.name}</div>
                {c.is_system ? (
                  <span title={t.categories.system} className="inline-flex items-center text-slate-400">
                    <HiOutlineLockClosed className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500">
                {c.icon ? `Ikon: ${c.icon}` : 'Tanpa ikon'}
              </div>
            </div>
            {!c.is_system ? (
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => onEdit(c)}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:text-brand-700"
                  title={t.common.edit}
                >
                  <HiOutlinePencilSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Hapus kategori?',
                      description: `Kategori "${c.name}" akan dihapus.`,
                      tone: 'danger',
                      confirmLabel: t.common.delete,
                    })
                    if (ok) onRemove(c)
                  }}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600"
                  title={t.common.delete}
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export function CategoryModal({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing: Category | null }) {
  const t = useT()
  const qc = useQueryClient()
  const [form, setForm] = useState<CategoryPayload>(() => ({
    name: editing?.name ?? '',
    type: editing?.type ?? 'expense',
    color: editing?.color ?? '#10b981',
    icon: editing?.icon ?? '',
  }))

  const presetNames = useMemo<Record<TransactionType, string[]>>(() => ({
    expense: [
      'Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan',
      'Hiburan', 'Kesehatan', 'Pendidikan', 'Sewa', 'Donasi',
      'Asuransi', 'Anak', 'Hewan Peliharaan',
    ],
    income: [
      'Gaji', 'Bonus', 'Freelance', 'Investasi', 'Hadiah',
      'Penjualan', 'Bunga Bank', 'Cashback',
    ],
  }), [])

  const presetList = presetNames[form.type] ?? []
  const isPreset = presetList.includes(form.name)
  const [usingCustom, setUsingCustom] = useState<boolean>(
    !!editing && !!form.name && !isPreset,
  )

  const m = useMutation({
    mutationFn: () =>
      editing ? categoryApi.update(editing.id, form) : categoryApi.create(form),
    onSuccess: () => {
      toast.success(editing ? 'Category updated' : 'Category created')
      qc.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t.common.edit : t.categories.newCategory}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button loading={m.isPending} onClick={() => m.mutate()}>{t.common.save}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <RSelect
          label={t.common.name}
          value={usingCustom ? '__custom__' : (isPreset ? form.name : '')}
          options={[
            ...presetList.map((n) => ({ value: n, label: n })),
            { value: '__custom__', label: 'Lainnya (isi manual)…' },
          ] as SelectOption[]}
          placeholder="Pilih nama kategori…"
          onChange={(v) => {
            if (v === '__custom__') {
              setUsingCustom(true)
              setForm({ ...form, name: '' })
            } else {
              setUsingCustom(false)
              setForm({ ...form, name: v ?? '' })
            }
          }}
        />
        {usingCustom ? (
          <Input
            label="Nama Kustom"
            placeholder="Tulis nama kategori sendiri"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <RSelect
            label={t.common.type}
            value={form.type}
            options={[
              { value: 'expense', label: t.transactions.expense },
              { value: 'income', label: t.transactions.income },
            ] as SelectOption[]}
            onChange={(v) => {
              const newType = (v ?? 'expense') as TransactionType
              const inNewList = (presetNames[newType] ?? []).includes(form.name)
              setForm({
                ...form,
                type: newType,
                name: usingCustom ? form.name : (inNewList ? form.name : ''),
              })
            }}
          />
          <Input label={t.categories.color} type="color"
            value={form.color || '#10b981'}
            onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </div>
        <Input label={t.categories.icon} placeholder="utensils"
          value={form.icon ?? ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
      </div>
    </Modal>
  )
}
