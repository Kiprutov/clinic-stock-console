<script setup lang="ts">
import { ref } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter();
const route = useRoute()
const { login} = useAuth()

const username = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

async function handleSubmit() {
    errorMessage.value = null
    isSubmitting.value = true
    try {
        await login(username.value, password.value)
        
        const redirect = (route.query.redirect as string) || '/'
        router.push(redirect)
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Something went wrong.'
    } finally {
        isSubmitting.value = false;
    }
    
}


</script>

<template>
    <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 class="text-xl font-semi-bold text-gray-900">Clinic Stock Console</h1>
        <p class="mt-1 text-sm text-gray-500">Sign in to view and manage stock.</p>
        <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
                <input 
                 id="username" 
                 v-model="username" 
                 type="text"
                 autocomplete="username"
                 required 
                 class="mt-1 w-full rounded-md border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" >
            </div>

            <div>
                <label for="password" class="block text-sm fomt-medium text-gray-700">Password</label>
                <input 
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-passowrd"
                required
                class="mt-1 w-full rounded-md border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                />
            </div>

            <p v-if="errorMessage" role="alert" class="text-sm text-red-700">
                {{ errorMessage }}
            </p>

            <button
            type="submit"
            :disabled="isSubmitting"
            class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
        {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
        </button>
        </form>
    </div>
</template>
