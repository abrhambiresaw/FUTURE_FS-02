export function renderAuthPage({
  page,
  preferences,
  authDrafts,
  authMessage,
  authBusy,
  onNavigate,
  onAuthChange,
  onAuthSubmit,
}) {
  function getValue(section, field) {
    return authDrafts?.[section]?.[field] ?? '';
  }

  return (
    <div className={`auth-shell theme-${preferences.theme}`}>

      {/* LEFT SIDE — Branding only */}
      <div className="auth-hero">
        <div className="brand-mark">CR</div>
        <h1>CRM Suite</h1>
        <p className="lead-copy">
          Run sales, customer success, and operations
          from one command center.
        </p>
      </div>

      {/* RIGHT SIDE — Auth forms */}
      <div className="auth-panel card">

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={page === 'login' ? 'tab active' : 'tab'}
            onClick={() => onNavigate('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={page === 'register' ? 'tab active' : 'tab'}
            onClick={() => onNavigate('register')}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={page === 'forgot' ? 'tab active' : 'tab'}
            onClick={() => onNavigate('forgot')}
          >
            {/* Forgot Password */}
          </button>
        </div>

        {/* LOGIN FORM */}
        {page === 'login' && (
          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); onAuthSubmit('login'); }}
          >
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue.</p>

            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={getValue('login', 'email')}
                onChange={(e) => onAuthChange('login', 'email', e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={getValue('login', 'password')}
                onChange={(e) => onAuthChange('login', 'password', e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <button
                type="button"
                className="text-button"
                onClick={() => onNavigate('forgot')}
              >
                Forgot password?
              </button>
            </div>

            {authMessage && (
              <p className="auth-message">{authMessage}</p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={authBusy}
            >
              {authBusy ? 'Signing in...' : 'Login'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
              Don't have an account?{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => onNavigate('register')}
              >
                Sign up
              </button>
            </p>
          </form>
        )}

        {/* SIGN UP FORM */}
        {page === 'register' && (
          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); onAuthSubmit('register'); }}
          >
            <h2>Create your account</h2>
            <p>Start managing your customers today.</p>

            <label>
              Full name
              <input
                name="name"
                type="text"
                placeholder="Your full name"
                value={getValue('register', 'name')}
                onChange={(e) => onAuthChange('register', 'name', e.target.value)}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Work email
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={getValue('register', 'email')}
                onChange={(e) => onAuthChange('register', 'email', e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Company
              <input
                name="company"
                type="text"
                placeholder="Your company name"
                value={getValue('register', 'company')}
                onChange={(e) => onAuthChange('register', 'company', e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={getValue('register', 'password')}
                onChange={(e) => onAuthChange('register', 'password', e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            {authMessage && (
              <p className="auth-message">{authMessage}</p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={authBusy}
            >
              {authBusy ? 'Creating account...' : 'Create account'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
              Already have an account?{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {page === 'forgot' && (
          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); onAuthSubmit('forgot'); }}
          >
            <h2>Reset your password</h2>
            <p>Enter your email and we'll send you a reset link.</p>

            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={getValue('forgot', 'email')}
                onChange={(e) => onAuthChange('forgot', 'email', e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            {authMessage && (
              <p className="auth-message">{authMessage}</p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={authBusy}
            >
              {authBusy ? 'Sending...' : 'Send reset link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
              Remember your password?{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => onNavigate('login')}
              >
                Back to login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}