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
  <div class="mx-auto max-w-3xl px-4 pb-10" style="min-height: 100vh">
    
    <div class="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-gray-50 py-4">
      <router-link
        :to="{ name: 'stock-list' }"
        class="rounded text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        ← Back to list
      </router-link>
      <span class="text-gray-300" aria-hidden="true">/</span>
      <span class="text-sm text-gray-500">Item detail</span>
    </div>

    <LoadingState v-if="isLoading" message="Loading item…" />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="load" />

    <template v-else-if="product">
      
      <div class="mt-6 grid gap-8 md:grid-cols-5">
        <div class="md:col-span-3">
          <h1
            ref="headingRef"
            tabindex="-1"
            class="text-xl font-semibold text-gray-900 focus:outline-none"
          >
            {{ product.title }}
          </h1>
          <div class="mt-4">
            <ProductInfo :product="product" />
          </div>
        </div>

        <div class="md:col-span-2">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Correct stock
          </h2>
          <div class="mt-2">
            <CorrectionForm :product="product" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>