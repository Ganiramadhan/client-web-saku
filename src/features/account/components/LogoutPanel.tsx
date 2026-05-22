import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'
import { Button, Card } from '@/components/ui'

export function LogoutPanel({ onLogout }: { onLogout: () => void }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineArrowRightOnRectangle className="h-5 w-5 text-rose-600" />
        <h3 className="text-sm font-bold text-slate-900">Sesi Login</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Keluar dari perangkat ini jika akun digunakan di komputer bersama.
      </p>
      <Button
        type="button"
        variant="danger"
        className="mt-4 w-full"
        leftIcon={<HiOutlineArrowRightOnRectangle className="h-4 w-4" />}
        onClick={onLogout}
      >
        Logout
      </Button>
    </Card>
  )
}
