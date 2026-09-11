<script setup lang="ts">

import { useProductsCache } from '@/composables/useProductsCache'
import { isLowStock } from '@/utils/lowStock'
import ProductCard from './ProductCard.vue'


const {products} = useProductsCache()


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
            <ProductCard
            v-for="(product, index) in products"
            :key="product.id"
            :product="product"
            :striped="index % 2 === 1"
            />
        </ul>
    </div>

</template>