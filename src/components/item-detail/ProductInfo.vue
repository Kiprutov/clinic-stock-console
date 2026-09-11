<script setup lang="ts">
import type { Product } from '@/types/product'

defineProps<{ product: Product }>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
    <img :src="product.thumbnail" :alt="product.title" class="h-32 w-32 rounded-lg object-cover" />
    <div>
      <p class="text-sm text-gray-500">{{ product.category }}</p>
      <p class="mt-1 text-lg font-semibold text-gray-900">{{ product.title }}</p>
      <p class="mt-1 text-sm text-gray-600">${{ product.price }}</p>
    </div>
  </div>
</template>