import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'
import { Spinner } from '@/components/ui'
import { subscriptionApi } from '@/features/subscription/api'

type ProFeature = 'chat' | 'scan' | 'targets' | 'splitbill' | 'default'

const FEATURE_COPY: Record<ProFeature, {
  eyebrow: string
  title: string
  description: string
  benefits: Array<[string, string]>
}> = {
  chat: {
    eyebrow: 'Chat with AI',
    title: 'Catat transaksi dari kalimat natural.',
    description: 'Ubah catatan seperti “kopi 35 ribu pakai BCA” menjadi transaksi yang siap direview dan disimpan.',
    benefits: [
      ['Input lebih cepat', 'Tulis seperti chat biasa tanpa membuka form panjang.'],
      ['Kategori terbantu', 'AI membantu membaca konteks transaksi.'],
      ['Tetap bisa direview', 'Nominal, dompet, dan kategori bisa dicek sebelum tersimpan.'],
      ['Riwayat lebih rapi', 'Catatan harian masuk ke struktur transaksi SAKU.'],
    ],
  },
  scan: {
    eyebrow: 'Scan Receipt',
    title: 'Ambil data struk tanpa mengetik ulang.',
    description: 'Upload foto struk, lalu SAKU membantu membaca merchant, tanggal, nominal, dan item penting.',
    benefits: [
      ['Merchant otomatis', 'Nama toko dibaca saat tersedia, kosong jika memang tidak terbaca.'],
      ['Nominal lebih praktis', 'Total belanja disiapkan untuk dicek sebelum simpan.'],
      ['Cocok untuk belanja rutin', 'Struk minimarket, restoran, dan kebutuhan rumah lebih mudah dicatat.'],
      ['Kontrol tetap di tangan Anda', 'Hasil scan selalu bisa diedit sebelum menjadi transaksi.'],
    ],
  },
  targets: {
    eyebrow: 'Kantong Tujuan',
    title: 'Bangun target finansial dengan alur yang lebih terarah.',
    description: 'Kelola tujuan tabungan, progres, dan kontribusi agar rencana finansial tidak hanya berhenti di catatan.',
    benefits: [
      ['Progress jelas', 'Pantau capaian target dari nominal yang sudah terkumpul.'],
      ['Prioritas lebih rapi', 'Pisahkan dana liburan, darurat, gadget, atau kebutuhan lain.'],
      ['Terhubung dengan transaksi', 'Kontribusi target dapat ikut terbaca dalam ekosistem SAKU.'],
      ['Lebih mudah konsisten', 'Target membantu keputusan pengeluaran harian.'],
    ],
  },
  splitbill: {
    eyebrow: 'Split Bill',
    title: 'Bagi biaya dengan teman lebih mudah dan transparan.',
    description: 'Catat pengeluaran bersama, siapa yang bayar berapa, dan siapa yang punya hutang. SAKU bantu tracking dan reminder pembayaran.',
    benefits: [
      ['Tracking transparan', 'Semua peserta lihat siapa bayar berapa dan sisa hutang.'],
      ['Share via WhatsApp', 'Kirim daftar pembayaran langsung ke teman via chat.'],
      ['Tandai yang sudah bayar', 'Update progress pembayaran real-time.'],
      ['Kelola peserta fleksibel', 'Tambah/ubah/hapus peserta sesuai kebutuhan.'],
    ],
  },
  default: {
    eyebrow: 'Pro Access',
    title: 'Fitur ini membutuhkan langganan Pro.',
    description: 'Upgrade untuk membuka fitur AI, scan struk, insight pengeluaran, dan workflow lanjutan di SAKU.',
    benefits: [
      ['AI catat transaksi', 'Review sebelum simpan.'],
      ['Scan struk', 'Total dan merchant terbaca otomatis.'],
      ['Insight pengeluaran', 'Pola bulanan lebih mudah dipahami.'],
      ['Target lanjutan', 'Ruang fitur lebih luas.'],
    ],
  },
}

