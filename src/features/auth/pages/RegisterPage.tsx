import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { HiOutlineArrowRight, HiOutlineUser } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { register } from '@/features/auth/api'
import {
  AuthShell,
  Divider,
  Field,
  FieldEmail,
  FieldPassword,
  sanitizeDisplayName,
  sanitizeEmail,
} from '@/features/auth/components/AuthFormParts'
import { GoogleButton } from '@/features/auth/components/GoogleButton'
import { useT } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/authStore'

export function RegisterPage() {
  const t = useT()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const redirect = (data: { token: string; user: { role: string } }) => {
    setSession(data.token, data.user as never)
    toast.success('Akun siap digunakan.')
    navigate('/app', { replace: true })
  }

  const m = useMutation({
    mutationFn: () =>
      register({
        name: sanitizeDisplayName(name),
        email: sanitizeEmail(email),
        password,
      }),
    onSuccess: redirect,
  })

  useEffect(() => {
    if (!m.error) return
    const raw = toErrorMessage(m.error) || ''
    const lowered = raw.toLowerCase()
    const alreadyIndicators = [
      'already',
      'already exists',
      'already registered',
      'exists',
      'sudah terdaftar',
      'terdaftar',
      'sudah kedaftar',
      'resource already exists',
    ]
    const isAlready = alreadyIndicators.some((item) => lowered.includes(item))
    toast.error(
      isAlready ? t.auth.emailAlreadyUsedMessage : raw || t.auth.registerFailedMessage,
      isAlready ? t.auth.emailAlreadyUsedTitle : t.auth.registerFailedTitle,
    )
  }, [m.error, t])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setName(sanitizeDisplayName(name))
    setEmail(sanitizeEmail(email))
    m.mutate()
  }

  return (
    <AuthShell mode="register" title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          icon={HiOutlineUser}
          label={t.auth.name}
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.auth.placeholders.name}
        />
        <FieldEmail value={email} onChange={setEmail} label={t.auth.email} />
        <FieldPassword
          value={password}
          onChange={setPassword}
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
          label={t.auth.password}
          minLength={8}
        />
        <Button
          type="submit"
          className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
          loading={m.isPending}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {t.auth.submitRegister}
        </Button>

        <p className="text-center text-[11px] text-slate-400">{t.auth.registerConsent}</p>
      </form>

      <Divider label={t.auth.dividerOrRegister} />
      <GoogleButton mode="register" onSuccess={redirect} />

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.hasAccount}{' '}
        <Link to="/login" className="font-semibold text-blue-700 hover:underline">
          {t.auth.submitLogin}
        </Link>
      </p>
    </AuthShell>
  )
}
