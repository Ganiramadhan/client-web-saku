import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ProRoute } from '@/components/ProRoute'
import { AppLayout } from '@/layouts/AppLayout'

import { LandingPage } from '@/features/landing/pages/LandingPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { WalletsPage } from '@/features/wallets/pages/WalletsPage'
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage'
import { TransactionsListPage } from '@/features/transactions/pages/TransactionsListPage'
import { AddTransactionPage } from '@/features/transactions/pages/AddTransactionPage'
import { TransactionDetailPage } from '@/features/transactions/pages/TransactionDetailPage'
import { TargetsPage } from '@/features/targets/pages/TargetsPage'
import { AILogsPage } from '@/features/ai/pages/AILogsPage'
import { ScanReceiptPage } from '@/features/ai/pages/ScanReceiptPage'
import { FreeTextPage } from '@/features/ai/pages/FreeTextPage'
import { AdminUsersPage } from '@/features/adminUsers/pages/AdminUsersPage'
import { ProfilePage } from '@/features/account/pages/ProfilePage'
import { SettingsPage } from '@/features/account/pages/SettingsPage'
import { ThanksPage } from '@/features/subscription/pages/ThanksPage'
import { SubscribersPage } from '@/features/subscription/pages/SubscribersPage'
import { SplitBillsListPage } from '@/features/split/pages/SplitBillsListPage'
import { SplitBillFormPage } from '@/features/split/pages/SplitBillFormPage'
import { SplitBillDetailPage } from '@/features/split/pages/SplitBillDetailPage'
import { NotFoundPage } from '@/features/misc/pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
        <Route path="scan-receipt" element={<ProRoute feature="scan"><ScanReceiptPage /></ProRoute>} />
        <Route path="free-text" element={<ProRoute feature="chat"><FreeTextPage /></ProRoute>} />
        <Route path="targets" element={<ProRoute feature="targets"><TargetsPage /></ProRoute>} />
        <Route path="upcoming-billings" element={<ProfilePage defaultSection="billing" />} />
        <Route path="split-bills" element={<ProRoute feature="splitbill"><SplitBillsListPage /></ProRoute>} />
        <Route path="split-bills/new" element={<ProRoute feature="splitbill"><SplitBillFormPage /></ProRoute>} />
        <Route path="split-bills/:id" element={<ProRoute feature="splitbill"><SplitBillDetailPage /></ProRoute>} />
        <Route path="split-bills/:id/edit" element={<ProRoute feature="splitbill"><SplitBillFormPage /></ProRoute>} />
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
        <Route index element={<Navigate to="/super-admin/ai-logs" replace />} />
        <Route path="ai-logs" element={<AILogsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
