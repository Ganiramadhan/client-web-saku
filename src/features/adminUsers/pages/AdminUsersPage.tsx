import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserPlus,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'
import { adminUserApi, type AdminUserPayload } from '@/features/adminUsers/api'
import {
  Badge, Button, DataTable, Input, Modal, PageHeader,
  RSelect,
  type SelectOption,
} from '@/components/ui'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/utils'
import type { AdminUser } from '@/types/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import { useAuthStore } from '@/stores/authStore'

type RoleFilter = 'all' | 'user' | 'admin' | 'super_admin'
type StatusFilter = 'all' | 'active' | 'suspended'

export function AdminUsersPage() {
  const t = useT()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const q = useQuery({
    queryKey: ['admin-users', 'all'],
    queryFn: () => adminUserApi.list({ page: 1, limit: 200 }),
  })

  const remove = useMutation({
    mutationFn: adminUserApi.remove,
    onSuccess: () => {
      toast.success('User dihapus')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (u: AdminUser) => {
    const ok = await confirm({
      title: 'Hapus user?',
      description: `User "${u.name}" (${u.email}) akan dihapus permanen.`,
      tone: 'danger',
      confirmLabel: t.common.delete,
    })
    if (ok) remove.mutate(u.id)
  }

  const filteredUsers = useMemo(() => {
    const all = q.data?.data ?? []
    return all
      .filter((u) => u.id !== currentUser?.id)
      .filter((u) => (roleFilter === 'all' ? true : u.role === roleFilter))
      .filter((u) =>
        statusFilter === 'all' ? true : (u.status ?? 'active') === statusFilter,
      )
  }, [q.data?.data, currentUser?.id, roleFilter, statusFilter])

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'no',
        header: () => <span className="block text-center">#</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block text-center text-sm tabular-nums text-slate-500">
            {row.index + 1}
          </span>
        ),
      },
      {
        id: 'name',
        header: t.common.name,
        accessorFn: (u) => u.name,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-semibold text-white">
              {(row.original.name?.trim()?.[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-slate-900">{row.original.name}</div>
              {row.original.phone ? (
                <div className="text-xs text-slate-500">{row.original.phone}</div>
              ) : null}
            </div>
          </div>
        ),
      },
      { id: 'email', header: 'Email', accessorFn: (u) => u.email },
      {
        id: 'role',
        header: t.adminUsers.role,
        accessorFn: (u) => u.role,
        cell: ({ row }) => {
          const role = row.original.role
          const tone =
            role === 'admin' ? 'violet' : role === 'super_admin' ? 'blue' : 'gray'
          return <Badge tone={tone}>{role}</Badge>
        },
      },
      {
        id: 'status',
        header: t.adminUsers.status,
        accessorFn: (u) => u.status ?? 'active',
        cell: ({ row }) => (
          <Badge tone={row.original.status === 'suspended' ? 'red' : 'green'}>
            {row.original.status ?? 'active'}
          </Badge>
        ),
      },
      {
        id: 'created',
        header: 'Joined',
        accessorFn: (u) => u.created_at,
        cell: ({ row }) => (
          <span className="text-slate-500">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">{t.common.action}</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => { setEditing(row.original); setOpen(true) }}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
              title={t.common.edit}
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(row.original)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
              title={t.common.delete}
            >
              <HiOutlineTrash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  return (
    <div>
      <PageHeader
        title={t.adminUsers.title}
        subtitle={t.adminUsers.subtitle}
        action={
          <Button onClick={() => { setEditing(null); setOpen(true) }} leftIcon={<HiOutlineUserPlus className="h-4 w-4" />}>
            {t.common.create}
          </Button>
        }
      />

      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder={`${t.common.search} nama, email…`}
        emptyTitle={t.common.empty}
        emptyAction={
          <Button onClick={() => { setEditing(null); setOpen(true) }} leftIcon={<HiOutlineUserPlus className="h-4 w-4" />}>
            {t.common.create}
          </Button>
        }
        getRowId={(r) => r.id}
        toolbar={
          <>
            <div className="min-w-[150px]">
              <RSelect
                value={roleFilter}
                options={[
                  { value: 'all', label: 'Semua role' },
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'super_admin', label: 'Super Admin' },
                ]}
                onChange={(v) => setRoleFilter((v as RoleFilter) ?? 'all')}
              />
            </div>
            <div className="min-w-[150px]">
              <RSelect
                value={statusFilter}
                options={[
                  { value: 'all', label: 'Semua status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
              />
            </div>
          </>
        }
      />

      <UserModal key={editing?.id ?? 'new'} open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}

function UserModal({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing: AdminUser | null }) {
  const t = useT()
  const qc = useQueryClient()
  const [form, setForm] = useState<AdminUserPayload>(() => ({
    name: editing?.name ?? '',
    email: editing?.email ?? '',
    password: '',
    role: editing?.role ?? 'user',
    phone: editing?.phone ?? '',
    status: editing?.status ?? 'active',
  }))

  const m = useMutation({
    mutationFn: () => {
      if (editing) {
        const payload: Partial<AdminUserPayload> = { ...form }
        if (!payload.password) delete payload.password
        return adminUserApi.update(editing.id, payload)
      }
      return adminUserApi.create(form)
    },
    onSuccess: () => {
      toast.success(editing ? 'User updated' : 'User created')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? `Edit ${editing.name}` : 'Tambah Pengguna Baru'}
      description={
        editing
          ? 'Perbarui informasi akun. Kosongkan password jika tidak diubah.'
          : 'Buat akun baru. Pengguna otomatis aktif dan dapat login setelahnya.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button loading={m.isPending} onClick={() => m.mutate()}>{t.common.save}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-lg font-semibold text-white">
            {(form.name?.trim()?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">
              {form.name || 'Nama pengguna'}
            </div>
            <div className="truncate text-xs text-slate-500">
              {form.email || 'email@perusahaan.com'}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Budi Santoso"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@perusahaan.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={editing ? 'Password (opsional)' : 'Password'}
            type="password"
            placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
            value={form.password ?? ''}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            label="Nomor Telepon"
            placeholder="0812xxxxxxxx (opsional)"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <RSelect
            label="Peran"
            value={form.role ?? 'user'}
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ] as SelectOption[]}
            onChange={(v) => setForm({ ...form, role: v ?? 'user' })}
          />
          <RSelect
            label="Status"
            value={form.status ?? 'active'}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'suspended', label: 'Suspended' },
            ] as SelectOption[]}
            onChange={(v) => setForm({ ...form, status: v ?? 'active' })}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-700">
          <HiOutlineShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {editing
              ? 'Perubahan peran berlaku pada sesi berikutnya setelah user login ulang.'
              : 'Email akan menjadi identitas login. Pastikan benar sebelum disimpan.'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