export function ProRoute({ children, feature = 'default' }: { children: ReactNode; feature?: ProFeature }) {
  const activeQ = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: subscriptionApi.active,
    staleTime: 60 * 1000,
  })
  const sub = activeQ.data ?? null
  const hasPro = sub?.status === 'active' || sub?.status === 'trialing'

  if (activeQ.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!hasPro) {
    const copy = FEATURE_COPY[feature]
    return (
      <div className="mx-auto grid min-h-[520px] max-w-5xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block">
          <ProIllustration feature={feature} />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <HiOutlineShieldCheck className="h-4 w-4" />
            {copy.eyebrow}
          </div>
          <h1 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            {copy.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {copy.benefits.map(([title, desc]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
                <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            {/* <button
                type="button"
                onClick={() => checkoutM.mutate()}
                disabled={checkoutM.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-300 disabled:opacity-70"
              >
                {checkoutM.isPending ? 'Memproses...' : 'Lanjut ke Pembayaran Pro'}
                <HiOutlineArrowRight className="h-4 w-4" />
              </button> */}
              <Link
                to="/app/profile"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Cek Status Langganan
              </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function ProIllustration({ feature }: { feature: ProFeature }) {
  if (feature === 'chat') {
    return (
      <svg viewBox="0 0 420 360" role="img" aria-label="Ilustrasi Chat AI Pro" className="h-auto w-full">
        <rect x="72" y="40" width="276" height="280" rx="30" fill="#fff" stroke="#dbeafe" strokeWidth="2" />
        <rect x="102" y="76" width="120" height="14" rx="7" fill="#0f172a" />
        <rect x="102" y="112" width="184" height="52" rx="18" fill="#eff6ff" stroke="#bfdbfe" />
        <rect x="134" y="131" width="116" height="10" rx="5" fill="#2563eb" opacity=".75" />
        <rect x="132" y="184" width="186" height="58" rx="18" fill="#f8fafc" stroke="#e2e8f0" />
        <rect x="158" y="204" width="126" height="10" rx="5" fill="#64748b" />
        <rect x="102" y="264" width="170" height="30" rx="15" fill="#0f172a" />
        <circle cx="304" cy="94" r="34" fill="#2563eb" />
        <path d="M290 95h28M304 81v28" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      </svg>
    )
  }
  if (feature === 'scan') {
    return (
      <svg viewBox="0 0 420 360" role="img" aria-label="Ilustrasi Scan Receipt Pro" className="h-auto w-full">
        <rect x="122" y="42" width="176" height="270" rx="18" fill="#fff" stroke="#dbeafe" strokeWidth="2" />
        <path d="M122 70c22 18 42-18 64 0s42-18 64 0 28-8 48-2v-26H122z" fill="#eff6ff" />
        <rect x="150" y="102" width="80" height="12" rx="6" fill="#0f172a" />
        <rect x="150" y="134" width="120" height="8" rx="4" fill="#94a3b8" />
        <rect x="150" y="158" width="96" height="8" rx="4" fill="#94a3b8" />
        <rect x="150" y="182" width="130" height="8" rx="4" fill="#94a3b8" />
        <rect x="150" y="226" width="92" height="14" rx="7" fill="#2563eb" />
        <rect x="150" y="258" width="120" height="10" rx="5" fill="#0f172a" opacity=".85" />
        <path d="M86 122V86h36M334 86h-36M86 238v36h36M334 274h-36" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" />
      </svg>
    )
  }
  if (feature === 'targets') {
    return (
      <svg viewBox="0 0 420 360" role="img" aria-label="Ilustrasi Target Pro" className="h-auto w-full">
        <circle cx="210" cy="178" r="116" fill="#fff" stroke="#dbeafe" strokeWidth="2" />
        <circle cx="210" cy="178" r="82" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
        <circle cx="210" cy="178" r="44" fill="#fff" stroke="#2563eb" strokeWidth="8" />
        <circle cx="210" cy="178" r="12" fill="#2563eb" />
        <rect x="74" y="270" width="94" height="28" rx="14" fill="#0f172a" />
        <rect x="190" y="270" width="156" height="28" rx="14" fill="#2563eb" />
        <path d="M272 92l36-30v44l-52 52" fill="none" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 420 360" role="img" aria-label="Ilustrasi fitur Pro SAKU" className="h-auto w-full">
      <rect x="60" y="38" width="300" height="270" rx="28" fill="#ffffff" stroke="#dbeafe" strokeWidth="2" />
      <rect x="92" y="78" width="150" height="18" rx="9" fill="#0f172a" />
      <rect x="92" y="112" width="236" height="12" rx="6" fill="#cbd5e1" />
      <rect x="92" y="142" width="236" height="54" rx="16" fill="#eff6ff" stroke="#bfdbfe" />
      <circle cx="124" cy="169" r="16" fill="#2563eb" />
      <path d="M117 169l5 5 10-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="154" y="157" width="126" height="10" rx="5" fill="#1e293b" />
      <rect x="154" y="176" width="82" height="8" rx="4" fill="#94a3b8" />
      <rect x="92" y="214" width="106" height="56" rx="16" fill="#f8fafc" stroke="#e2e8f0" />
      <rect x="222" y="214" width="106" height="56" rx="16" fill="#f8fafc" stroke="#e2e8f0" />
      <path d="M117 248h56M247 248h56" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}
