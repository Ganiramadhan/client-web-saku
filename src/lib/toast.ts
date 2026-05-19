import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (description: string, title?: string) =>
    title ? sonnerToast.success(title, { description }) : sonnerToast.success(description),
  error: (description: string, title?: string) =>
    title ? sonnerToast.error(title, { description }) : sonnerToast.error(description),
  info: (description: string, title?: string) =>
    title ? sonnerToast.info(title, { description }) : sonnerToast.info(description),
  warning: (description: string, title?: string) =>
    title ? sonnerToast.warning(title, { description }) : sonnerToast.warning(description),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: sonnerToast.promise,
}

