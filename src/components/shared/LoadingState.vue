<script setup lang="ts">
interface Props {
    message?: string
}

withDefaults(defineProps<Props>(), {
    message: 'loading...',
})
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-3 py-12" role="status">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
        aria-hidden="true"
        />
        <p class="text-sm text-gray-500">{{ message }}</p>
    </div>
    </template>