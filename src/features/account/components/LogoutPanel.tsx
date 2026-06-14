import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'
import { Button, Card } from '@/components/ui'
import { useLocale } from '@/i18n'

export function LogoutPanel({ onLogout }: { onLogout: () => void }) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Sesi Login',
        description: 'Keluar dari perangkat ini jika akun digunakan di komputer bersama.',
        button: 'Logout',
      }
    : {
        title: 'Login Session',
        description: 'Sign out from this device when using a shared computer.',
        button: 'Log out',
      }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineArrowRightOnRectangle className="h-5 w-5 text-[#b4533f]" />
        <h3 className="text-sm font-bold text-[#17120f]">{copy.title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#4f4540]/75">
        {copy.description}
      </p>
      <Button
        type="button"
        variant="danger"
        className="mt-4 w-full"
        leftIcon={<HiOutlineArrowRightOnRectangle className="h-4 w-4" />}
        onClick={onLogout}
      >
        {copy.button}
      </Button>
    </Card>
  )
}
