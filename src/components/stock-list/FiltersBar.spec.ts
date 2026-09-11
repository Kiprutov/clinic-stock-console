import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ref } from 'vue'
import FiltersBar from './FiltersBar.vue'

vi.mock('@/composables/useProductsCache', () => ({
  useProductsCache: () => ({
    categories: ref(['beauty', 'fragrances']),
    fetchCategories: vi.fn(),
  }),
}))

async function createTestRouter(initialQuery: Record<string, string> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
  await router.push({ path: '/', query: initialQuery })
  await router.isReady()
  return router
}

describe('FiltersBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('initializes the search input from the current route query', async () => {
    const router = await createTestRouter({ search: 'bandage' })
    const wrapper = mount(FiltersBar, { global: { plugins: [router] } })

    const input = wrapper.find('#search').element as HTMLInputElement
    expect(input.value).toBe('bandage')
  })

  it('debounces typing and only updates the URL once, after the delay', async () => {
    const router = await createTestRouter()
    const replaceSpy = vi.spyOn(router, 'replace')
    const wrapper = mount(FiltersBar, { global: { plugins: [router] } })

    const input = wrapper.find('#search')
    await input.setValue('b')
    await input.setValue('ba')
    await input.setValue('band')
    await input.setValue('bandage')
    expect(replaceSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)
    await wrapper.vm.$nextTick()

    expect(replaceSpy).toHaveBeenCalledTimes(1)
    expect(replaceSpy).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ search: 'bandage' }) })
    )
  })

  it('resets the page to 1 when a new search is committed', async () => {
    const router = await createTestRouter({ page: '3' })
    const replaceSpy = vi.spyOn(router, 'replace')
    const wrapper = mount(FiltersBar, { global: { plugins: [router] } })

    await wrapper.find('#search').setValue('gauze')
    vi.advanceTimersByTime(400)
    await wrapper.vm.$nextTick()

    const call = replaceSpy.mock.calls[0]![0] as { query: Record<string, string> }
    expect(call.query.page).toBeUndefined()
  })

  it('re-syncs the input from an external route change without re-pushing to the URL', async () => {
    const router = await createTestRouter({ search: 'bandage' })
    const replaceSpy = vi.spyOn(router, 'replace')
    const wrapper = mount(FiltersBar, { global: { plugins: [router] } })

    await router.replace({ query: { search: 'gauze' } })
    replaceSpy.mockClear() 
    await wrapper.vm.$nextTick()

    const input = wrapper.find('#search').element as HTMLInputElement
    expect(input.value).toBe('gauze')

    vi.advanceTimersByTime(400)
    await wrapper.vm.$nextTick()
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('updates category and resets page when the category filter changes', async () => {
    const router = await createTestRouter({ page: '2' })
    const wrapper = mount(FiltersBar, { global: { plugins: [router] } })
    await wrapper.vm.$nextTick()
    const replaceSpy = vi.spyOn(router, 'replace')

    await wrapper.find('#category').setValue('beauty')

    const call = replaceSpy.mock.calls.at(-1)![0] as { query: Record<string, string> }
    expect(call.query.category).toBe('beauty')
    expect(call.query.page).toBeUndefined()
  })

it('splits the sort value into sortBy and order when sort changes', async () => {
  const router = await createTestRouter()
  const wrapper = mount(FiltersBar, { global: { plugins: [router] } })
  const replaceSpy = vi.spyOn(router, 'replace')

  await wrapper.find('#sort').setValue('price-desc')

  const call = replaceSpy.mock.calls.at(-1)![0] as { query: Record<string, string> }
  expect(call.query.sortBy).toBe('price')
  expect(call.query.order).toBe('desc')
  })
})

