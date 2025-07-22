<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { onMounted } from "vue";

const authStore = useAuthStore();

onMounted(async () => {
  console.log("Checking authentication status on mount");
  
  await authStore.refreshAccessToken();
});
</script>
<template>
  <div class="min-h-screen bg-gray-100 text-gray-900 font-sans">
    <Toast position="bottom-right" />
    <ConfirmDialog />
    <NuxtLayout />
  </div>
</template>
