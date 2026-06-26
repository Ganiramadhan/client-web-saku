import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HiPlus } from 'react-icons/hi2'
import { Button, PageHeader } from '@/components/ui'
import { MobileFab } from '@/components/MobileFab'
import { useLocale } from '@/i18n'
import { upcomingBillingApi, type UpcomingBilling } from '@/features/billing/api'
import { BillingModal, UpcomingBillingManager } from '@/features/billing/components/UpcomingBillingPanels'

export function UpcomingBillingPage() {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Upcoming Billing',
        subtitle: 'Pantau tagihan rutin seperti VPS, domain, software, dan layanan berulang sebelum jatuh tempo.',
        add: 'Tambah Billing',
      }
    : {
        title: 'Upcoming Billing',
        subtitle: 'Track recurring bills such as VPS, domains, software, and subscriptions before they are due.',
        add: 'Add Billing',
      }
  const billings = useQuery({ queryKey: ['upcoming-billings'], queryFn: upcomingBillingApi.list })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UpcomingBilling | null>(null)

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Button className="hidden sm:inline-flex" onClick={openCreate}>
            <HiPlus className="mr-1 h-4 w-4" />
            {copy.add}
          </Button>
        }
      />

      <UpcomingBillingManager
        items={billings.data ?? []}
        loading={billings.isLoading}
        onCreate={openCreate}
        onEdit={(item) => {
          setEditing(item)
          setOpen(true)
        }}
      />

      <BillingModal
        key={`${editing?.id ?? 'new'}-${open ? 'open' : 'closed'}`}
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
      />
      <MobileFab
        label={copy.add}
        icon={<HiPlus className="h-6 w-6" />}
        onClick={openCreate}
      />
    </div>
  )
}

export default UpcomingBillingPage
