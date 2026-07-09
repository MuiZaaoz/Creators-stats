# Creator Hub Platform

ระบบจัดการครีเอเตอร์เกม (Thai/EN) — full-stack: **React + TypeScript + Vite** (frontend), **Express + better-sqlite3** (backend), **SQLite** (database).

## Features / หน้าจอ

- **Dashboard** — ภาพรวม, stat cards, program tabs, leaderboard, activity feed
- **Creators** — การ์ดครีเอเตอร์ + follower counts, ค้นหา/กรอง, เพิ่ม/แก้ไข/ลบ
- **Creator Detail** — โปรไฟล์แก้ไขได้, รายการ episode ข้ามแพลตฟอร์ม
- **Programs** — เลือกโปรแกรม, สถิติ, ตารางครีเอเตอร์+episode
- **Collect** — กรอกเอง / อัปโหลด / AI Refresh / Web Submit
- **Editor** — คิวตรวจสอบ (approve/reject/edit), system log
- **Analytics** — เปรียบเทียบ 3 โหมด × 5 metrics, กราฟแท่ง + ตาราง
- **Export** — เลือกฟิลด์เป็นหมวด, preview, ดาวน์โหลด CSV
- **Games** — หมวดเกม + ตารางคอนเทนต์
- **Rewards** — งบรายโปรแกรม + CPM
- **Audit Log** — ค้นหา/กรอง/แบ่งหน้า
- **Settings** — จัดการผู้ใช้ + RBAC role matrix
- **Profile** — โปรไฟล์ส่วนตัว

## การรัน / Getting Started

```bash
cd fullstack
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- ฐานข้อมูล SQLite ถูกสร้าง + seed อัตโนมัติครั้งแรกที่รัน (ไฟล์อยู่ใน `data/`)

## Scripts

| Command | คำอธิบาย |
|---|---|
| `npm run dev` | รัน backend (3001) + frontend (5173) พร้อมกัน |
| `npm run dev:backend` | รัน API อย่างเดียว |
| `npm run dev:frontend` | รัน Vite อย่างเดียว |
| `npm run build` | build production (`dist/` + `dist-server/`) |
| `npm start` | รัน production backend |

## โครงสร้าง

```
fullstack/
├── server/              # Express + SQLite backend
│   ├── index.ts         # entry point, mount routes
│   ├── db.ts            # schema + connection
│   ├── seed.ts          # seed ข้อมูลตัวอย่าง
│   └── routes/          # programs, creators, contents, games,
│                        # rewards, analytics, audit, users, export
└── src/                 # React + TypeScript frontend
    ├── App.tsx          # routing
    ├── components/      # Layout, PageHeader, StatCard, ...
    ├── pages/           # 13 หน้าจอ
    ├── lib/             # api client, utils, i18n
    └── store/           # zustand state
```
