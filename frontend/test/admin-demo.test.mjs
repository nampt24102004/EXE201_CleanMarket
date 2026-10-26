import assert from 'node:assert/strict'
import test from 'node:test'
import { createDemoDatePreferenceStore } from '../src/pages/admin/demoDatePreference.js'
import { buildDemoTimeline, buildDemoRevenuePoints, loadAllAdminPages } from '../src/pages/admin/demoTimeline.js'

function storage(values = new Map(), changed = () => {}) {
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); changed() },
    removeItem(key) { values.delete(key); changed() },
  }
}

function browserTabs() {
  const shared = new Map()
  const tabs = []
  return () => {
    const tab = new EventTarget()
    tab.Event = Event
    tab.sessionStorage = storage()
    tab.localStorage = storage(shared, () => {
      tabs.filter((other) => other !== tab).forEach((other) => other.dispatchEvent(new Event('storage')))
    })
    tabs.push(tab)
    return tab
  }
}

test('enabled mode survives route remounts, reloads and new tabs for the same admin', () => {
  const newTab = browserTabs()
  const tab = newTab()
  const orders = createDemoDatePreferenceStore(tab)
  assert.equal(orders.get(1), false)
  orders.set(1, true)
  assert.equal(createDemoDatePreferenceStore(tab).get(1), true)
  assert.equal(createDemoDatePreferenceStore(newTab()).get(1), true)
  assert.equal(orders.get(2), false)
})

test('open tabs receive both enabling and disabling, and subscriptions can be removed', () => {
  const newTab = browserTabs()
  const orders = createDemoDatePreferenceStore(newTab())
  const revenue = createDemoDatePreferenceStore(newTab())
  const seen = []
  const unsubscribe = revenue.subscribe(() => seen.push(revenue.get(1)))
  orders.set(1, true)
  orders.set(1, false)
  assert.deepEqual(seen, [true, false])
  unsubscribe()
  orders.set(1, true)
  assert.deepEqual(seen, [true, false])
})

test('legacy tab preference is migrated without overriding a later explicit disable', () => {
  const newTab = browserTabs()
  const oldTab = newTab()
  const otherTab = newTab()
  oldTab.sessionStorage.setItem('cleanmarket:admin-demo-dates:1', 'true')
  const oldStore = createDemoDatePreferenceStore(oldTab)
  assert.equal(oldStore.get(1), true)
  oldStore.migrate(1)
  assert.equal(createDemoDatePreferenceStore(otherTab).get(1), true)
  createDemoDatePreferenceStore(otherTab).set(1, false)
  oldTab.sessionStorage.setItem('cleanmarket:admin-demo-dates:1', 'true')
  oldStore.migrate(1)
  assert.equal(oldStore.get(1), false)
})

test('blocked storage writes still allow enabling and disabling in the current tab', () => {
  const tab = browserTabs()()
  tab.localStorage.setItem = () => { throw new Error('Quota exceeded') }
  const store = createDemoDatePreferenceStore(tab)
  let updates = 0
  store.subscribe(() => updates++)
  store.set(1, true)
  assert.equal(store.get(1), true)
  store.set(1, false)
  assert.equal(store.get(1), false)
  assert.equal(updates, 2)
})

test('orders and payments share spread dates while paid totals remain unchanged', () => {
  const orders = Array.from({ length: 67 }, (_, index) => ({
    id: index + 1,
    orderCode: `CM${index + 1}`,
    createdAt: '2026-10-19T12:00:00Z',
  }))
  const payments = orders.map((order, index) => ({
    orderCode: order.orderCode,
    status: index < 53 ? 'PAID' : 'CANCELLED',
    amount: '100000',
  }))
  const original = structuredClone(orders)
  const timeline = buildDemoTimeline(orders)
  const points = buildDemoRevenuePoints(payments, timeline)
  assert.equal(new Set(Object.values(timeline.byOrderId)).size, 31)
  orders.forEach((order) => assert.equal(timeline.byOrderId[order.id], timeline.byOrderCode[order.orderCode]))
  assert.equal(points.length, 31)
  assert.equal(points.reduce((sum, point) => sum + point.paidOrders, 0), 53)
  assert.equal(points.reduce((sum, point) => sum + point.paidRevenue, 0), 5300000)
  assert.ok(points.filter((point) => point.paidOrders > 0).length > 20)
  assert.deepEqual(orders, original)
})

test('timeline loader reads every page from the actual PageResult envelope', async () => {
  const paths = []
  const api = { async get(path) {
    paths.push(path)
    return { items: [{ id: path.includes('page=0') ? 1 : 2 }], total: 2, totalPages: 2 }
  } }
  assert.deepEqual(await loadAllAdminPages(api, '/api/manager/orders'), [{ id: 1 }, { id: 2 }])
  assert.deepEqual(paths, ['/api/manager/orders?page=0&size=100', '/api/manager/orders?page=1&size=100'])
})
