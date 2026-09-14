<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsCache, PRODUCTS_PER_PAGE } from '@/composables/useProductsCache'
import FiltersBar from '@/components/stock-list/FiltersBar.vue'
import ProductTable from '@/components/stock-list/ProductTable.vue'
import Pagination from '@/components/stock-list/Pagination.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const { products, total, fetchProducts, lastFetchedKey } = useProductsCache()

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const headingRef = ref<HTMLHeadingElement | null>(null)

const queryKey = computed(() =>
  JSON.stringify({
    search: route.query.search ?? '',
    category: route.query.category ?? '',
    sortBy: route.query.sortBy ?? '',
    order: route.query.order ?? '',
    page: route.query.page ?? '1',
  }),
)

async function loadProducts() {
  if (queryKey.value === lastFetchedKey.value) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  errorMessage.value = null

  const page = Number(route.query.page ?? 1)

  try {
    await fetchProducts({
      limit: PRODUCTS_PER_PAGE,
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      sortBy: route.query.sortBy as string | undefined,
      order: route.query.order as 'asc' | 'desc' | undefined,
      search: route.query.search as string | undefined,
      category: route.query.category as string | undefined,
      cacheKey: queryKey.value,
    })

    if (products.value.length === 0 && total.value > 0) {
      const lastValidPage = Math.max(1, Math.ceil(total.value / PRODUCTS_PER_PAGE))
      const query = { ...route.query } as Record<string, string>
      if (lastValidPage === 1) delete query.page
      else query.page = String(lastValidPage)
      router.replace({ query })
      return
    }
  } catch {
    errorMessage.value = 'Could not load the stock list.'
  } finally {
    isLoading.value = false
  }
}

function clearFilters() {
  router.replace({ query: {} })
}

const isFiltered = computed(() => !!(route.query.search || route.query.category))

watch(queryKey, loadProducts)

onMounted(async () => {
  await loadProducts()

  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col px-4" style="min-height: 100vh">
    <div
      class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 py-4 md:flex md:items-center md:justify-between md:gap-6"
    >
      <h1
        ref="headingRef"
        tabindex="-1"
        class="shrink-0 text-xl font-semibold text-gray-900 focus:outline-none"
      >
        Stock list
      </h1>
      <div class="mt-4 md:mt-0 md:flex-1">
        <FiltersBar />
      </div>
    </div>

    <div class="mt-6 flex-1 pb-6">
      <LoadingState v-if="isLoading" message="Loading stock…" />
      <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="loadProducts" />
      <EmptyState
        v-else-if="products.length === 0"
        :message="isFiltered ? 'No items match your search or filters.' : 'No stock items found.'"
        :action-label="isFiltered ? 'Clear filters' : undefined"
        @action="clearFilters"
      />
      <ProductTable v-else />
    </div>
    <div
      v-if="!isLoading && !errorMessage && products.length > 0"
      class="sticky bottom-0 border-t border-gray-200 bg-white py-3"
    >
      <Pagination />
    </div>
  </div>
</template>
