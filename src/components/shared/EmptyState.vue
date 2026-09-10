<script setup lang="ts">
interface Props {
    message?: string
    actionLabel?: string
    }

withDefaults(defineProps<Props>(), {
    message: 'Nothing here to show.',
})

const emit = defineEmits<{
    action: []
}>()
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center" role="status">
        <p class="text-sm text-gray-500">{{ message }}</p>

        <button
        v-if="actionLabel"
        type="button"
        class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        @click="emit('action')">
        {{ actionLabel }}
    </button>
    </div>
</template>