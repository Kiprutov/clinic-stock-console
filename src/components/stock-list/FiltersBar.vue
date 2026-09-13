<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsCache } from '@/composables/useProductsCache'

const route = useRoute()
const router = useRouter()

const { categories, fetchCategories } = useProductsCache()

const searchInput = ref((route.query.search as string) ?? '')

let syncingFromRoute = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
    if (syncingFromRoute) return

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        pushQuery({ search: value || undefined, page: undefined})
    }, 400)
})

// Re-sync FROM the URL on external changes (back/forward, pasted link).
watch(
    () => route.query.search,
    async(value) => {
        const stringValue = (value as string) ?? ''
        if (stringValue === searchInput.value) return
        syncingFromRoute = true
        searchInput.value = stringValue
        await nextTick() // caught from tests and had to add this, without awaiting nextTick, this line ran
    // before the searchInput watcher fired, so the guard was already
    // false by the time it mattered and a back/forward nav re-pushed
    // to the URL instead of staying silent.
        syncingFromRoute = false
    }
)

const currentSort = computed(() => {
    const sortBy = route.query.sortBy as string | undefined
    const order = route.query.order as string | undefined
    return sortBy ? `${sortBy}-${order ?? 'asc'}` : ''
})

function pushQuery(updates: Record<string, string | undefined>) {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(route.query)) {
        if (typeof value === 'string') query[key] = value
    }
    for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) delete query[key]
        else query[key] = value
    }
    router.replace({ query})
}

function onCategoryChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    pushQuery({ category: value || undefined, page: undefined})

}

function onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    if (!value) {
        pushQuery({ sortBy: undefined, order: undefined, page: undefined })
        return
    }
    const [sortBy, order] = value.split('-')
    pushQuery( { sortBy, order, page: undefined})
}

onMounted(fetchCategories)

</script>

<template>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div class="flex-1">
            <input
            id="search"
            v-model="searchInput"
            type="text"
            placeholder="Search stock..."
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />  </div>

            <div>
                <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
                <select 
                id="category"
                :value="(route.query.category as string) ?? ''"
                class="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                @change="onCategoryChange"
                >
            <option value="">All categories</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
            </div>

            <div> 
                <label for="sort" class="block text-sm font-medium text-gray-700">Sort by</label>
                <select
                id="sort"
                :value="currentSort"
                class="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                @change="onSortChange"
                >
                <option value="">Default</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="price-asc">Price (low-high)</option>
                <option value="price-desc">Price (high-low)</option>
                <option value="stock-asc">Stock (low-high)</option>
                <option value="stock-desc">Stock (high-low)</option>
                
            </select>          
            
            </div>
    </div>
</template>