<script setup lang="ts">

import { useProductsCache } from '@/composables/useProductsCache'

const {products} = useProductsCache()

const LOW_STOCK_THRESHOLD = 10

function isLowStock(stock: number) {
    return stock <= LOW_STOCK_THRESHOLD
}

</script>

<template>
    <div>
        <table class="hidden w-full text-left text-sm md:table">
            <thead>
                <tr class="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                    <th class="py-2 pr-4">Item</th>
                    <th class="py-2 pr-4">Category</th>
                    <th class="py-2 pr-4">Stock</th>
                </tr>
            </thead>
            <tbody>
                <tr
                v-for="(product, index) in products"
                :key="product.id"
                :class="index % 2 === 1 ? 'bg-gray-50' : 'bg-white'"
                class="border-b border-gray-100">
            <td class="py-2 pr-4">
                <router-link
                :to=" { name: 'item-detail', params: {id: product.id }}"
                class="flex items-center gap-3 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
            <img :src="product.thumbnail" alt="thumbnail" class="h-10 w-10 rounded object-cover"/>
            <span class="font-medium text-gray-900">{{ product.title }}</span>
    
        </router-link>
            </td>
            <td class="py-2 pr-4 text-gray-600">{{ product.category }}</td>
        <td class="py-2 pr-4">
            <span :class="isLowStock(product.stock) ? 'font-semibold text-red-700' : 'text-gray-600'">
                {{ product.stock }}<span v-if="isLowStock(product.stock)"> . Low Stock</span>
            </span>
        </td>
            </tr>
            </tbody>
        </table>

        <ul class="flex flex-col gap-3 md:hidden">
            <li
            v-for="(product, index) in products"
            :key="product.id"
            :class="index % 2 === 1 ? 'bg-gray-50' : 'bg-white'"
            class="rounded-md border border-gray-200 p-3">
        
            <router-link
            :to="{ name: 'item-detail', params: { id: product.id}}"
            class="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
        <img :src="product.thumbnail" alt="" class="h-12 w-12 rounded object-cover"/>
        <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-900">{{ product.title }}</p>
            <p class="text-xs text-gray-500">{{ product.category }}</p>

        </div>
        <span
        :class="isLowStock(product.stock) ? 'font-semibold text-red-700' : 'text-gray-700'"
        class="shrink-0 text-sm">
    {{ product.stock }}<span v-if="isLowStock(product.stock)"> .Low</span>
    </span>
    </router-link>
        </li>

        </ul>
    </div>

</template>