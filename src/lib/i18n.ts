export type Lang = 'th' | 'en';

const t: Record<string, Record<Lang, string>> = {
  dashboard: { th: 'แดชบอร์ด', en: 'Dashboard' },
  creators: { th: 'ครีเอเตอร์', en: 'Creators' },
  programs: { th: 'โปรแกรม', en: 'Programs' },
  collect: { th: 'รับข้อมูล', en: 'Collect' },
  editor: { th: 'ตรวจสอบข้อมูล', en: 'Review' },
  addData: { th: 'เพิ่มข้อมูล', en: 'Add Data' },
  lastUpdate: { th: 'อัปเดตล่าสุด', en: 'Last update' },
  analytics: { th: 'วิเคราะห์', en: 'Analytics' },
  export: { th: 'ส่งออก', en: 'Export' },
  games: { th: 'เกม', en: 'Games' },
  rewards: { th: 'รางวัล', en: 'Rewards' },
  settings: { th: 'ตั้งค่า', en: 'Settings' },
  auditLog: { th: 'ประวัติ', en: 'Audit Log' },
  profile: { th: 'โปรไฟล์', en: 'Profile' },
  views: { th: 'วิว', en: 'Views' },
  engagement: { th: 'การมีส่วนร่วม', en: 'Engagement' },
  likes: { th: 'ไลค์', en: 'Likes' },
  comments: { th: 'คอมเมนต์', en: 'Comments' },
  shares: { th: 'แชร์', en: 'Shares' },
  saves: { th: 'บันทึก', en: 'Saves' },
  episodes: { th: 'คอนเทนต์', en: 'Episodes' },
  platform: { th: 'แพลตฟอร์ม', en: 'Platform' },
  program: { th: 'โปรแกรม', en: 'Program' },
  type: { th: 'ประเภท', en: 'Type' },
  name: { th: 'ชื่อ', en: 'Name' },
  actions: { th: 'การกระทำ', en: 'Actions' },
  save: { th: 'บันทึก', en: 'Save' },
  cancel: { th: 'ยกเลิก', en: 'Cancel' },
  delete: { th: 'ลบ', en: 'Delete' },
  edit: { th: 'แก้ไข', en: 'Edit' },
  add: { th: 'เพิ่ม', en: 'Add' },
  search: { th: 'ค้นหา', en: 'Search' },
  total: { th: 'รวม', en: 'Total' },
  approved: { th: 'อนุมัติ', en: 'Approved' },
  pending: { th: 'รอดำเนินการ', en: 'Pending' },
  rejected: { th: 'ตีกลับ', en: 'Rejected' },
  status: { th: 'สถานะ', en: 'Status' },
  loading: { th: 'กำลังโหลด...', en: 'Loading...' },
  noData: { th: 'ไม่มีข้อมูล', en: 'No data' },
  amount: { th: 'จำนวน', en: 'Amount' },
  budget: { th: 'งบประมาณ', en: 'Budget' },
  cpm: { th: 'CPM', en: 'CPM' },
  followers: { th: 'ผู้ติดตาม', en: 'Followers' },
  publishedAt: { th: 'วันที่เผยแพร่', en: 'Published At' },
  game: { th: 'เกม', en: 'Game' },
  url: { th: 'URL', en: 'URL' },
  user: { th: 'ผู้ใช้', en: 'User' },
  role: { th: 'บทบาท', en: 'Role' },
};

export function useT(lang: Lang) {
  return (key: string): string => t[key]?.[lang] ?? key;
}

export function translate(key: string, lang: Lang): string {
  return t[key]?.[lang] ?? key;
}
