<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import RegisterForm from "~/components/RegisterForm.vue";
import { useAuthStore } from "~/stores/auth";
import type { RegisterInput } from "~/types/auth";

const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();

async function handleRegister(payload: RegisterInput) {
  const result = await authStore.register(payload);
  console.log("Registration result:", result);
  if (result.success) {
    toast.add({
      severity: "success",
      summary: "Registration Successful",
      detail: "Please log in to continue",
      life: 3000,
    });
    router.push("/login");
  } else {
    toast.add({
      severity: "error",
      summary: "Registration Failed",
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
    <h1 class="text-xl font-semibold text-gray-800 mb-4">Register</h1>
    <RegisterForm :loading="authStore.loading" @submit="handleRegister" />
    <p class="text-sm text-gray-600 mt-4">
      Already have an account?
      <NuxtLink to="/login" class="text-blue-500 hover:underline"
        >Log in</NuxtLink
      >
    </p>
  </div>
</template>
