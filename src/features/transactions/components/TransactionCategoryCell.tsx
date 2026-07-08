import type { ComponentType } from 'react'
import {
  IoAirplaneOutline,
  IoBookOutline,
  IoBriefcaseOutline,
  IoCarOutline,
  IoCardOutline,
  IoCartOutline,
  IoCashOutline,
  IoEllipsisHorizontalOutline,
  IoFastFoodOutline,
  IoFitnessOutline,
  IoFlashOutline,
  IoGameControllerOutline,
  IoGiftOutline,
  IoHeartOutline,
  IoHomeOutline,
  IoMedkitOutline,
  IoPawOutline,
  IoReceiptOutline,
  IoSchoolOutline,
  IoShirtOutline,
  IoStorefrontOutline,
  IoSwapHorizontalOutline,
  IoTrendingUpOutline,
  IoWalletOutline,
} from 'react-icons/io5'

type IconCmp = ComponentType<{ className?: string }>

const CATEGORY_ICONS: Array<{ keys: string[]; Icon: IconCmp; tone: string }> = [
  { keys: ['makan', 'minum', 'food', 'kuliner', 'kopi', 'cafe', 'resto'], Icon: IoFastFoodOutline, tone: 'bg-orange-100 text-orange-700' },
  { keys: ['transport', 'bensin', 'parkir', 'taxi', 'grab', 'gojek', 'kendara', 'mobil', 'motor'], Icon: IoCarOutline, tone: 'bg-sky-100 text-sky-700' },
  { keys: ['belanja', 'shopping', 'shop'], Icon: IoCartOutline, tone: 'bg-fuchsia-100 text-fuchsia-700' },
  { keys: ['tagih', 'bill'], Icon: IoReceiptOutline, tone: 'bg-amber-100 text-amber-700' },
  { keys: ['hibur', 'enter', 'film', 'game', 'musik'], Icon: IoGameControllerOutline, tone: 'bg-violet-100 text-violet-700' },
  { keys: ['kesehat', 'health', 'obat', 'rumah sakit', 'klinik'], Icon: IoMedkitOutline, tone: 'bg-[#ffe4dc] text-[#b4533f]' },
  { keys: ['pendidik', 'sekolah', 'kursus', 'belajar', 'edu'], Icon: IoSchoolOutline, tone: 'bg-blue-100 text-blue-700' },
  { keys: ['rumah', 'home', 'sewa', 'kost'], Icon: IoHomeOutline, tone: 'bg-teal-100 text-teal-700' },
  { keys: ['pakai', 'baju', 'fashion', 'cloth'], Icon: IoShirtOutline, tone: 'bg-pink-100 text-pink-700' },
  { keys: ['gaji', 'salary', 'penghasil'], Icon: IoCashOutline, tone: 'bg-[#ecfdf5] text-emerald-700' },
  { keys: ['bonus', 'tunjang'], Icon: IoGiftOutline, tone: 'bg-lime-100 text-lime-700' },
  { keys: ['freelance', 'kerja', 'projek'], Icon: IoBriefcaseOutline, tone: 'bg-indigo-100 text-indigo-700' },
  { keys: ['investasi', 'invest', 'saham', 'reksa', 'crypto'], Icon: IoTrendingUpOutline, tone: 'bg-green-100 text-green-700' },
  { keys: ['hadiah', 'gift'], Icon: IoGiftOutline, tone: 'bg-[#ffe4dc] text-[#b4533f]' },
  { keys: ['penjual', 'jualan', 'sales'], Icon: IoStorefrontOutline, tone: 'bg-amber-100 text-amber-700' },
  { keys: ['bunga', 'interest'], Icon: IoWalletOutline, tone: 'bg-[#ecfdf5] text-emerald-700' },
  { keys: ['cashback', 'reward'], Icon: IoCardOutline, tone: 'bg-cyan-100 text-cyan-700' },
  { keys: ['transfer', 'kirim'], Icon: IoSwapHorizontalOutline, tone: 'bg-slate-100 text-slate-700' },
  { keys: ['listrik', 'pln', 'air', 'pdam', 'gas', 'utilit'], Icon: IoFlashOutline, tone: 'bg-yellow-100 text-yellow-700' },
  { keys: ['liburan', 'travel', 'tiket', 'hotel'], Icon: IoAirplaneOutline, tone: 'bg-cyan-100 text-cyan-700' },
  { keys: ['hewan', 'pet', 'kucing', 'anjing'], Icon: IoPawOutline, tone: 'bg-orange-100 text-orange-700' },
  { keys: ['donasi', 'sedekah', 'amal', 'charity'], Icon: IoHeartOutline, tone: 'bg-[#ffe4dc] text-[#b4533f]' },
  { keys: ['buku', 'book'], Icon: IoBookOutline, tone: 'bg-blue-100 text-blue-700' },
  { keys: ['olahraga', 'gym', 'fitness', 'sport'], Icon: IoFitnessOutline, tone: 'bg-[#ecfdf5] text-emerald-700' },
]

export function resolveCategoryIcon(name?: string): { Icon: IconCmp; tone: string } {
  const n = (name || '').toLowerCase()
  if (n) {
    for (const c of CATEGORY_ICONS) {
      if (c.keys.some((k) => n.includes(k))) return { Icon: c.Icon, tone: c.tone }
    }
  }
  return { Icon: IoEllipsisHorizontalOutline, tone: 'bg-slate-100 text-slate-600' }
}

export function CategoryCell({ name }: { name: string }) {
  const { Icon, tone } = resolveCategoryIcon(name)
  return (
    <div className="flex items-center gap-2">
      <div className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' + tone}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="truncate font-medium text-slate-900">{name}</span>
    </div>
  )
}
