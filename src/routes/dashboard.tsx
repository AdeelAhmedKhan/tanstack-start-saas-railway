import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { requireAuth, getSessionUser } from '../server/session'
import { listProjects, createProject } from '../server/projects'
import { getStorageStatus, getUploadUrl } from '../server/storage'

function Dashboard() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await createProject({ data: { name } })
      setName('')
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.')
    } finally {
      setBusy(false)
    }
  }

  async function onUpload(file: File | undefined) {
    if (!file) return
    setUploadMsg(null)
    try {
      const { uploadUrl, key } = await getUploadUrl({
        data: { filename: file.name, contentType: file.type || 'application/octet-stream' },
      })
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status}).`)
      setUploadMsg(`Uploaded as ${key}`)
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">
        Signed in as {data.user.email} · plan: {data.user.plan} · role:{' '}
        {data.user.role}
      </p>

      <section className="card">
        <h2>Projects</h2>
        {data.projects.length === 0 ? (
          <p className="muted">
            No projects yet — create your first one below. (Seeded admin
            gets a demo project from <code>npm run db:seed</code>.)
          </p>
        ) : (
          <ul>
            {data.projects.map((p) => (
              <li key={p.id}>
                {p.name}{' '}
                <span className="muted">
                  ({new Date(p.createdAt).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onCreate}>
          <label>
            New project name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My first project"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Upload a file</h2>
        {data.storageConfigured ? (
          <>
            <p className="muted">
              Files go straight to your Bucket via a presigned URL — they
              never pass through this server.
            </p>
            <input
              type="file"
              onChange={(e) => void onUpload(e.target.files?.[0])}
            />
          </>
        ) : (
          <p className="muted">
            Storage is not configured. Add a Bucket service on Railway and
            set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and
            S3_BUCKET. See README.
          </p>
        )}
        {uploadMsg ? <p className="ok">{uploadMsg}</p> : null}
      </section>
    </>
  )
}

export const Route = createFileRoute('/dashboard')({
  // Server-side protection: redirects to /sign-in when not signed in.
  // A client-side check alone would not be enough.
  beforeLoad: async () => {
    await requireAuth()
  },
  loader: async () => {
    const user = await getSessionUser()
    if (!user) throw new Error('Not signed in.')
    const [projects, storage] = await Promise.all([
      listProjects(),
      getStorageStatus(),
    ])
    return {
      user,
      projects,
      storageConfigured: storage.configured,
    }
  },
  component: Dashboard,
})
