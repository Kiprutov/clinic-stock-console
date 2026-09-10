<script setup lang="ts">
interface Props {
    message?: string
}

withDefaults(defineProps<Props>(), {
    message: 'Something went wrong while loading this',
})

const emit = defineEmits<{
    retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center" role="alert">
    <p class="text-sm font-medium text-gray-700">
        {{ message }}
    </p>

    <button
      type="button"
      class="rounded-md border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
      @click="emit('retry')">
      Try again
    </button>
  </div>
</template>