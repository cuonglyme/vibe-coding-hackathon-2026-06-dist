import { Router } from 'express'
import { prisma } from '../lib/db'

const router = Router()

router.get('/search', async (req, res) => {
  const q = (req.query.q as string) || ''
  const meetings = await prisma.meeting.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { meetingDate: 'desc' },
    include: { tags: true },
  })
  res.json(meetings)
})

router.get('/', async (req, res) => {
  const tagFilter = req.query.tag as string | undefined
  const meetings = await prisma.meeting.findMany({
    where: tagFilter
      ? { tags: { some: { name: tagFilter } } }
      : undefined,
    orderBy: { meetingDate: 'desc' },
    include: { tags: true },
  })
  res.json(meetings)
})

router.post('/', async (req, res) => {
  // TODO: validate input
  const { title, body, meetingDate, tagNames } = req.body
  // Parse YYYY-MM-DD as UTC midnight to avoid timezone shift
  const date = new Date(meetingDate + 'T00:00:00.000Z')
  const meeting = await prisma.meeting.create({
    data: {
      title,
      body,
      meetingDate: date,
      ...(tagNames?.length
        ? {
            tags: {
              connectOrCreate: tagNames.map((name: string) => ({
                where: { name },
                create: { name },
              })),
            },
          }
        : {}),
    },
    include: { tags: true },
  })
  res.status(201).json(meeting)
})

router.get('/tags', async (_req, res) => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { meetings: true } } },
  })
  res.json(tags)
})

router.get('/:id', async (req, res) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    include: { tags: true },
  })
  if (!meeting) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.json(meeting)
})

router.put('/:id', async (req, res) => {
  const { title, body, meetingDate, tagNames } = req.body
  const meeting = await prisma.meeting.update({
    where: { id: req.params.id },
    data: {
      title,
      body,
      meetingDate: meetingDate
        ? new Date(meetingDate + 'T00:00:00.000Z')
        : undefined,
      ...(tagNames !== undefined
        ? {
            tags: {
              set: [],
              connectOrCreate: tagNames.map((name: string) => ({
                where: { name },
                create: { name },
              })),
            },
          }
        : {}),
    },
    include: { tags: true },
  })
  res.json(meeting)
})

router.delete('/:id', async (req, res) => {
  await prisma.meeting.delete({
    where: { id: req.params.id },
  })
  res.status(204).end()
})

export default router