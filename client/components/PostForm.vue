<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])
defineProps({ loading: Boolean })

const content = ref('')

function handleSubmit() {
  if (!content.value.trim()) return
  emit('submit', content.value)
  content.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
    <textarea
      v-model="content"
      rows="3"
      placeholder="What's on your mind?"
      class="w-full p-3 text-gray-800 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
    ></textarea>
    <div class="flex justify-end mt-3">
      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Posting...' : 'Post' }}
      </button>
    </div>
  </form>
</template>