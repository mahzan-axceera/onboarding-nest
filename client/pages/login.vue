// client/pages/login.vue
<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import LoginForm from "~/components/LoginForm.vue";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import type { LoginInput } from "~/types/auth";

const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();
const postsStore = usePostsStore();

async function handleLogin(payload: LoginInput) {
  const result = await authStore.login(payload);
  if (result.success) {
    toast.add({
      severity: "success",
      summary: "Login Successful",
      detail: "Welcome back!",
      life: 3000,
    });
    router.push("/");
    await postsStore.fetchPosts(1); // 👈 force refresh
  } else {
    toast.add({
      severity: "error",
      summary: "Login Failed",
      detail: result.error || "An unexpected error occurred",
      life: 5000,
    });
  }
}
</script>

<template>
  <div
    class="max-w-md mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
  >
    <h1 class="text-xl font-semibold text-gray-800 mb-4">Login</h1>
    <LoginForm :loading="authStore.loading" @submit="handleLogin" />
    <p class="text-sm text-gray-600 mt-4">
      Don't have an account?
      <NuxtLink to="/register" class="text-blue-500 hover:underline"
        >Register</NuxtLink
      >
    </p>
  </div>
</template>
