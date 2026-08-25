import { useState } from 'react'
import logo from '../logo.webp'

export default function LoginView({ onLogin, connected, notice = '' }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    try { await onLogin(data.get('username').trim(), data.get('password')) }
    catch (err) {
      if (String(err.message).includes('ACCOUNT_LOCKED')) setError('Admin login is locked. It must be manually unlocked before you can sign in.')
      else if (String(err.message).includes('INVALID_CREDENTIALS')) setError(`That username or password is incorrect. ${err.attemptsRemaining} ${err.attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`)
      else setError('Unable to sign in. Check the Convex configuration.')
    }
    finally { setBusy(false) }
  }
  return <section className="login-view login-simple">
    <form className="login-card" onSubmit={submit}>
      <img src={logo} alt="Lunch Box"/>
      <p className="login-label">Admin portal</p>
      <h1>Sign in</h1>
      <p className="login-intro">Manage pickup orders, menu items, catering, specials and events.</p>
      <label>Username<input name="username" autoComplete="username" required/></label>
      <label>
        Password
        <span className="password-field">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      <button className="primary-button" disabled={busy || !connected}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="form-message">{!connected ? 'VITE_CONVEX_URL is not configured.' : error || notice}</p>
    </form>
  </section>
}
