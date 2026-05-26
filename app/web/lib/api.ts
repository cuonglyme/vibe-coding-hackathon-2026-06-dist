import type { Meeting, TagWithCount } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function fetchMeetings(tag?: string): Promise<Meeting[]> {
  const url = tag
    ? `${API_URL}/api/meetings?tag=${encodeURIComponent(tag)}`
    : `${API_URL}/api/meetings`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch meetings')
  return res.json()
}

export async function searchMeetings(q: string): Promise<Meeting[]> {
  const res = await fetch(`${API_URL}/api/meetings/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to search meetings')
  return res.json()
}

export async function fetchMeeting(id: string): Promise<Meeting> {
  const res = await fetch(`${API_URL}/api/meetings/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch meeting')
  return res.json()
}

export async function createMeeting(data: {
  title: string
  body: string
  meetingDate: string
  tagNames?: string[]
}): Promise<Meeting> {
  const res = await fetch(`${API_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create meeting')
  return res.json()
}

export async function updateMeeting(
  id: string,
  data: { title: string; body: string; meetingDate: string; tagNames?: string[] }
): Promise<Meeting> {
  const res = await fetch(`${API_URL}/api/meetings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update meeting')
  return res.json()
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/meetings/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete meeting')
}

export async function fetchTags(): Promise<TagWithCount[]> {
  const res = await fetch(`${API_URL}/api/meetings/tags`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch tags')
  return res.json()
}

export function formatDate(isoString: string): string {
  // Use UTC methods to avoid timezone offset issues
  const d = new Date(isoString)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}