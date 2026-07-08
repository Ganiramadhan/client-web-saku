import { HiOutlineExclamationTriangle, HiOutlineTrash } from 'react-icons/hi2'
import { Button, Card } from '@/components/ui'
import { useLocale } from '@/i18n'

export function DeleteAccountPanel({ onDelete, loading }: { onDelete: () => void; loading?: boolean }) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Hapus Akun',
        description: 'Hapus akun dan seluruh data terkait dari SAKU. Tindakan ini tidak bisa dibatalkan.',
        button: 'Hapus Akun',
      }
    : {
        title: 'Delete Account',
        description: 'Delete your account and related SAKU data. This action cannot be undone.',
        button: 'Delete Account',
      }

  return (
    <Card className="border-brand-100 bg-[#ffe4dc]/55">
      <div className="flex items-center gap-2">
        <HiOutlineExclamationTriangle className="h-5 w-5 text-[#b4533f]" />
        <h3 className="text-sm font-bold text-[#7f2d23]">{copy.title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#7f2d23]/75">{copy.description}</p>
      <Button
        type="button"
        variant="danger"
        className="mt-4 w-full"
        leftIcon={<HiOutlineTrash className="h-4 w-4" />}
        loading={loading}
        onClick={onDelete}
      >
        {copy.button}
      </Button>
    </Card>
  )
}
