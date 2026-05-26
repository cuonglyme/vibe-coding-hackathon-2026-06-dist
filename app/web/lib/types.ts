export type Tag = {
  id: string
  name: string
  createdAt: string
}

export type Meeting = {
  id: string
  title: string
  body: string
  meetingDate: string
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export type TagWithCount = Tag & {
  _count: { meetings: number }
}