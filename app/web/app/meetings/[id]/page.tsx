'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchMeeting, deleteMeeting, formatDate } from '@/lib/api'
import type { Meeting } from '@/lib/types'

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeeting(id)
      .then(setMeeting)
      .catch((e) => setError(e.message))
  }, [id])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteMeeting(id)
      router.push('/')
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (error) return <div className="text-red-600">Error: {error}</div>
  if (!meeting) return <div>Loading...</div>

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{meeting.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/meetings/${id}/edit`}
            className="px-3 py-1.5 border rounded hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-2">Confirm Delete</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &ldquo;{meeting.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">
          {formatDate(meeting.meetingDate)}
        </span>
        <button
          onClick={() => {
            const md = `# ${meeting.title}\n\nDate: ${formatDate(meeting.meetingDate)}\n\n${meeting.body}`
            const blob = new Blob([md], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="text-sm text-blue-600 hover:underline ml-auto"
        >
          Export Markdown
        </button>
      </div>
      {meeting.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {meeting.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${tag.name}`}
              className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
      <div className="whitespace-pre-wrap">{meeting.body}</div>
    </div>
  )
}