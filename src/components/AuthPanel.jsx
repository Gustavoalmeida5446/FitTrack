import { useState } from 'react'

export default function AuthPanel({ auth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [msg, setMsg] = useState('')

  const submit = async () => {
    const action = mode === 'login' ? auth.login : auth.signup
    const { error } = await action(email, password)
    setMsg(error ? error.message : `${mode} success`)
  }

  if (auth.user) {
    return (
      <div className="card mb-4 flex items-center justify-between">
        <p>Logged in as {auth.user.email}</p>
        <button onClick={auth.logout}>Logout</button>
      </div>
    )
  }

  return (
    <div className="card mb-4 grid gap-2 md:grid-cols-4">
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="login">Login</option>
        <option value="signup">Signup</option>
      </select>
      <button onClick={submit}>{mode}</button>
      <p className="text-sm text-slate-500 md:col-span-4">
        {auth.hasSupabase ? msg : 'Supabase not configured. Using local mode.'}
      </p>
    </div>
  )
}
