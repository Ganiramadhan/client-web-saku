import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserPlus,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineKey,
} from 'react-icons/hi2'
import { adminUserApi, type AdminUserPayload } from '@/features/adminUsers/api'
import {
  AdminDataTable, AdminMetricCard, Badge, Button, Input, Modal, PageHeader,
  RSelect,
  type SelectOption,
} from '@/components/ui'
import { useT } from '@/i18n'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import type { AdminUser } from '@/types/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import { useAuthStore } from '@/stores/authStore'

type RoleFilter = 'all' | 'user' | 'admin' | 'super_admin'
type StatusFilter = 'all' | 'active' | 'pending_verification' | 'suspended'

const lastLoginLabel = (value?: string | null) => value ? formatDateTime(value) : 'Never logged in'

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
      toast.success('User deleted')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminUserApi.update(id, { status }),
    onSuccess: () => {
      toast.success('User status updated')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (u: AdminUser) => {
    const ok = await confirm({
      title: 'Delete user?',
      description: `User "${u.name}" (${u.email}) will be removed from the active list. Historical data will be kept.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    })
    if (ok) remove.mutate(u.id)
  }

  const onToggleStatus = async (u: AdminUser) => {
    const isSuspended = u.status === 'suspended'
    if (!isSuspended) {
      const ok = await confirm({
        title: 'Suspend user?',
        description: `${u.name} (${u.email}) will not be able to log in until the status is reactivated.`,
        tone: 'danger',
        confirmLabel: 'Suspend User',
      })
      if (!ok) return
    }
    statusMutation.mutate({
      id: u.id,
      status: isSuspended ? 'active' : 'suspended',
    })
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

  const stats = useMemo(() => {
    const all = (q.data?.data ?? []).filter((u) => u.id !== currentUser?.id)
    return {
      total: all.length,
      active: all.filter((u) => (u.status ?? 'active') === 'active').length,
      suspended: all.filter((u) => u.status === 'suspended').length,
      pending: all.filter((u) => u.status === 'pending_verification').length,
      admin: all.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
    }
  }, [q.data?.data, currentUser?.id])

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
        header: 'User',
        accessorFn: (u) => u.name,
        cell: ({ row }) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-[#17120f] shadow-sm ring-2 ring-[#fffaf6]">
              {row.original.photo_url ? (
                <img
                  src={row.original.photo_url}
                  alt={row.original.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-[#17120f]">
                  {(row.original.name?.trim()?.[0] ?? '?').toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-900">{row.original.name}</div>
              <div className="truncate text-xs text-slate-500">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        header: t.adminUsers.status,
        accessorFn: (u) => u.status ?? 'active',
        cell: ({ row }) => (
          <Badge tone={row.original.status === 'suspended' ? 'red' : row.original.status === 'pending_verification' ? 'amber' : 'green'}>
            {row.original.status === 'pending_verification' ? 'pending verify' : row.original.status ?? 'active'}
          </Badge>
        ),
      },
      {
        id: 'activity',
        header: 'Activity',
        accessorFn: (u) => `${u.last_login_at ?? ''} ${u.created_at}`,
        cell: ({ row }) => (
          <div className="min-w-[170px] text-xs leading-5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <HiOutlineClock className="h-3.5 w-3.5 text-brand-600" />
              {lastLoginLabel(row.original.last_login_at)}
            </div>
            <div className="text-slate-400">Joined {formatDate(row.original.created_at)}</div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Action</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onToggleStatus(row.original)}
              className={cn(
                'rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5',
                row.original.status === 'suspended'
                  ? 'hover:bg-emerald-50 hover:text-emerald-700'
                  : 'hover:bg-amber-50 hover:text-amber-700',
              )}
              title={row.original.status === 'suspended' ? 'Activate' : 'Suspend'}
            >
              {row.original.status === 'suspended' ? (
                <HiOutlineCheckCircle className="h-4 w-4" />
              ) : (
                <HiOutlineNoSymbol className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => { setEditing(row.original); setOpen(true) }}
              className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-brand-100 hover:text-brand-800"
              title="Edit"
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(row.original)}
              className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700"
              title="Delete"
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => q.refetch()}
              loading={q.isFetching}
              leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Button
              onClick={() => { setEditing(null); setOpen(true) }}
              leftIcon={<HiOutlineUserPlus className="h-4 w-4" />}
            >
              Create
            </Button>
          </div>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total Users" value={stats.total} helper="Accounts managed by admin" Icon={HiOutlineUsers} tone="brand" loading={q.isLoading} />
        <AdminMetricCard label="Active" value={stats.active} helper="Can access their workspace" Icon={HiOutlineCheckCircle} tone="emerald" loading={q.isLoading} />
        <AdminMetricCard label="Pending Verify" value={stats.pending} helper="Waiting for email verification" Icon={HiOutlineNoSymbol} tone="amber" loading={q.isLoading} />
        <AdminMetricCard label="Admin" value={stats.admin} helper="Admin and super admin access" Icon={HiOutlineShieldCheck} tone="violet" loading={q.isLoading} />
      </section>

      <AdminDataTable
        data={filteredUsers}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder="Search name, email, or phone..."
        emptyTitle="No users yet"
        emptyAction={
          <Button onClick={() => { setEditing(null); setOpen(true) }} leftIcon={<HiOutlineUserPlus className="h-4 w-4" />}>
            Create
          </Button>
        }
        getRowId={(r) => r.id}
        toolbar={
          <>
            <div className="min-w-[150px]">
              <RSelect
                value={roleFilter}
                options={[
                  { value: 'all', label: 'All roles' },
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
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending_verification', label: 'Pending Verify' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
              />
            </div>
            {roleFilter !== 'all' || statusFilter !== 'all' ? (
              <Button
                variant="outline"
                className="border-rose-100 !bg-white text-rose-700 hover:!bg-rose-50"
                onClick={() => {
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
              >
                Reset Filter
              </Button>
            ) : null}
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
      title={editing ? `Edit ${editing.name}` : 'Create New User'}
      description={
        editing
          ? 'Update account information. Leave password empty if it is not changed.'
          : 'Create an internal account for admin access or operational users.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={m.isPending} onClick={() => m.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-[#17120f] shadow-sm">
            {(form.name?.trim()?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-900">
              {form.name || 'User name'}
            </div>
            <div className="truncate text-xs text-slate-500">
              {form.email || 'email@company.com'}
            </div>
            {editing ? (
              <div className="mt-1 text-[11px] text-brand-800">
                Last login: {lastLoginLabel(editing.last_login_at)}
              </div>
            ) : null}
          </div>
          {editing ? <Badge tone={editing.status === 'suspended' ? 'red' : 'green'}>{editing.status ?? 'active'}</Badge> : null}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/60 p-4">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">Identity</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="Example: Budi Santoso"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/60 p-4">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">Security</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={editing ? 'Password (optional)' : 'Password'}
              type="password"
              placeholder={editing ? 'Leave empty if unchanged' : 'Minimum 8 characters'}
              value={form.password ?? ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="0812xxxxxxxx (optional)"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-100 px-3 py-2 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-200"
            onClick={() => setForm({ ...form, password: '12345678' })}
          >
            <HiOutlineKey className="h-4 w-4" />
            Set default password 12345678
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/60 p-4">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">Access Control</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <RSelect
              label="Role"
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
                { value: 'active', label: 'Active' },
                { value: 'pending_verification', label: 'Pending Verification' },
                { value: 'suspended', label: 'Suspended' },
              ] as SelectOption[]}
              onChange={(v) => setForm({ ...form, status: v ?? 'active' })}
            />
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-100/70 p-3 text-xs text-brand-800">
          <HiOutlineShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {editing
              ? 'Role changes apply on the next session after the user logs in again.'
              : 'Email will be the login identity. Make sure it is correct before saving.'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
