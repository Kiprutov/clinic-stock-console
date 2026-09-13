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

const shareStatus = ref<'idle' | 'copied' | 'error'>('idle')
let shareStatusTimer: ReturnType<typeof setTimeout> | undefined

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

async function handleShare() {
  const url = window.location.href

  window.focus()
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(url)
      shareStatus.value = 'copied'
    } catch {
      shareStatus.value = 'error'
    }
  } else {
    window.prompt('Copy this link:', url)
    shareStatus.value = 'copied'
  }

  resetShareStatusAfterDelay()
}


function resetShareStatusAfterDelay() {
  clearTimeout(shareStatusTimer)
  shareStatusTimer = setTimeout(() => {
    shareStatus.value = 'idle'
  }, 2500)
}

onMounted(async () => {
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
   <div class="mx-auto max-w-3xl px-4 pb-10" style="min-height: 100vh">
    <div class="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 py-4">
      <div class="flex items-center gap-2">
        <router-link
          :to="{ name: 'stock-list' }"
          class="rounded text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          ← Back to list
        </router-link>
        <span class="text-gray-300" aria-hidden="true">/</span>
        <span class="text-sm text-gray-500">Item detail</span>
      </div>

      <button
        v-if="product"
        type="button"
        class="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        @click="handleShare"
      >
        <!-- Simple inline share icon — no icon library dependency for one glyph -->
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M13 4a2 2 0 1 0-1.94 2.5l-4.12 2.4a2 2 0 1 0 0 2.2l4.12 2.4a2 2 0 1 0 .5-.86l-4.12-2.4a2 2 0 0 0 0-.48l4.12-2.4A2 2 0 0 0 13 4z" />
        </svg>
        Share
      </button>
    </div>

    <p
      v-if="shareStatus !== 'idle'"
      role="status"
      class="mt-2 text-right text-sm"
      :class="shareStatus === 'copied' ? 'text-green-700' : 'text-red-700'"
    >
      {{ shareStatus === 'copied' ? 'Link copied, please paste and share it.' : 'Could not share this link.' }}
    </p>

    <LoadingState v-if="isLoading" message="Loading item…" />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="load" />

    <template v-else-if="product">
      <div class="mt-6 grid gap-8 md:grid-cols-5">
        <div class="md:col-span-3">
          <h1 ref="headingRef" tabindex="-1" class="text-xl font-semibold text-gray-900 focus:outline-none">
            {{ product.title }}
          </h1>
          <div class="mt-4">
            <ProductInfo :product="product" />
          </div>
        </div>

        <div class="md:col-span-2">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Correct stock</h2>
          <div class="mt-2">
            <CorrectionForm :product="product" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>