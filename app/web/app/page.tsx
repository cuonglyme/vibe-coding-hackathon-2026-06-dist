'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { fetchMeetings, searchMeetings, formatDate, fetchTags } from '@/lib/api'
import type { Meeting, TagWithCount } from '@/lib/types'

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [tags, setTags] = useState<TagWithCount[]>([])

  const loadMeetings = useCallback(async () => {
    try {
      if (searchQuery.trim()) {
        setSearching(true)
        const results = await searchMeetings(searchQuery.trim())
        setMeetings(results)
      } else {
        const all = await fetchMeetings(activeTag || undefined)
        setMeetings(all)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSearching(false)
    }
  }, [searchQuery, activeTag])

  useEffect(() => {
    fetchTags().then(setTags).catch(() => {})
    // Read ?tag= from URL on mount
    const params = new URLSearchParams(window.location.search)
    const tagFromUrl = params.get('tag')
    if (tagFromUrl) {
      setActiveTag(tagFromUrl)
    }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchMeetings(activeTag || undefined)
        .then(setMeetings)
        .catch((e) => setError(e.message))
    }
  }, [activeTag])

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    loadMeetings()
  }

  function handleTagClick(tagName: string | null) {
    setActiveTag(tagName)
    setSearchQuery('')
  }

  if (error) return <div className="text-red-600">Error: {error}</div>
  if (!meetings) return <div>Loading...</div>

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-48 shrink-0">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Tags
        </h2>
        <div className="space-y-1">
          <button
            onClick={() => handleTagClick(null)}
            className={`block w-full text-left px-2 py-1.5 rounded text-sm ${
              activeTag === null
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Meetings
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.name)}
              className={`block w-full text-left px-2 py-1.5 rounded text-sm ${
                activeTag === tag.name
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tag.name}
              <span className="ml-1 text-xs text-gray-400">
                ({tag._count.meetings})
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInput}
            placeholder="Search meetings..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {activeTag && (
          <div className="text-sm text-gray-500">
            Filtered by tag: <span className="font-medium text-blue-600">{activeTag}</span>{' '}
            <button
              onClick={() => handleTagClick(null)}
              className="text-blue-600 hover:underline ml-1"
            >
              (clear)
            </button>
          </div>
        )}

        {meetings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery.trim()
              ? 'No meetings match your search.'
              : activeTag
              ? `No meetings with tag "${activeTag}".`
              : 'No meetings yet. Create one to get started.'}
          </div>
        ) : (
          <div className="bg-white rounded shadow divide-y">
            {meetings.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 overflow-hidden"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate block min-w-0">{m.title}</span>
                  {m.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {m.tags.map((t) => (
                        <span
                          key={t.id}
                          className="inline-block text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500 ml-4 shrink-0">
                  {formatDate(m.meetingDate)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}