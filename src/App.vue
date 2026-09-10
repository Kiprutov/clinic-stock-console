<script setup lang="ts">
import {watch} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth';

const router = useRouter()
const route = useRoute()
const { isAuthenticated } = useAuth()

watch(isAuthenticated, (loggedIn) => {
    if (!loggedIn && !route.meta.public) {
        router.push({ name: 'login', query: { redirect: route.fullPath}})
    }
} )
</script>

<template>
  <router-view />
</template>

<style scoped></style>
