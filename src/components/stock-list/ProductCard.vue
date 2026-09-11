<script setup lang="ts">
import type { Product } from '@/types/product'
import { isLowStock } from '@/utils/lowStock'

defineProps<{
  product: Product
  striped: boolean
}>()
</script>

<template>
  <li :class="striped ? 'bg-gray-50' : 'bg-white'" class="rounded-lg border border-gray-200 p-3">
    <router-link
      :to="{ name: 'item-detail', params: { id: product.id } }"
      class="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <img :src="product.thumbnail" alt="" class="h-12 w-12 rounded object-cover" />
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium text-gray-900">{{ product.title }}</p>
        <p class="text-xs text-gray-500">{{ product.category }}</p>
      </div>
      <span
        :class="isLowStock(product.stock) ? 'font-semibold text-red-700' : 'text-gray-700'"
        class="shrink-0 text-sm"
      >
        {{ product.stock }}<span v-if="isLowStock(product.stock)"> · Low</span>
      </span>
    </router-link>
  </li>
</template>