import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiApi, aiLogApi } from '@/features/ai/api'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import type { SelectOption } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import type { TransactionType } from '@/types/api'
import { toast } from '@/lib/toast'
import { getErrorStatus, toErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { confirm } from '@/lib/confirm'
import {
  CHAT_EXAMPLES,
  CHAT_EXAMPLES_EN,
  NLP_EXAMPLES,
  NLP_EXAMPLES_EN,
  categoryTokens,
  chatSessionsFromLogs,
  cleanMerchant,
  cleanReply,
  deriveTitle,
  fetchAllChatLogIds,
  getSpeechCtor,
  inferTransactionDate,
  logIdFromReviewMessage,
  normalizeCategoryName,
  nlpSessionsFromLogs,
  uid,
  type AIMode,
  type ChatSession,
  type ExtractedTx,
  type Message,
  type SpeechRecognitionLike,
  type TxForm,
} from '../utils/freeText'

import {
  AIAvatar,
  BatchActionsCard,
  ChatComposer,
  ChatHeader,
  ChatSidebar,
  EmptyChatState,
  TransactionReviewCard,
  UserAvatar,
} from '../components/FreeTextPanels'

/* ─────────────────────────── Main page ─────────────────────────── */

const FREE_TEXT_DRAFT_KEY = 'saku-free-text-draft-v1'
const FREE_TEXT_SAVED_KEY = 'saku-free-text-saved-reviews-v1'

export function FreeTextPage() {
  const t = useT()
  const { locale } = useLocale()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const aiCopy = locale === 'id'
    ? {
        nlpGuide: [
          'Panduan NLP:',
          '1. Tulis transaksi seperti chat biasa, contoh: "beli kopi 25rb pakai BCA".',
          '2. Untuk banyak transaksi, pisahkan dengan koma.',
          '3. Dompet otomatis memakai dompet utama, tapi tetap bisa diedit di preview.',
          '4. Cek kategori, nominal, dan tanggal sebelum disimpan.',
        ].join('\n'),
        chatGuide: [
          'Panduan Chatbot:',
          '1. Tanya ringkasan, kategori terbesar, atau perbandingan pengeluaran.',
          '2. Gunakan pertanyaan lanjutan seperti "buat lebih singkat" atau "apa saran hematnya?".',
          '3. Jawaban memakai data transaksi yang tersedia di akunmu dan ditulis tanpa format markdown.',
          '4. Kalau bingung, ketik "help" kapan saja untuk melihat panduan ini.',
        ].join('\n'),
        parseFailed: 'Saya belum berhasil menangkap detail transaksinya. Coba tulis lebih spesifik, misalnya: "beli bubur ayam 14rb". Kalau butuh panduan, ketik "help".',
        errorPrefix: 'Maaf, terjadi kesalahan:',
        singleIntro: 'Silakan cek dan konfirmasi detailnya di bawah:',
        batchIntro: (count: number) => `Saya menangkap ${count} transaksi. Pilih yang ingin disimpan, lalu klik "Simpan terpilih".`,
        selectOne: 'Pilih minimal satu transaksi yang ingin disimpan.',
        completeSelected: 'Lengkapi dompet, kategori, dan nominal pada setiap transaksi terpilih.',
        savedCount: (ok: number, fail: number) => `${ok} transaksi tersimpan${fail > 0 ? `, ${fail} gagal` : ''}.`,
        failedCount: (fail: number) => `${fail} transaksi gagal disimpan.`,
        bulkDone: (ok: number) => `✓ ${ok} transaksi berhasil disimpan. Ada yang lain?`,
        bulkPartial: (ok: number, fail: number) => `${ok} tersimpan, ${fail} gagal. Cek kembali kartu yang masih merah.`,
        speechUnsupported: 'Browser ini belum mendukung Speech Recognition.',
      }
    : {
        nlpGuide: [
          'NLP guide:',
          '1. Write a transaction naturally, for example: "coffee 25k using BCA".',
          '2. For multiple transactions, separate them with commas.',
          '3. The default wallet is selected automatically, but you can still edit it in preview.',
          '4. Review category, amount, and date before saving.',
        ].join('\n'),
        chatGuide: [
          'Chatbot guide:',
          '1. Ask for summaries, largest categories, or spending comparisons.',
          '2. Use follow-ups like "make it shorter" or "what should I reduce?".',
          '3. Answers use your available transaction data and stay clean without markdown styling.',
          '4. Type "help" anytime to see this guide.',
        ].join('\n'),
        parseFailed: 'I could not detect the transaction details yet. Try something more specific, for example: "chicken porridge 14k". Type "help" if you need guidance.',
        errorPrefix: 'Sorry, something went wrong:',
        singleIntro: 'Please review and confirm the details below:',
        batchIntro: (count: number) => `I found ${count} transactions. Select the ones to save, then click "Save selected".`,
        selectOne: 'Select at least one transaction to save.',
        completeSelected: 'Complete wallet, category, and amount for each selected transaction.',
        savedCount: (ok: number, fail: number) => `${ok} transactions saved${fail > 0 ? `, ${fail} failed` : ''}.`,
        failedCount: (fail: number) => `${fail} transactions failed to save.`,
        bulkDone: (ok: number) => `✓ ${ok} transactions saved. Anything else?`,
        bulkPartial: (ok: number, fail: number) => `${ok} saved, ${fail} failed. Review the cards that still need attention.`,
        speechUnsupported: 'This browser does not support Speech Recognition.',
      }

  const [initialDraft] = useState(() => loadFreeTextDraft(locale, user?.id))

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (initialDraft.sessions.length > 0) return initialDraft.sessions
    const fresh = createEmptySession(locale)
    return [fresh]
  })

  const [activeId, setActiveId] = useState<string | null>(() => initialDraft.activeId ?? sessions[0]?.id ?? null)

  const [text, setText] = useState('')
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [listening, setListening] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const savingIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    saveFreeTextDraft(sessions, activeId, user?.id)
  }, [sessions, activeId, user?.id])

  useEffect(() => {
    const nextDraft = loadFreeTextDraft(locale, user?.id)
    if (nextDraft.sessions.length > 0) {
      setSessions(nextDraft.sessions)
      setActiveId(nextDraft.activeId ?? nextDraft.sessions[0]?.id ?? null)
      return
    }
    const fresh = createEmptySession(locale)
    setSessions([fresh])
    setActiveId(fresh.id)
  }, [user?.id, locale])

  const wallets = useQuery({ queryKey: ['wallets', user?.id], queryFn: walletApi.list, enabled: Boolean(user?.id) })
  const categories = useQuery({
    queryKey: ['categories', 'all', user?.id],
    queryFn: () => categoryApi.list(),
    enabled: Boolean(user?.id),
  })
  const chatLogs = useQuery({
    queryKey: ['ai-logs', 'chat-history', user?.id],
    queryFn: () => aiLogApi.chatHistory(1, 50),
    enabled: Boolean(user?.id),
  })
  const nlpLogs = useQuery({
    queryKey: ['ai-logs', 'nlp-history', user?.id],
    queryFn: () => aiLogApi.nlpHistory(1, 50),
    enabled: Boolean(user?.id),
  })

  useEffect(() => {
    const dbSessions = applySavedReviewSignatures([
      ...(chatLogs.data ? chatSessionsFromLogs(chatLogs.data.data) : []),
      ...(nlpLogs.data ? nlpSessionsFromLogs(nlpLogs.data.data) : []),
    ].filter(Boolean) as ChatSession[], user?.id)

    const timer = window.setTimeout(() => {
      let shouldActivateDb = false
      setSessions((prev) => {
        const currentSession = prev.find((session) => session.id === activeId)
        shouldActivateDb = dbSessions.length > 0 && (!activeId || !currentSession || currentSession.messages.length === 0)
        const dbIds = new Set(dbSessions.map((session) => session.id))
        const dbBySignature = new Map(
          dbSessions
            .map((session) => [sessionHistorySignature(session), session] as const)
            .filter(([signature]) => Boolean(signature)),
        )
        const keepLocalSignatures = new Set<string>()
        const transient = prev.filter((session) => {
          if (dbIds.has(session.id) || session.id.startsWith('legacy-') || session.id.startsWith('db-')) return false
          const signature = sessionHistorySignature(session)
          const dbMatch = signature ? dbBySignature.get(signature) : null
          if (dbMatch && session.id === activeId && shouldKeepActiveLocalSession(session)) {
            keepLocalSignatures.add(signature)
            return true
          }
          return !dbMatch
        })
        const nextDbSessions = dbSessions.filter((session) => {
          const signature = sessionHistorySignature(session)
          return !signature || !keepLocalSignatures.has(signature)
        })
        const next = [...nextDbSessions, ...transient]
        if (next.length > 0) return next.sort((a, b) => b.updatedAt - a.updatedAt)
        return [
          {
            id: uid(),
            mode: 'nlp' as AIMode,
            title: locale === 'id' ? 'Chat baru' : 'New chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]
      })
      if (shouldActivateDb && dbSessions[0]) setActiveId(dbSessions[0].id)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [chatLogs.data, nlpLogs.data, activeId, locale, user?.id])

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  )
  const mode: AIMode = active?.mode ?? 'nlp'
  const messages: Message[] = active?.messages ?? []

  const updateActive = useCallback(
    (mut: (m: Message[]) => Message[]) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s
          const newMessages = mut(s.messages)
          return {
            ...s,
            messages: newMessages,
            title: deriveTitle(newMessages) || s.title,
            updatedAt: Date.now(),
          }
        }),
      )
    },
    [activeId],
  )

  const showHelp = useCallback(() => {
    const guide = mode === 'nlp' ? aiCopy.nlpGuide : aiCopy.chatGuide
    updateActive((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'assistant',
        content: guide,
      },
    ])
  }, [aiCopy.chatGuide, aiCopy.nlpGuide, mode, updateActive])

  const handleNew = (m: AIMode) => {
    const fresh: ChatSession = {
      id: uid(),
      mode: m,
      title: locale === 'id' ? 'Chat baru' : 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSessions((prev) => [fresh, ...prev])
    setActiveId(fresh.id)
    setSidebarOpen(false)
    setText('')
  }

  const handleSwitchMode = (m: AIMode) => {
    const latest = [...sessions]
      .filter((s) => s.mode === m)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    if (latest) {
      setActiveId(latest.id)
      setSidebarOpen(false)
      setText('')
      return
    }
    handleNew(m)
  }

  const handleDelete = async (id: string) => {
    const target = sessions.find((s) => s.id === id)
    if (target?.logIds?.length) {
      try {
        await aiLogApi.deleteMany(target.logIds)
        qc.invalidateQueries({ queryKey: ['ai-logs', 'chat-history', user?.id] })
        qc.invalidateQueries({ queryKey: ['ai-logs', 'nlp-history', user?.id] })
        toast.success(locale === 'id' ? 'Riwayat berhasil dihapus' : 'History deleted')
      } catch (error) {
        if (getErrorStatus(error) !== 404) {
          toast.error(toErrorMessage(error))
          return
        }
      }
    }
    setSessions((prev) => {
      let next = prev.filter((s) => s.id !== id)
      if (next.length === 0) {
        const fresh: ChatSession = {
          id: uid(),
          mode: target?.mode ?? mode,
          title: locale === 'id' ? 'Chat baru' : 'New chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        next = [fresh]
      }
      if (id === activeId || !next.some((s) => s.id === activeId)) {
        setActiveId(next[0]?.id ?? null)
      }
      return next
    })
  }

  const handleDeleteAll = async () => {
    const modeSessions = sessions.filter((session) => session.mode === mode)
    const hasMessages = modeSessions.some((session) => session.messages.length > 0)
    const localLogIds = modeSessions.flatMap((session) => session.logIds ?? [])
    if (!hasMessages && localLogIds.length === 0) return

    const ok = await confirm({
      title: locale === 'id' ? 'Hapus semua riwayat mode ini?' : 'Delete all history for this mode?',
      description: locale === 'id'
        ? 'Riwayat pada mode yang sedang aktif akan dihapus. Transaksi yang sudah disimpan tetap aman.'
        : 'History for the active mode will be deleted. Saved transactions remain safe.',
      tone: 'danger',
      confirmLabel: locale === 'id' ? 'Hapus Semua' : 'Delete All',
    })
    if (!ok) return

    try {
      const localModeLogIds = sessions
        .filter((session) => session.mode === mode)
        .flatMap((session) => session.logIds ?? [])
      const logIds = localModeLogIds.length > 0 ? localModeLogIds : await fetchAllChatLogIds(mode)
      if (logIds.length > 0) await aiLogApi.deleteMany(logIds)
      qc.invalidateQueries({ queryKey: ['ai-logs', 'chat-history', user?.id] })
      qc.invalidateQueries({ queryKey: ['ai-logs', 'nlp-history', user?.id] })
    } catch (error) {
      if (getErrorStatus(error) !== 404) {
        toast.error(toErrorMessage(error))
        return
      }
    }

    const fresh: ChatSession = {
      id: uid(),
      mode,
      title: locale === 'id' ? 'Chat baru' : 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSessions((prev) => [fresh, ...prev.filter((session) => session.mode !== mode)])
    setActiveId(fresh.id)
    setSidebarOpen(false)
    toast.success(locale === 'id' ? 'Riwayat berhasil dihapus' : 'History deleted')
  }

  /* scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, activeId])

  /* textarea autosize */
  const adjustTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  /* category lookup */
  const findCategoryId = useCallback(
    (categoryName?: string, type?: TransactionType, context?: string): string | undefined => {
      const wanted = normalizeCategoryName([categoryName, context].filter(Boolean).join(' '))
      if (!wanted) return undefined
      const scoped = (categories.data ?? []).filter((c) => !type || c.type === type)
      const exact = scoped.find((c) => {
        const current = normalizeCategoryName(c.name)
        return current === wanted || current.includes(wanted) || wanted.includes(current)
      })
      if (exact) return exact.id
      const tokens = categoryTokens(wanted)
      return scoped.find((c) => {
        const current = normalizeCategoryName(c.name)
        return tokens.some((token) => current.includes(token))
      })?.id
    },
    [categories.data],
  )

  const resolveWalletIdFromText = useCallback(
    (inputText: string): string | undefined => {
      const normalizedText = normalizeCategoryName(inputText)
      if (!normalizedText) return undefined
      const list = wallets.data ?? []
      const textTokens = new Set(normalizedText.split(' ').filter((token) => token.length >= 2))

      const normalizedWallets = list.map((wallet) => {
        const name = normalizeCategoryName(wallet.name)
        const shortName = name
          .replace(/\b(bank|rekening|akun|account|wallet|dompet)\b/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        const tokens = shortName
          .split(' ')
          .filter((token) => token.length >= 2 && !['bank', 'rekening', 'akun', 'account', 'wallet', 'dompet', 'dari', 'ke', 'pake', 'pakai', 'masuk', 'masukan', 'masukkan', 'untuk'].includes(token))
        return { id: wallet.id, name, shortName, tokens }
      })

      const exact = normalizedWallets.find((wallet) => wallet.name && normalizedText.includes(wallet.name))
      if (exact) return exact.id

      const cashMentioned = /\b(cash|tunai|uang tunai|kas)\b/.test(normalizedText)
      if (cashMentioned) {
        const cashWallet = normalizedWallets.find((wallet) =>
          /\b(cash|tunai|kas)\b/.test(wallet.name) ||
          /\b(cash|tunai|kas)\b/.test(wallet.shortName),
        )
        if (cashWallet) return cashWallet.id
      }

      let best: { id: string; score: number } | null = null
      for (const wallet of normalizedWallets) {
        let score = 0
        if (wallet.shortName && normalizedText.includes(wallet.shortName)) score += 80
        const matchedTokens = wallet.tokens.filter((token) => textTokens.has(token))
        if (wallet.tokens.length > 0 && matchedTokens.length === wallet.tokens.length) {
          score += 65 + wallet.tokens.length
        } else if (matchedTokens.length > 0) {
          score += matchedTokens.reduce((sum, token) => sum + (token.length >= 4 ? 18 : 10), 0)
        }
        if (score > (best?.score ?? 0)) best = { id: wallet.id, score }
      }
      return best && best.score >= 18 ? best.id : undefined
    },
    [wallets.data],
  )

  const resolveWalletIdForItem = useCallback(
    (inputText: string, item: ExtractedTx): string | undefined => {
      const direct = resolveWalletIdFromText([
        item.wallet_hint,
        item.description,
        item.merchant_name,
        item.category,
      ].filter(Boolean).join(' '))
      if (direct) return direct

      const segment = findAmountSegmentForWallet(inputText, Number(item.amount || 0))
      return resolveWalletIdFromText(segment) ?? resolveWalletIdFromText(inputText)
    },
    [resolveWalletIdFromText],
  )

  /* ─── Mutations ─── */
  const categorizeMutation = useMutation({
    mutationFn: (inputText: string) => aiApi.categorize({ text: inputText, session_id: active?.id ?? activeId ?? undefined, language: detectPreferredLanguage(inputText, locale) }),
    onSuccess: (data, inputText) => {
      // Prefer the multi-transaction array when the model returned one.
      // Fallback to the single top-level fields for older responses.
      const items =
        data.transactions && data.transactions.length > 0
          ? data.transactions
          : data.amount > 0 || data.merchant_name || data.category
            ? [
                {
                  amount: data.amount,
                  merchant_name: cleanMerchant(data.merchant_name),
                  category: data.category,
                  type: data.type,
                  confidence: data.confidence,
                  description: inputText,
                  date: data.date ?? data.transaction_date,
                  wallet_hint: data.raw_response?.wallet_hint as string | undefined,
                },
              ]
            : []

      const usableItems = items.filter((item) => Number(item.amount || 0) > 0)

      if (usableItems.length === 0) {
        updateActive((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content:
              aiCopy.parseFailed,
          },
        ])
        return
      }

      const isBatch = usableItems.length > 1
      const batchId = isBatch ? uid() : undefined

      const intro: Message = {
        id: uid(),
        role: 'assistant',
        content: isBatch
          ? aiCopy.batchIntro(usableItems.length)
          : aiCopy.singleIntro,
      }
      const reviewMsgs: Message[] = usableItems.map((item) => {
        const type = (item.type as TransactionType) || 'expense'
        const transactionDate = inferTransactionDate(inputText, item.date ?? item.transaction_date ?? data.date ?? data.transaction_date)
        const walletId =
          resolveWalletIdForItem(inputText, item) ??
          wallets.data?.find((w) => w.is_default)?.id ??
          wallets.data?.[0]?.id ??
          ''
        const form: TxForm = {
          wallet_id: walletId,
          category_id: findCategoryId(item.category, type, `${item.description ?? ''} ${item.merchant_name ?? ''} ${inputText}`) || '',
          amount: item.amount || 0,
          type,
          merchant_name: cleanMerchant(item.merchant_name),
          description: item.description || inputText,
          transaction_date: transactionDate,
        }
        return {
          id: uid(),
          role: 'assistant',
          content: '',
          type: 'transaction-review',
          extractedData: {
            amount: item.amount,
            merchant_name: cleanMerchant(item.merchant_name),
            category: item.category,
            type: item.type,
            confidence: item.confidence,
            description: item.description,
            wallet_hint: item.wallet_hint,
            date: transactionDate,
            transaction_date: transactionDate,
          },
          form,
          batchId,
          selected: isBatch ? true : undefined,
        }
      })
      const batchActions: Message[] = isBatch
        ? [
            {
              id: uid(),
              role: 'assistant',
              content: '',
              type: 'batch-actions',
              batchId,
            },
          ]
        : []
      // Render order: intro → review cards → batch actions toolbar (at the bottom).
      updateActive((prev) => [...prev, intro, ...reviewMsgs, ...batchActions])
    },
    onError: (e) => {
      updateActive((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
            content: `${aiCopy.errorPrefix} ${toErrorMessage(e)}`,
        },
      ])
    },
  })

  const chatMutation = useMutation({
    mutationFn: (msg: string) => {
      // Send the last 6 textual turns so the AI can resolve follow-ups like
      // "buat list" or "format json" against the previous answer.
      const prior = (active?.messages ?? [])
        .filter(
          (m) =>
            (m.role === 'user' || m.role === 'assistant') &&
            m.type !== 'transaction-review' &&
            m.type !== 'batch-actions' &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0,
        )
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      return aiApi.chat({ message: msg, include_context: true, history: prior, session_id: active?.id ?? activeId ?? undefined, language: detectPreferredLanguage(msg, locale) })
    },
    onSuccess: (data) => {
      updateActive((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: cleanReply(data.reply) },
      ])
      window.setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['ai-logs', 'chat-history', user?.id] })
      }, 800)
    },
    onError: (e) => {
      updateActive((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: `${aiCopy.errorPrefix} ${toErrorMessage(e)}`,
        },
      ])
    },
  })

  const saveMutation = useMutation({
    mutationFn: ({
      form,
      extractedData,
      messageId,
    }: {
      form: TxForm
      extractedData?: ExtractedTx
      messageId: string
      silent?: boolean
    }) => {
      if (messageId && savingIdsRef.current.has(messageId)) {
        return Promise.reject(new Error(locale === 'id' ? 'Transaksi ini sedang diproses.' : 'This transaction is already being processed.'))
      }
      savingIdsRef.current.add(messageId)
      const dateObj = form.transaction_date.includes('T')
        ? new Date(form.transaction_date)
        : new Date(form.transaction_date + 'T00:00:00')
      return transactionApi.create({
        wallet_id: form.wallet_id,
        category_id: form.category_id,
        amount: Number(form.amount),
        type: form.type,
        transaction_date: dateObj.toISOString(),
        source: 'ai_ocr' as const,
        confidence_score: extractedData?.confidence,
        ...(form.merchant_name && { merchant_name: form.merchant_name }),
        ...(form.description && { description: form.description }),
      })
    },
    onSuccess: async (_data, vars) => {
      rememberSavedReview(vars.form, vars.extractedData, user?.id)
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      setSavingMessageId(null)
      savingIdsRef.current.delete(vars.messageId)
      updateActive((prev) =>
        prev.map((m) => (m.id === vars.messageId ? { ...m, saved: true } : m)),
      )
      const logId = logIdFromReviewMessage(vars.messageId)
      if (logId) {
        await aiLogApi.deleteMany([logId]).catch(() => undefined)
        qc.invalidateQueries({ queryKey: ['ai-logs', 'nlp-history', user?.id] })
      }
      if (!vars.silent) {
        toast.success(locale === 'id' ? 'Transaksi tersimpan!' : 'Transaction saved!')
        updateActive((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: locale === 'id'
              ? 'Transaksi berhasil disimpan! Mau catat transaksi lain?'
              : 'Transaction saved successfully. Want to record another one?',
          },
        ])
      }
    },
    onError: (e, vars) => {
      toast.error(toErrorMessage(e))
      setSavingMessageId(null)
      savingIdsRef.current.delete(vars.messageId)
    },
  })

  /* ─── Bulk save (multi-transaction batch) ─── */
  const [bulkSavingBatchId, setBulkSavingBatchId] = useState<string | null>(null)
  const handleBulkSave = useCallback(
    async (batchId: string) => {
      const targets = (active?.messages ?? []).filter(
        (m) =>
          m.batchId === batchId &&
          m.type === 'transaction-review' &&
          m.selected &&
          !m.saved &&
          m.form,
      )
      if (targets.length === 0) {
        toast.error(aiCopy.selectOne)
        return
      }
      // Validate each card has wallet + category + positive amount.
      const invalid = targets.find(
        (m) =>
          !m.form?.wallet_id ||
          !m.form?.category_id ||
          !m.form?.amount ||
          m.form.amount <= 0,
      )
      if (invalid) {
        toast.error(aiCopy.completeSelected)
        return
      }

      setBulkSavingBatchId(batchId)
      let ok = 0
      let fail = 0
      for (const msg of targets) {
        try {
          await saveMutation.mutateAsync({
            form: msg.form!,
            extractedData: msg.extractedData,
            messageId: msg.id,
            silent: true,
          })
          ok += 1
        } catch {
          fail += 1
        }
      }
      setBulkSavingBatchId(null)
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      if (ok > 0) toast.success(aiCopy.savedCount(ok, fail))
      else if (fail > 0) toast.error(aiCopy.failedCount(fail))
      if (ok > 0 && fail === 0) {
        const logIds = Array.from(
          new Set(targets.map((msg) => logIdFromReviewMessage(msg.id)).filter(Boolean)),
        ) as string[]
        if (logIds.length > 0) {
          await aiLogApi.deleteMany(logIds).catch(() => undefined)
          qc.invalidateQueries({ queryKey: ['ai-logs', 'nlp-history', user?.id] })
        }
      }
      updateActive((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content:
            fail === 0
              ? aiCopy.bulkDone(ok)
              : aiCopy.bulkPartial(ok, fail),
        },
      ])
    },
    [active?.messages, saveMutation, qc, updateActive],
  )

  const handleBulkCancel = useCallback(
    (batchId: string) => {
      updateActive((prev) =>
        prev.filter(
          (m) =>
            !(
              m.batchId === batchId &&
              (m.type === 'transaction-review' || m.type === 'batch-actions') &&
              !m.saved
            ),
        ),
      )
    },
    [updateActive],
  )

  const handleToggleSelect = useCallback(
    (messageId: string) => {
      updateActive((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, selected: !m.selected } : m,
        ),
      )
    },
    [updateActive],
  )

  const handleBatchSelectAll = useCallback(
    (batchId: string, value: boolean) => {
      updateActive((prev) =>
        prev.map((m) =>
          m.batchId === batchId && m.type === 'transaction-review' && !m.saved
            ? { ...m, selected: value }
            : m,
        ),
      )
    },
    [updateActive],
  )

  const handleUpdateForm = useCallback(
    (messageId: string, form: TxForm) => {
      updateActive((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, form } : m)),
      )
    },
    [updateActive],
  )

  const isPending = categorizeMutation.isPending || chatMutation.isPending

  /* ─── Send ─── */
  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isPending || !activeId) return
    updateActive((prev) => [...prev, { id: uid(), role: 'user', content: trimmed }])
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    if (/^(help|bantuan|panduan)$/i.test(trimmed)) {
      window.setTimeout(showHelp, 0)
      return
    }
    if (mode === 'nlp') categorizeMutation.mutate(trimmed)
    else chatMutation.mutate(trimmed)
  }

  /* ─── Voice ─── */
  const speechCtor = useMemo(() => getSpeechCtor(), [])
  const startVoice = () => {
    if (!speechCtor) {
      toast.error(aiCopy.speechUnsupported)
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const rec = new speechCtor()
    rec.lang = 'id-ID'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      setText((finalText + interim).trimStart())
      adjustTextarea()
    }
    rec.onerror = () => {
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        /* ignore */
      }
    },
    [],
  )

  const walletOptions: SelectOption[] = (wallets.data ?? []).map((w) => ({
    value: w.id,
    label: w.name,
  }))
  const defaultWalletId = wallets.data?.find((w) => w.is_default)?.id ?? wallets.data?.[0]?.id ?? ''
  const categoryOptions = (type: TransactionType): SelectOption[] =>
    (categories.data?.filter((c) => c.type === type) ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    }))
  const resolveReviewForm = useCallback(
    (message: Message): TxForm | undefined => {
      if (!message.form) return undefined
      const form = message.form
      const categoryId =
        form.category_id ||
        findCategoryId(
          message.extractedData?.category,
          form.type,
          `${message.extractedData?.description ?? ''} ${message.extractedData?.merchant_name ?? ''} ${form.description ?? ''}`,
        ) ||
        ''

      return {
        ...form,
        wallet_id: form.wallet_id || defaultWalletId,
        category_id: categoryId,
      }
    },
    [defaultWalletId, findCategoryId],
  )

  useEffect(() => {
    const defaultWallet = wallets.data?.find((w) => w.is_default)?.id ?? wallets.data?.[0]?.id
    if (!defaultWallet) return
    const timer = window.setTimeout(() => {
      setSessions((prev) =>
        prev.map((session) =>
          ({
            ...session,
            messages: session.messages.map((message) =>
              message.type === 'transaction-review' && message.form && !message.form.wallet_id && !message.saved
                ? { ...message, form: { ...message.form, wallet_id: defaultWallet } }
                : message,
            ),
          }),
        ),
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [wallets.data])

  useEffect(() => {
    if (!categories.data?.length) return
    const timer = window.setTimeout(() => {
      setSessions((prev) =>
        prev.map((session) =>
          ({
            ...session,
            messages: session.messages.map((message) => {
              if (
                message.type !== 'transaction-review' ||
                !message.form ||
                message.form.category_id ||
                !message.extractedData?.category ||
                message.saved
              ) {
                return message
              }
              const categoryId = findCategoryId(
                message.extractedData.category,
                message.form.type,
                `${message.extractedData.description ?? ''} ${message.extractedData.merchant_name ?? ''} ${message.form.description ?? ''}`,
              )
              return categoryId
                ? { ...message, form: { ...message.form, category_id: categoryId } }
                : message
            }),
          }),
        ),
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [categories.data, findCategoryId])

  const examples = mode === 'nlp'
    ? locale === 'id' ? NLP_EXAMPLES : NLP_EXAMPLES_EN
    : locale === 'id' ? CHAT_EXAMPLES : CHAT_EXAMPLES_EN

  return (
    <div className="relative flex h-[calc(100dvh-5.75rem)] min-h-[560px] overflow-hidden rounded-xl border border-white/80 bg-white/30 shadow-lg shadow-slate-200/30 backdrop-blur-xl sm:h-[calc(100dvh-8rem)] sm:min-h-[680px] sm:rounded-2xl">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-20 bottom-10 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" style={{ animationDelay: '2s' }} />
      </div>
      <ChatSidebar
        sessions={sessions}
        activeId={activeId}
        activeMode={mode}
        onSelect={(id) => {
          setActiveId(id)
          setSidebarOpen(false)
        }}
        onNew={handleNew}
        onSwitchMode={handleSwitchMode}
        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onClose={() => setSidebarOpen(false)}
        mobileOpen={sidebarOpen}
      />

      {/* Main panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatHeader
          title={(active?.title === 'Chat baru' && locale === 'en') ? 'New chat' : active?.title ?? t.freeText.title}
          mode={mode}
          onOpenSidebar={() => setSidebarOpen(true)}
          onHelp={showHelp}
          onNew={() => handleNew(mode)}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.length === 0 && (
              <EmptyChatState
                mode={mode}
                examples={examples}
                onPickExample={(example) => {
                  setText(example)
                  textareaRef.current?.focus()
                }}
              />
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <AIAvatar />
                )}

                <div
                  className={cn(
                    msg.type === 'transaction-review' || msg.type === 'batch-actions'
                      ? 'min-w-0 flex-1 sm:max-w-xl lg:max-w-2xl'
                      : 'max-w-[82%] sm:max-w-sm lg:max-w-md',
                    msg.role === 'user' ? 'flex flex-col items-end' : '',
                  )}
                >
                  {msg.content ? (
                    <div
                      className={cn(
                        'whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-800',
                      )}
                    >
                      {msg.content}
                    </div>
                  ) : null}

                  {msg.type === 'batch-actions' && msg.batchId && (
                    <BatchActionsCard
                      batchId={msg.batchId}
                      messages={active?.messages ?? []}
                      onBulkSave={handleBulkSave}
                      onBulkCancel={handleBulkCancel}
                      onSelectAll={handleBatchSelectAll}
                      isSaving={bulkSavingBatchId === msg.batchId}
                    />
                  )}

                  {msg.type === 'transaction-review' && msg.extractedData && msg.form ? (() => {
                    const resolvedForm = resolveReviewForm(msg)
                    const resolvedMessage = resolvedForm ? { ...msg, form: resolvedForm } : msg
                    return (
                      <TransactionReviewCard
                        message={resolvedMessage}
                        walletOptions={walletOptions}
                        categoryOptions={categoryOptions}
                        isSaving={
                          (savingMessageId === msg.id && saveMutation.isPending) ||
                          (!!msg.batchId && bulkSavingBatchId === msg.batchId)
                        }
                        onSave={(form) => {
                          if (msg.saved || savingIdsRef.current.has(msg.id)) return
                          setSavingMessageId(msg.id)
                          saveMutation.mutate({
                            form,
                            extractedData: msg.extractedData,
                            messageId: msg.id,
                          })
                        }}
                        onFormChange={(form) => handleUpdateForm(msg.id, form)}
                        onToggleSelect={
                          msg.batchId ? () => handleToggleSelect(msg.id) : undefined
                        }
                      />
                    )
                  })() : null}
                </div>

                {msg.role === 'user' && (
                  <UserAvatar photoUrl={user?.photo_url} name={user?.name} />
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-center gap-3">
                <AIAvatar />
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatComposer
          value={text}
          mode={mode}
          isPending={isPending}
          listening={listening}
          speechSupported={!!speechCtor}
          textareaRef={textareaRef}
          onChange={(value) => {
            setText(value)
            adjustTextarea()
          }}
          onSend={handleSend}
          onStartVoice={startVoice}
        />
      </div>
    </div>
  )
}

function sessionHistorySignature(session: ChatSession): string {
  const firstUserMessage = session.messages.find((message) => message.role === 'user' && message.content.trim())
  if (!firstUserMessage) return ''
  return `${session.mode}:${firstUserMessage.content.trim().toLowerCase()}`
}

function hasOpenReview(session: ChatSession): boolean {
  return session.messages.some((message) => message.type === 'transaction-review' && !message.saved)
}

function shouldKeepActiveLocalSession(session: ChatSession): boolean {
  return session.messages.length > 0 && (!session.logIds?.length || hasOpenReview(session))
}

function createEmptySession(locale: 'id' | 'en'): ChatSession {
  return {
    id: uid(),
    mode: 'nlp',
    title: locale === 'id' ? 'Chat baru' : 'New chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function scopedStorageKey(base: string, userId?: string | null): string {
  return userId ? `${base}:${userId}` : `${base}:anonymous`
}

function loadFreeTextDraft(locale: 'id' | 'en', userId?: string | null): { sessions: ChatSession[]; activeId: string | null } {
  if (typeof window === 'undefined') return { sessions: [], activeId: null }
  try {
    const raw = window.localStorage.getItem(scopedStorageKey(FREE_TEXT_DRAFT_KEY, userId))
    if (!raw) return { sessions: [], activeId: null }
    const parsed = JSON.parse(raw) as { sessions?: ChatSession[]; activeId?: string | null }
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter((session) =>
          session &&
          typeof session.id === 'string' &&
          (session.mode === 'nlp' || session.mode === 'chatbot') &&
          Array.isArray(session.messages),
        )
      : []
    return {
      sessions: applySavedReviewSignatures(sessions.map((session) => ({
        ...session,
        title: session.title === 'Chat baru' && locale === 'en' ? 'New chat' : session.title,
        createdAt: Number(session.createdAt) || Date.now(),
        updatedAt: Number(session.updatedAt) || Date.now(),
      })), userId),
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
    }
  } catch {
    return { sessions: [], activeId: null }
  }
}

function saveFreeTextDraft(sessions: ChatSession[], activeId: string | null, userId?: string | null) {
  if (typeof window === 'undefined') return
  try {
    const keep = sessions
      .filter((session) => session.messages.length > 0 || !session.logIds?.length)
      .slice(0, 60)
    window.localStorage.setItem(scopedStorageKey(FREE_TEXT_DRAFT_KEY, userId), JSON.stringify({ sessions: applySavedReviewSignatures(keep, userId), activeId }))
  } catch {
    // Ignore quota/storage errors; server history remains the source of truth.
  }
}

function rememberSavedReview(form: TxForm, extractedData?: ExtractedTx, userId?: string | null) {
  if (typeof window === 'undefined') return
  try {
    const signatures = new Set(readSavedReviewSignatures(userId))
    signatures.add(reviewSignatureFromForm(form))
    signatures.add(reviewSignatureFromReview(form, extractedData))
    window.localStorage.setItem(scopedStorageKey(FREE_TEXT_SAVED_KEY, userId), JSON.stringify(Array.from(signatures).slice(-500)))
  } catch {
    // Local dedupe is best-effort; server transaction creation remains authoritative.
  }
}

function readSavedReviewSignatures(userId?: string | null): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(scopedStorageKey(FREE_TEXT_SAVED_KEY, userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function applySavedReviewSignatures(sessions: ChatSession[], userId?: string | null): ChatSession[] {
  const signatures = new Set(readSavedReviewSignatures(userId))
  if (signatures.size === 0) return sessions
  return sessions.map((session) => ({
    ...session,
    messages: session.messages.map((message) => {
      if (message.type !== 'transaction-review' || !message.form) return message
      return signatures.has(reviewSignatureFromForm(message.form)) || signatures.has(reviewSignatureFromReview(message.form, message.extractedData))
        ? { ...message, saved: true }
        : message
    }),
  }))
}

function reviewSignatureFromForm(form: TxForm): string {
  return [
    form.wallet_id,
    form.category_id,
    form.type,
    Number(form.amount || 0).toFixed(2),
    (form.transaction_date || '').slice(0, 10),
    form.merchant_name.trim().toLowerCase(),
    form.description.trim().toLowerCase(),
  ].join('|')
}

function reviewSignatureFromReview(form: TxForm, extractedData?: ExtractedTx): string {
  const txDate = extractedData?.transaction_date ?? extractedData?.date ?? form.transaction_date
  const merchant = cleanMerchant(extractedData?.merchant_name ?? form.merchant_name)
  const description = (extractedData?.description ?? form.description ?? '').trim().toLowerCase()
  return [
    'review',
    extractedData?.type ?? form.type,
    Number(extractedData?.amount ?? form.amount ?? 0).toFixed(2),
    inferTransactionDate(description, txDate).slice(0, 10),
    merchant.trim().toLowerCase(),
    description,
  ].join('|')
}

function findAmountSegmentForWallet(inputText: string, amount: number): string {
  if (!inputText.trim() || amount <= 0) return ''
  const decimalSafeText = inputText.replace(/(\d)[,.](\d)/g, '$1<decimal>$2')
  const parts = decimalSafeText
    .split(/[,.;]|\b(?:dan|lalu|terus|kemudian|then)\b/i)
    .map((part) => part.replace(/<decimal>/g, ',').trim())
    .filter(Boolean)
  if (parts.length === 0) return ''

  const amountTokens = amountMentionTokens(amount).map((token) => normalizeCategoryName(token))
  const normalizedParts = parts.map((part) => normalizeCategoryName(part))
  const index = normalizedParts.findIndex((part) => amountTokens.some((token) => token && part.includes(token)))
  if (index < 0) return ''

  return [
    parts[index],
    parts[index + 1] ?? '',
    parts[index - 1] ?? '',
  ].filter(Boolean).join(' ')
}

function amountMentionTokens(amount: number): string[] {
  const rounded = Math.round(amount)
  const tokens = new Set<string>([
    String(rounded),
    rounded.toLocaleString('id-ID'),
    rounded.toLocaleString('en-US'),
  ])

  if (rounded >= 1000 && rounded % 1000 === 0) {
    const thousands = rounded / 1000
    tokens.add(`${formatCompactAmount(thousands)} ribu`)
    tokens.add(`${formatCompactAmount(thousands)} rb`)
    tokens.add(`${formatCompactAmount(thousands)}rb`)
    tokens.add(`${formatCompactAmount(thousands)} k`)
    tokens.add(`${formatCompactAmount(thousands)}k`)
  }

  if (rounded >= 1_000_000 && rounded % 100_000 === 0) {
    const millions = rounded / 1_000_000
    tokens.add(`${formatCompactAmount(millions)} juta`)
    tokens.add(`${formatCompactAmount(millions)} jt`)
    tokens.add(`${formatCompactAmount(millions)}jt`)
  }

  return Array.from(tokens)
}

function formatCompactAmount(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(value).replace('.', ',')
}

function detectPreferredLanguage(text: string, fallback: 'id' | 'en'): 'id' | 'en' {
  const normalized = text.toLowerCase()
  const englishHints = /\b(what|which|how|why|when|where|total|spending|income|expense|budget|wallet|category|compare|summarize|show|list|this month|last month)\b/
  const indonesianHints = /\b(apa|berapa|mana|bagaimana|pengeluaran|pemasukan|dompet|kategori|bulan ini|bulan lalu|bandingkan|ringkas|tampilkan)\b/
  if (englishHints.test(normalized) && !indonesianHints.test(normalized)) return 'en'
  if (indonesianHints.test(normalized)) return 'id'
  return fallback
}
