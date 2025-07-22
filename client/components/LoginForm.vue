<script setup lang="ts">
import { ref } from 'vue';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import type { LoginInput } from '~/types/auth';

const emit = defineEmits<{
  (e: 'submit', payload: LoginInput): void;
}>();
defineProps<{
  loading: boolean;
}>();

const toast = useToast();
const email = ref<string>('');
const password = ref<string>('');
const formErrors = ref<Partial<Record<keyof LoginInput, string>>>({});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

function handleSubmit() {
  const payload: LoginInput = {
    email: email.value.trim(),
    password: password.value,
  };

  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    formErrors.value = {};
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as keyof LoginInput] = issue.message;
    }
    return;
  }

  formErrors.value = {};
  emit('submit', result.data);

  email.value = '';
  password.value = '';
}
</script>

<template>
  <form
    @submit.prevent="handleSubmit"
    class="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4 shadow-sm space-y-3 text-sm"
  >
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        placeholder="Enter your email"
        class="w-full p-2 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        :class="{ 'border-red-500': formErrors.email }"
      />
      <p v-if="formErrors.email" class="text-xs text-red-500 mt-1">{{ formErrors.email }}</p>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        placeholder="Enter your password"
        class="w-full p-2 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        :class="{ 'border-red-500': formErrors.password }"
      />
      <p v-if="formErrors.password" class="text-xs text-red-500 mt-1">{{ formErrors.password }}</p>
    </div>

    <div class="text-right">
      <Button
        :label="loading ? 'Logging in...' : 'Login'"
        :disabled="loading || !email.trim() || !password.trim()"
        type="submit"
        class="p-button-success"
      />
    </div>
  </form>
</template>