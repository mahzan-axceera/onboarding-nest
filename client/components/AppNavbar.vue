<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  authStore.logout();
  router.push("/login");
}
</script>

<template>
  <nav class="bg-white shadow-sm p-4">
    <div class="max-w-3xl mx-auto flex justify-between items-center">
      <NuxtLink to="/" class="text-xl font-bold text-gray-800"
        >DinoFeed 🦕</NuxtLink
      >
      <div class="flex items-center space-x-4">
        <span v-if="authStore.user" class="text-gray-600"
          >Hello, {{ authStore.user.name }}</span
        >
        <div v-if="authStore.user" class="space-x-2">
          <NuxtLink to="/" class="text-blue-500 hover:underline">Home</NuxtLink>
          <button @click="handleLogout" class="text-blue-500 hover:underline">
            Logout
          </button>
        </div>
        <div v-else class="space-x-2">
          <NuxtLink to="/login" class="text-blue-500 hover:underline"
            >Login</NuxtLink
          >
          <NuxtLink to="/register" class="text-blue-500 hover:underline"
            >Register</NuxtLink
          >
        </div>
      </div>
    </div>
  </nav>
</template>
