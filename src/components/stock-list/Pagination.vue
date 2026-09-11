<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter} from 'vue-router'
import { useProductsCache, PRODUCTS_PER_PAGE } from '@/composables/useProductsCache'

const route = useRoute()
const router = useRouter()
const { total } = useProductsCache()

const currentPage = computed(() => Number(route.query.page ?? 1))
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PRODUCTS_PER_PAGE)))

function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return

    const query = { ...route.query } as Record<string, string>
    if (page === 1) {
        //lets just keep url clean, no need for page=1, its already default
        delete query.page
    } else {
        query.page = String(page)
    }
    router.replace({ query })
}

</script>

<template>
    <nav class="flex items-center justify-between gap-4 pt-4" aria-label="Pagination">
        <button
        type="button"
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage -1)"
        > Previous</button>
        <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>

        <button
        type="button"
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
        > Next 
    </button>
    </nav>
</template>