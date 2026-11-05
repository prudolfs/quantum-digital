import { useState, type FormEvent } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'

export function AdminAccess({
  setupAvailable,
  unavailable,
  busy,
  error,
  token,
  invalidToken,
  onSignIn,
}: {
  setupAvailable: boolean
  unavailable: boolean
  busy: boolean
  error: string
  token?: string
  invalidToken: boolean
  onSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'forgot' | 'reset'>(
    token ? 'reset' : invalidToken ? 'forgot' : 'signin',
  )
  const [working, setWorking] = useState(false)
  const [failure, setFailure] = useState('')
  const [message, setMessage] = useState('')
  const pending = working || busy
  const setup = setupAvailable && mode === 'signin'

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setFailure('')
    setMessage('')
    setWorking(true)
    try {
      if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({
          email: String(form.get('email')).trim(),
          redirectTo: `${window.location.origin}/admin`,
        })
        if (result.error) throw new Error('request')
        setMessage(
          'If that email belongs to the owner account, a reset link is on its way. Check your inbox and spam folder. The link expires in 30 minutes.',
        )
      } else {
        const password = String(form.get('password'))
        if (password !== String(form.get('confirmPassword'))) {
          setFailure('The passwords don’t match. Please enter them again.')
          return
        }
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        })
        if (result.error) throw new Error('reset')
        setMode('signin')
        setMessage('Password updated. Sign in with your new password.')
        await router.navigate({
          to: '/admin',
          search: { section: 'inbox', status: 'all', edit: '' },
          replace: true,
        })
        await router.invalidate()
      }
    } catch {
      setFailure(
        mode === 'forgot'
          ? 'The reset email couldn’t be sent. Please try again later.'
          : 'This reset link is invalid or has expired. Request a new link and try again.',
      )
    } finally {
      setWorking(false)
    }
  }

  function changeMode(next: 'signin' | 'forgot') {
    setMode(next)
    setFailure('')
    setMessage('')
    if (token || invalidToken)
      void router.navigate({
        to: '/admin',
        search: { section: 'inbox', status: 'all', edit: '' },
        replace: true,
      })
  }

  return (
    <section className="admin-access" aria-labelledby="admin-access-title">
      <div className="admin-access-heading">
        <div className="admin-access-icon" aria-hidden="true">
          <LockKeyhole />
        </div>
        <h1 id="admin-access-title">
          {setup
            ? 'Create your owner account'
            : mode === 'forgot'
              ? 'Reset your password'
              : mode === 'reset'
                ? 'Choose a new password'
                : 'Welcome back'}
        </h1>
        <p className="body-copy">
          {setup
            ? 'Set up your private workspace to manage inquiries and website content.'
            : mode === 'forgot'
              ? 'Enter your owner email and we’ll send you a link to reset your password.'
              : mode === 'reset'
                ? 'Use at least 12 characters. Updating your password will sign out your other sessions.'
                : 'Sign in to manage your inquiries and website content.'}
        </p>
      </div>
      <div className="admin-signin">
        {(failure || (mode === 'signin' && error)) && (
          <p className="feedback-error" role="alert">
            {failure || error}
          </p>
        )}
        {invalidToken && mode === 'forgot' && !message && (
          <p className="feedback-error" role="alert">
            This reset link is invalid or has expired. Request a new link below.
          </p>
        )}
        {message && (
          <p className="admin-feedback" role="status">
            {message}
          </p>
        )}
        {unavailable && (
          <p className="feedback-error" role="status">
            Admin access is temporarily unavailable. Please try again later.
          </p>
        )}
        <form key={mode} onSubmit={mode === 'signin' ? onSignIn : recover}>
          <FieldGroup>
            {mode !== 'reset' && (
              <Field>
                <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                  disabled={pending}
                />
              </Field>
            )}
            {setup && (
              <Field>
                <FieldLabel htmlFor="admin-key">One-time setup key</FieldLabel>
                <Input
                  id="admin-key"
                  name="setupKey"
                  type="password"
                  autoComplete="off"
                  required
                  minLength={32}
                  maxLength={256}
                  disabled={pending}
                />
                <FieldDescription>
                  Use the key provided when your admin account was configured.
                </FieldDescription>
              </Field>
            )}
            {mode !== 'forgot' && (
              <Field>
                <FieldLabel htmlFor="admin-password">
                  {mode === 'reset' ? 'New password' : 'Password'}
                </FieldLabel>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete={
                    setup || mode === 'reset'
                      ? 'new-password'
                      : 'current-password'
                  }
                  required
                  minLength={12}
                  maxLength={128}
                  disabled={pending}
                />
                {setup && (
                  <FieldDescription>
                    Use at least 12 characters.
                  </FieldDescription>
                )}
              </Field>
            )}
            {(setup || mode === 'reset') && (
              <Field>
                <FieldLabel htmlFor="admin-confirm">
                  Confirm password
                </FieldLabel>
                <Input
                  id="admin-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  disabled={pending}
                />
              </Field>
            )}
            <Button type="submit" disabled={pending || unavailable}>
              {pending
                ? 'Please wait…'
                : setup
                  ? 'Create owner account'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : mode === 'reset'
                      ? 'Update password'
                      : 'Sign in'}
            </Button>
          </FieldGroup>
        </form>
        {!setup && (
          <div className="admin-access-links">
            <Button
              type="button"
              variant="text"
              disabled={pending}
              onClick={() =>
                changeMode(mode === 'signin' ? 'forgot' : 'signin')
              }
            >
              {mode !== 'signin' && <ArrowLeft data-icon="inline-start" />}
              {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
            </Button>
            {mode === 'reset' && (
              <Button
                type="button"
                variant="text"
                disabled={pending}
                onClick={() => changeMode('forgot')}
              >
                Request a new link
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="admin-access-note">
        Private access for the Quantum Digital owner.
      </p>
    </section>
  )
}
