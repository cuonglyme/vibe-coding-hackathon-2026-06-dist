# Nhật ký thay đổi — Vibe Coding Hackathon 2026-06

## Thông tin chung

- **Người thực hiện:** cuonglyme
- **Branch:** `cuonglyme` (main giữ nguyên bản)
- **Git remotes:**
  - `origin` → `git@github.com:cuonglyme/vibe-coding-hackathon-2026-06-dist.git` (fork)
  - `upstream` → `git@github.com:marketenterprise/vibe-coding-hackathon-2026-06-dist.git` (repo BTC)
- **Push lượt 0:50:** `git push upstream main`

---

## Tổng quan

Hoàn thành **6/6 user stories** trong thời gian quy định. Fix lỗi date, long title, thêm delete modal, search, markdown export, và tags feature.

---

## User Story #1 — Fix lỗi ngày tháng (bug date)

### Vấn đề
`new Date(ISOstring)` parse ở múi giờ local (JST/UTC+9), khiến ngày hiển thị lệch 1 ngày đối với các meeting có giờ sáng sớm.

### File thay đổi

**`app/api/src/routes/meetings.ts`**
- `POST /`: Parse `YYYY-MM-DD` → `new Date(meetingDate + 'T00:00:00.000Z')` để parse UTC midnight
- `PUT /:id`: Cùng fix trên

**`app/web/lib/api.ts`**
- `formatDate()`: Dùng `getUTCFullYear/getUTCMonth/getUTCDate` thay vì `toISOString().slice(0, 10)`

**`app/web/app/meetings/new/page.tsx`**
- Gửi `meetingDate` dạng raw `YYYY-MM-DD` thay vì `new Date(meetingDate).toISOString()`

**`app/web/app/meetings/[id]/edit/page.tsx`**
- Cùng fix như create page

### Cách hoạt động
```
Client gửi: "2026-04-15"
Server parse: new Date("2026-04-15" + "T00:00:00.000Z") = UTC 2026-04-15 00:00:00
Hiển thị: d.getUTCFullYear() + "-" + d.getUTCMonth() + "-" + d.getUTCDate() = "2026-04-15"
```

---

## User Story #6 — Long title CSS

### Vấn đề
Tiêu đề dài bị tràn khỏi container, phá vỡ layout danh sách.

### File thay đổi

**`app/web/app/page.tsx`**
- Thêm `truncate min-w-0` trên `span` chứa title
- Thêm `overflow-hidden` trên `Link`
- Thêm `block` để truncate hoạt động trong flex container

---

## User Story #2 — Delete dialog

### Vấn đề
Thiếu confirmation dialog trước khi xoá, dễ xoá nhầm.

### File thay đổi

**`app/web/app/meetings/[id]/page.tsx`**
- Thêm state `showDeleteConfirm` + `deleting`
- Modal overlay `fixed inset-0 bg-black/50` với Cancel/Delete buttons
- Nút Delete chỉ gọi API khi user xác nhận

---

## User Story #4 — Search

### Vấn đề
Thiếu chức năng tìm kiếm ghi chú cuộc họp.

### File thay đổi

**`app/api/src/routes/meetings.ts`**
- Thêm `GET /api/meetings/search?q=...` (đặt TRƯỚC route `/:id` để tránh conflict)
- Prisma: `contains + mode: 'insensitive'` trên `title` và `body`

**`app/web/lib/api.ts`**
- Thêm `searchMeetings(q)` function

**`app/web/app/page.tsx`**
- Thêm search bar (input + button)
- State `searchQuery`, `searching`
- `loadMeetings` dùng `useCallback` để search khi submit

---

## User Story #5 — Export Markdown

### Vấn đề
Không có cách export ghi chú ra file.

### File thay đổi

**`app/web/app/meetings/[id]/page.tsx`**
- Thêm nút "Export Markdown"
- Client-side Blob download (không cần API)
- Format: `# Title\n\nDate: YYYY-MM-DD\n\nBody`
- Filename: `title_underscored.md`

---

## User Story #3 — Tags (phức tạp nhất)

### Yêu cầu
Gắn tag vào ghi chú cuộc họp (theo project/client), lọc danh sách theo tag.

### File thay đổi

#### 1. Schema — `app/api/prisma/schema.prisma`
```prisma
model Meeting {
  id          String   @id @default(cuid())
  title       String
  body        String
  meetingDate DateTime
  tags        Tag[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  meetings  Meeting[]
  createdAt DateTime  @default(now())
}
```

#### 2. Seed — `app/api/prisma/seed.ts`
- 12 meetings với tags phân bổ
- Tags gồm: sprint, planning, engineering, architecture, customer, product, business, executive, sync, design, incident, 1on1, career, retro, hiring, vendor
- Dùng `connectOrCreate` để tạo tag nếu chưa tồn tại

#### 3. API Routes — `app/api/src/routes/meetings.ts`
- `GET /api/meetings?tag=engineering` — lọc theo tag
- `GET /api/meetings/tags` — danh sách tag kèm số lượng meeting
- `POST /` — nhận `tagNames: string[]`, dùng `connectOrCreate`
- `PUT /:id` — nhận `tagNames`, `set: []` + `connectOrCreate` để replace tags
- Tất cả GET routes `include: { tags: true }`

#### 4. Types — `app/web/lib/types.ts`
```typescript
export type Tag = {
  id: string
  name: string
  createdAt: string
}

export type Meeting = {
  // ... existing fields
  tags: Tag[]
}

export type TagWithCount = Tag & {
  _count: { meetings: number }
}
```

#### 5. API Client — `app/web/lib/api.ts`
- `fetchMeetings(tag?: string)` — optional tag filter
- `fetchTags()` — lấy danh sách tags
- `createMeeting` / `updateMeeting` — nhận `tagNames?: string[]`

#### 6. Homepage — `app/web/app/page.tsx`
- Sidebar tags (trái) với count badge, active state highlight
- Lọc theo tag khi click, clear để về All Meetings
- Tag chips trên mỗi meeting row
- Đọc `?tag=` từ URL khi mount (khi click từ detail page)
- Empty state phân biệt: search / tag / no meetings

#### 7. Create form — `app/web/app/meetings/new/page.tsx`
- Tag input: gõ + Enter hoặc click Add
- Tag chips với nút xoá (×)
- Gửi tagNames trong POST body

#### 8. Edit form — `app/web/app/meetings/[id]/edit/page.tsx`
- Same as create, pre-populated với tags hiện tại

#### 9. Detail page — `app/web/app/meetings/[id]/page.tsx`
- Tag chips giữa date row và body
- Clickable → về homepage với `?tag=name`

#### 10. Database migration
```bash
# Trong Docker container
npx prisma db push && npx prisma db seed
```

---

## Git workflow

```bash
# Ban đầu
git remote add origin git@github.com:cuonglyme/vibe-coding-hackathon-2026-06-dist.git
git remote rename origin upstream   # origin cũ → upstream
git branch cuonglyme main           # tạo branch chứa source mới
git reset --hard upstream/main      # reset main về bản gốc
git push origin cuonglyme           # push source mới lên fork

# Khi đến lượt 0:50 (push lên BTC)
git push upstream main
```

---

## Docker

- Stack: 3 containers (web:3000, api:4000, db:5433)
- Rebuild: `cd app && docker compose build && docker compose up -d --force-recreate`
- Seed: `docker compose exec -T api npx ts-node prisma/seed.ts`