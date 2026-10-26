const DAY_MS = 24 * 60 * 60 * 1000
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000
export const DEMO_DAYS = 31

function vietnamDay(isoString) {
  const value = new Date(isoString).getTime()
  if (!Number.isFinite(value)) return null
  return new Date(value + VIETNAM_OFFSET_MS).toISOString().slice(0, 10)
}

function shiftDay(day, offset) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10)
}

/** UI-only dates. Every order keeps a stable position within a 31-day demo window. */
export function buildDemoTimeline(orders) {
  const sorted = orders
    .filter((order) => vietnamDay(order.createdAt))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || Number(a.id) - Number(b.id))
  if (!sorted.length) return { from: null, to: null, byOrderId: {}, byOrderCode: {} }

  const to = vietnamDay(sorted[sorted.length - 1].createdAt)
  const from = shiftDay(to, -(DEMO_DAYS - 1))
  const byOrderId = {}
  const byOrderCode = {}
  sorted.forEach((order, index) => {
    const offset = sorted.length === 1 ? DEMO_DAYS - 1 :
      Math.round(index * (DEMO_DAYS - 1) / (sorted.length - 1))
    const day = shiftDay(from, offset)
    byOrderId[order.id] = day
    byOrderCode[order.orderCode] = day
  })
  return { from, to, byOrderId, byOrderCode }
}

export function buildDemoRevenuePoints(payments, timeline) {
  if (!timeline?.from || !timeline?.to) return []
  const buckets = Array.from({ length: DEMO_DAYS }, (_, index) => ({
    periodStart: shiftDay(timeline.from, index),
    paidRevenue: 0,
    paidOrders: 0,
  }))
  const byDay = new Map(buckets.map((point) => [point.periodStart, point]))
  payments.forEach((payment) => {
    if (!['PAID', 'REFUNDED'].includes(payment.status)) return
    const day = timeline.byOrderCode[payment.orderCode]
    const point = byDay.get(day)
    if (!point) return
    point.paidRevenue += Number(payment.amount || 0)
    point.paidOrders += 1
  })
  return buckets
}

export async function loadAllAdminPages(api, path) {
  const separator = path.includes('?') ? '&' : '?'
  const first = await api.get(`${path}${separator}page=0&size=100`)
  const totalPages = first?.totalPages || 1
  if (totalPages > 50) throw new Error('Quá nhiều bản ghi để hiển thị mốc thời gian mô phỏng.')
  const rest = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) =>
    api.get(`${path}${separator}page=${index + 1}&size=100`)))
  return [first, ...rest].flatMap((page) => page?.items || [])
}
