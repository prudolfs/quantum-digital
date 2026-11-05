import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

export function AdminConfirm({
  open,
  title,
  description,
  action,
  busy = false,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  action: string
  busy?: boolean
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {busy ? 'Please wait…' : action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
