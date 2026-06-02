import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ProRoute } from '@/components/ProRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuthStore } from '@/stores/authStore'

const lazyRoute = (loader: () => Promise<Record<string, unknown>>, exportName: string): ComponentType<any> =>
  lazy(async () => ({ default: (await loader())[exportName] as ComponentType<any> }))

const HomePage = lazyRoute(() => import('@/features/home/pages/HomePage'), 'HomePage')
const ForgotPasswordPage = lazyRoute(() => import('@/features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage')
const LoginPage = lazyRoute(() => import('@/features/auth/pages/LoginPage'), 'LoginPage')
const RegisterPage = lazyRoute(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage')
const DashboardPage = lazyRoute(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage')
const AdminDashboardPage = lazyRoute(() => import('@/features/adminDashboard/pages/AdminDashboardPage'), 'AdminDashboardPage')
const WalletsPage = lazyRoute(() => import('@/features/wallets/pages/WalletsPage'), 'WalletsPage')
const CategoriesPage = lazyRoute(() => import('@/features/categories/pages/CategoriesPage'), 'CategoriesPage')
const TransactionsListPage = lazyRoute(() => import('@/features/transactions/pages/TransactionsListPage'), 'TransactionsListPage')
const AddTransactionPage = lazyRoute(() => import('@/features/transactions/pages/AddTransactionPage'), 'AddTransactionPage')
const TransactionDetailPage = lazyRoute(() => import('@/features/transactions/pages/TransactionDetailPage'), 'TransactionDetailPage')
const TargetsPage = lazyRoute(() => import('@/features/targets/pages/TargetsPage'), 'TargetsPage')
const AILogsPage = lazyRoute(() => import('@/features/ai/pages/AILogsPage'), 'AILogsPage')
const ScanReceiptPage = lazyRoute(() => import('@/features/ai/pages/ScanReceiptPage'), 'ScanReceiptPage')
const FreeTextPage = lazyRoute(() => import('@/features/ai/pages/FreeTextPage'), 'FreeTextPage')
const AdminUsersPage = lazyRoute(() => import('@/features/adminUsers/pages/AdminUsersPage'), 'AdminUsersPage')
const ProfilePage = lazyRoute(() => import('@/features/account/pages/ProfilePage'), 'ProfilePage')
const SettingsPage = lazyRoute(() => import('@/features/account/pages/SettingsPage'), 'SettingsPage')
const UpcomingBillingPage = lazyRoute(() => import('@/features/billing/pages/UpcomingBillingPage'), 'UpcomingBillingPage')
const ThanksPage = lazyRoute(() => import('@/features/subscription/pages/ThanksPage'), 'ThanksPage')
const PaymentRedirectPage = lazyRoute(() => import('@/features/subscription/pages/PaymentRedirectPage'), 'PaymentRedirectPage')
const SubscribersPage = lazyRoute(() => import('@/features/subscription/pages/SubscribersPage'), 'SubscribersPage')
const VouchersPage = lazyRoute(() => import('@/features/subscription/pages/VouchersPage'), 'VouchersPage')
const CustomerServicePage = lazyRoute(() => import('@/features/support/pages/CustomerServicePage'), 'CustomerServicePage')
const SplitBillsListPage = lazyRoute(() => import('@/features/split/pages/SplitBillsListPage'), 'SplitBillsListPage')
const SplitBillFormPage = lazyRoute(() => import('@/features/split/pages/SplitBillFormPage'), 'SplitBillFormPage')
const SplitBillDetailPage = lazyRoute(() => import('@/features/split/pages/SplitBillDetailPage'), 'SplitBillDetailPage')
const NotFoundPage = lazyRoute(() => import('@/features/misc/pages/NotFoundPage'), 'NotFoundPage')

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      {/* Public */}
      <Route path="/" element={<HomeRedirect><HomePage /></HomeRedirect>} />
      <Route path="/landing" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/payment/finish" element={<PaymentRedirectPage mode="finish" />} />
      <Route path="/payment/error" element={<PaymentRedirectPage mode="error" />} />

      {/* Authenticated workspace */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="transactions" element={<TransactionsListPage />} />
        <Route path="transactions/add" element={<AddTransactionPage />} />
        <Route path="transactions/:id" element={<TransactionDetailPage />} />
        <Route path="scan-receipt" element={<ScanReceiptPage />} />
        <Route path="free-text" element={<FreeTextPage />} />
        <Route path="targets" element={<TargetsPage />} />
        <Route path="upcoming-billings" element={<UpcomingBillingPage />} />
        <Route path="split-bills" element={<SplitBillsListPage />} />
        <Route path="split-bills/new" element={<SplitBillFormPage />} />
        <Route path="split-bills/:id" element={<SplitBillDetailPage />} />
        <Route path="split-bills/:id/edit" element={<SplitBillFormPage />} />
        <Route path="customer-service" element={<ProRoute><CustomerServicePage /></ProRoute>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="subscription" element={<Navigate to="/app/profile" replace />} />
        <Route path="subscription/plans" element={<Navigate to="/app/profile" replace />} />
        <Route path="subscription/thanks" element={<ThanksPage />} />
      </Route>

      {/* Admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/users" replace />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="subscriptions" element={<SubscribersPage />} />
        <Route path="vouchers" element={<VouchersPage />} />
        <Route path="customer-service" element={<CustomerServicePage />} />
        <Route path="subscription/thanks" element={<ThanksPage />} />
      </Route>

      {/* Super Admin only */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requireSuperAdmin>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="subscriptions" element={<SubscribersPage />} />
        <Route path="vouchers" element={<VouchersPage />} />
        <Route path="ai-logs" element={<AILogsPage />} />
        <Route path="customer-service" element={<CustomerServicePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function PublicRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/app" replace />
  return <>{children}</>
}

function HomeRedirect({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (token && typeof window !== 'undefined') {
    const key = 'saku-root-auto-dashboard-v1'
    if (window.sessionStorage.getItem(key) !== '1') {
      window.sessionStorage.setItem(key, '1')
      return <Navigate to="/app" replace />
    }
  }
  return <>{children}</>
}

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  )
}
