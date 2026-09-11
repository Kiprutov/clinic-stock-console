<script setup lang="ts">
import { ref } from 'vue'
import type { Product } from '@/types/product'
import { useProductsCache } from '@/composables/useProductsCache'

const props = defineProps<{ product: Product }>()
const { updateStock } = useProductsCache()

const newStock = ref(props.product.stock)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const savedMessage = ref<string | null>(null)

async function handleSave() {
  errorMessage.value = null
  savedMessage.value = null
  isSaving.value = true

  try {
    await updateStock(props.product.id, newStock.value)
    savedMessage.value = 'Stock count saved.'
  } catch {
    errorMessage.value = 'Could not save — check your connection and try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <form class="mt-6 flex flex-col gap-3 rounded-lg border border-gray-200 p-4" @submit.prevent="handleSave">
    <label for="stock-count" class="block text-sm font-medium text-gray-700">Correct stock count</label>
    <div class="flex items-center gap-3">
      <input
        id="stock-count"
        v-model.number="newStock"
        type="number"
        min="0"
        :disabled="isSaving"
        class="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
      />
      <button
        type="submit"
        :disabled="isSaving"
        class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </div>

    <p v-if="savedMessage" role="status" class="text-sm font-medium text-green-700">{{ savedMessage }}</p>
    <p v-if="errorMessage" role="alert" class="text-sm font-medium text-red-700">{{ errorMessage }}</p>
  </form>
</template>