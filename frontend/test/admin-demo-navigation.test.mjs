import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h, act } from 'react'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

test('admin can enable demo dates, navigate all three pages, reload, retry and disable', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://cleanmarket.test/admin/orders' })
  const saved = new Map()
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT']) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, {
      configurable: true, writable: true,
      value: name === 'IS_REACT_ACT_ENVIRONMENT' ? true : name === 'window' ? dom.window : dom.window[name],
    })
  }
  const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' })
  let root
  try {
    const { createRoot } = await import('react-dom/client')
    const { BrowserRouter, Routes, Route } = await import('react-router-dom')
    const { default: AdminPage } = await server.ssrLoadModule('/src/pages/admin/AdminPage.jsx')
    const { AuthContext } = await server.ssrLoadModule('/src/context/useAuth.js')
    const { api } = await server.ssrLoadModule('/src/services/apiClient.js')
    const orders = Array.from({ length: 67 }, (_, index) => ({
      id: index + 1, orderCode: `CM${index + 1}`, createdAt: '2026-10-19T12:00:00Z',
      status: 'DELIVERED', paymentMethod: 'PAYOS', totalAmount: 100000, subtotal: 100000,
      fullName: 'Test customer', phone: '', address: '', supplierOrders: [],
    }))
    const payments = orders.map((order, index) => ({
      id: index + 1, orderId: order.id, orderCode: order.orderCode,
      createdAt: order.createdAt, status: index < 53 ? 'PAID' : 'CANCELLED', provider: 'PAYOS', amount: 100000,
    }))
    let failTimeline = false
    api.get = async (path) => {
      if (path.startsWith('/api/manager/orders')) {
        if (failTimeline) throw new Error('Test: temporary API failure')
        return { items: orders, total: 67, totalPages: 1, page: 0 }
      }
      if (path.startsWith('/api/admin/payments')) return { items: payments, total: 67, totalPages: 1, page: 0 }
      if (path === '/api/admin/dashboard/summary') return {}
      if (path.startsWith('/api/admin/reports/')) return []
      throw new Error(`Unexpected API request: ${path}`)
    }
    const user = { id: 1, name: 'Test admin', roles: ['ADMIN'] }
    const render = () => {
      root = createRoot(document.getElementById('root'))
      root.render(h(AuthContext.Provider, { value: { user, hasRole: (role) => user.roles.includes(role) } },
        h(BrowserRouter, null, h(Routes, null,
          h(Route, { path: '/admin', element: h(AdminPage) }),
          h(Route, { path: '/admin/:section', element: h(AdminPage) }),
        )),
      ))
    }
    const click = async (selector) => {
      const element = document.querySelector(selector)
      assert.ok(element, `Missing element: ${selector}`)
      await act(async () => element.click())
    }
    const checked = (id) => assert.equal(document.getElementById(id)?.checked, true, `${id} must stay enabled`)
    await act(async () => render())
    assert.equal(document.getElementById('admin-demo-order-dates').checked, false)
    assert.equal(document.querySelector('.kpi-primary .admin-kpi-value').textContent, '67')
    await click('#admin-demo-order-dates')
    checked('admin-demo-order-dates')
    assert.match(document.querySelector('tbody').textContent, /Ngày: 19\/09\/2026/)
    assert.doesNotMatch(document.querySelector('.admin-orders-view').textContent, /mô phỏng|Mô phỏng/)
    assert.doesNotMatch(document.querySelector('tbody tr').textContent, /Ngày thật|19\/10\/2026/)
    assert.equal(document.querySelector('.alert-warning'), null)

    await click('a[href="/admin/revenue-reports"]')
    checked('admin-revenue-demo-dates')
    assert.match(document.querySelector('.admin-revenue-view').textContent, /Biểu đồ doanh thu theo ngày/)
    assert.doesNotMatch(document.querySelector('.admin-revenue-view').textContent, /mô phỏng|Mô phỏng/)
    assert.equal(document.querySelectorAll('.admin-bar-item').length, 31)
    assert.match(document.querySelector('.kpi-success .admin-kpi-value').textContent, /5\.300\.000/)
    assert.equal(document.querySelector('input[type="date"]').disabled, true)
    assert.equal(document.querySelector('.alert-warning'), null)

    await click('a[href="/admin/payments"]')
    checked('admin-payment-demo-dates')
    assert.match(document.querySelector('tbody').textContent, /Ngày: 19\/09\/2026/)
    assert.doesNotMatch(document.querySelector('.admin-payments-view').textContent, /mô phỏng|Mô phỏng/)
    assert.doesNotMatch(document.querySelector('tbody tr').textContent, /Ngày thật|19\/10\/2026/)
    assert.equal(document.querySelector('.alert-warning'), null)
    assert.match(document.querySelector('.admin-payments-view').textContent, /Tổng cộng 67 giao dịch/)
    await act(async () => root.unmount())
    root = null
    await act(async () => render())
    checked('admin-payment-demo-dates')

    // A temporary API error must not silently switch back to real dates.
    await act(async () => root.unmount())
    root = null
    failTimeline = true
    await act(async () => render())
    assert.match(document.body.textContent, /Test: temporary API failure/)
    assert.equal(dom.window.localStorage.getItem('cleanmarket:admin-demo-dates:1'), 'true')
    assert.equal(document.querySelector('.admin-payments-view'), null)
    failTimeline = false
    const retry = [...document.querySelectorAll('button')].find((button) => button.textContent === 'Thử tải lại ngày')
    await act(async () => retry.click())
    checked('admin-payment-demo-dates')

    await click('#admin-payment-demo-dates')
    assert.match(document.querySelector('tbody tr').textContent, /19\/10\/2026/)
    assert.doesNotMatch(document.querySelector('tbody').textContent, /Ngày:/)
    await click('a[href="/admin/revenue-reports"]')
    assert.equal(document.getElementById('admin-revenue-demo-dates').checked, false)
    assert.match(document.querySelector('.admin-revenue-view').textContent, /Biểu đồ doanh thu theo thời gian/)
    assert.equal(document.querySelector('input[type="date"]').disabled, false)
  } finally {
    if (root) await act(async () => root.unmount())
    await server.close()
    dom.window.close()
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  }
})
