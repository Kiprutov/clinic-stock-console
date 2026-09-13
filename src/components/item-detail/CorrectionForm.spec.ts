import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CorrectionForm from './CorrectionForm.vue'
import type { Product } from '@/types/product'

const updateStockMock = vi.fn()

vi.mock('@/composables/useProductsCache', () => ({
  useProductsCache: () => ({
    updateStock: updateStockMock,
  }),
}))

const product: Product = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  category: 'beauty',
  price: 9.99,
  thumbnail: 'https://example.com/thumb.jpg',
  stock: 99,
}

describe('CorrectionForm', () => {
  beforeEach(() => {
    updateStockMock.mockReset()
  })

  it('initializes the input with the product’s current stock', () => {
    const wrapper = mount(CorrectionForm, { props: { product } })
    const input = wrapper.find('#stock-count').element as HTMLInputElement
    expect(Number(input.value)).toBe(99)
  })

  it('calls updateStock with the new value and shows a saved message on success', async () => {
    updateStockMock.mockResolvedValue(undefined)
    const wrapper = mount(CorrectionForm, { props: { product } })

    await wrapper.find('#stock-count').setValue(100)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateStockMock).toHaveBeenCalledWith(1, 100)
    expect(wrapper.text()).toContain('Stock count saved.')
  })

  it('disables the input and save button while a save is in flight', async () => {
    let resolveSave: () => void
    updateStockMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSave = resolve
      })
    )

    const wrapper = mount(CorrectionForm, { props: { product } })
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect((wrapper.find('#stock-count').element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Saving…')

    resolveSave!()
    await flushPromises()

    expect((wrapper.find('#stock-count').element as HTMLInputElement).disabled).toBe(false)
  })

  it('keeps the typed value and shows an error if the save fails', async () => {
    updateStockMock.mockRejectedValue(new Error('network error'))
    const wrapper = mount(CorrectionForm, { props: { product } })

    await wrapper.find('#stock-count').setValue(150)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const input = wrapper.find('#stock-count').element as HTMLInputElement
    expect(Number(input.value)).toBe(150)
    expect(wrapper.text()).toContain('Could not save')
    expect(wrapper.text()).not.toContain('Stock count saved.')
  })
})