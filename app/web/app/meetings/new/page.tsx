'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeeting } from '@/lib/api'

export default function NewMeetingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createMeeting({
        title,
        body,
        meetingDate, // Send YYYY-MM-DD directly to avoid timezone shift
        tagNames: tags.length > 0 ? tags : undefined,
      })
      router.push('/')
    } catch (err) {
      alert('Error creating meeting')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded shadow p-6 space-y-4"
    >
      <h1 className="text-2xl font-semibold">New Meeting</h1>
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type tag name and press Enter"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={addTag}
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}