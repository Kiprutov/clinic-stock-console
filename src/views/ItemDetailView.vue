<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useProductsCache } from '@/composables/useProductsCache'
import type { Product } from '@/types/product'
import ProductInfo from '@/components/item-detail/ProductInfo.vue'
import CorrectionForm from '@/components/item-detail/CorrectionForm.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'


const props = defineProps<{ id: string }>()
const { fetchProductsById } = useProductsCache()

const product = ref<Product | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const headingRef = ref<HTMLHeadingElement | null>(null)

async function load() {
  isLoading.value = true
  errorMessage.value = null
  try {
    product.value = await fetchProductsById(props.id)
  } catch {
    errorMessage.value = 'Could not load this item.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-6">
    <router-link
      :to="{ name: 'stock-list' }"
      class="text-sm text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      ← Back to list
    </router-link>

    <LoadingState v-if="isLoading" message="Loading item…" />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="load" />

    <template v-else-if="product">
      <h1 ref="headingRef" tabindex="-1" class="mt-4 text-xl font-semibold text-gray-900 focus:outline-none">
        {{ product.title }}
      </h1>
      <ProductInfo :product="product" class="mt-4" />
      <CorrectionForm :product="product" />
    </template>
  </div>
</template>