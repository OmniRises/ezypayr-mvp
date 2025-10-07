import { useMemo, useState } from 'react'
import './App.css'

const apiBase = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

async function postJson(path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { json = text }
  return { ok: res.ok, status: res.status, data: json }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export default function App() {
  const [hmacBody, setHmacBody] = useState('{"ok":true}')
  const [hmacSig, setHmacSig] = useState('')
  const [hmacResp, setHmacResp] = useState('')

  const [jwsToken, setJwsToken] = useState('')
  const [jwsResp, setJwsResp] = useState('')

  const [codecPayload, setCodecPayload] = useState('{"a":1,"b":2}')
  const [codecSig, setCodecSig] = useState('')
  const [codecHash, setCodecHash] = useState('')
  const [codecVerify, setCodecVerify] = useState('')

  const prettyApi = useMemo(() => apiBase, [])

  return (
    <div className="container">
      <h1>Webhook & Codec Tester</h1>
      <p>API: {prettyApi}</p>

      <Section title="HMAC /webhook/hmac">
        <label>Body (raw JSON)</label>
        <textarea value={hmacBody} onChange={(e) => setHmacBody(e.target.value)} rows={4} />
        <label>x-signature (base64)</label>
        <input value={hmacSig} onChange={(e) => setHmacSig(e.target.value)} />
        <button onClick={async () => {
          const res = await fetch(`${apiBase}/webhook/hmac`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-signature': hmacSig }, body: hmacBody })
          const text = await res.text(); setHmacResp(`${res.status}: ${text}`)
        }}>Send</button>
        <pre>{hmacResp}</pre>
      </Section>

      <Section title="JWS /webhook/jws">
        <label>Bearer token</label>
        <input value={jwsToken} onChange={(e) => setJwsToken(e.target.value)} />
        <button onClick={async () => {
          const { status, data } = await postJson('/webhook/jws', undefined, { Authorization: `Bearer ${jwsToken}` })
          setJwsResp(`${status}: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`)
        }}>Send</button>
        <pre>{jwsResp}</pre>
      </Section>

      <Section title="Codec /codec/hash">
        <label>Payload</label>
        <textarea value={codecPayload} onChange={(e) => setCodecPayload(e.target.value)} rows={4} />
        <button onClick={async () => {
          const { status, data } = await postJson('/codec/hash', JSON.parse(codecPayload))
          setCodecHash(`${status}: ${JSON.stringify(data, null, 2)}`)
        }}>Hash</button>
        <pre>{codecHash}</pre>
      </Section>

      <Section title="Codec /codec/sign">
        <button onClick={async () => {
          const { data } = await postJson('/codec/sign', JSON.parse(codecPayload))
          setCodecSig(typeof data === 'string' ? data : (data as any).signature || '')
        }}>Sign</button>
        <div>signature: <code>{codecSig}</code></div>
      </Section>

      <Section title="Codec /codec/verify">
        <button onClick={async () => {
          const { status, data } = await postJson('/codec/verify', { payload: JSON.parse(codecPayload), signature: codecSig })
          setCodecVerify(`${status}: ${JSON.stringify(data, null, 2)}`)
        }}>Verify</button>
        <pre>{codecVerify}</pre>
      </Section>
    </div>
  )
}

