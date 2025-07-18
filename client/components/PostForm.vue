<script setup lang="ts">
import { ref } from "vue";
import type { PostInput } from "~/types/post";

const emit = defineEmits<{
  (e: "submit", post: PostInput): void;
}>();
defineProps<{
  loading: boolean;
}>();

const title = ref<string>("");
const bodyText = ref<string>("");
const imageUrl = ref<string | undefined>(undefined);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Handle image file upload
function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement)?.files?.[0];
  if (file) {
    // Clean up previous URL
    if (imageUrl.value?.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl.value);
    }

    imageUrl.value = URL.createObjectURL(file); // could be uploaded to server instead
  } else {
    imageUrl.value = undefined;
  }
}

function handleSubmit() {
  if (!title.value.trim()) return;

  const submittedImageUrl = imageUrl.value;

  emit("submit", {
    title: title.value.trim(),
    bodyText: bodyText.value.trim() || undefined,
    imageUrl: submittedImageUrl || undefined,
  });

  title.value = "";
  bodyText.value = "";
  imageUrl.value = undefined;

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }

  // ✅ Delay revoke to allow rendering
  if (submittedImageUrl?.startsWith("blob:")) {
    setTimeout(() => {
      URL.revokeObjectURL(submittedImageUrl);
    }, 3000); // 3 seconds is usually safe
  }
}
</script>

<template>
  <form
    @submit.prevent="handleSubmit"
    class="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4 shadow-sm space-y-3 text-sm"
  >
    <div>
      <input
        v-model="title"
        type="text"
        placeholder="Title"
        class="w-full p-2 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>

    <div>
      <textarea
        v-model="bodyText"
        rows="2"
        placeholder="What's on your mind?"
        class="w-full p-2 text-sm text-gray-800 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
      ></textarea>
    </div>

    <div class="flex items-center justify-between gap-3">
      <input
        type="file"
        ref="fileInputRef"
        accept="image/*"
        @change="handleImageUpload"
        class="block text-xs text-gray-600 file:text-sm file:bg-blue-50 file:border-0 file:px-3 file:py-1 file:rounded-full file:text-blue-600 hover:file:bg-blue-100"
      />
      <button
        type="submit"
        :disabled="loading || !title.trim()"
        class="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? "Posting..." : "Post" }}
      </button>
    </div>

    <!-- Optional: Show image preview -->
    <div v-if="imageUrl" class="pt-1">
      <img
        :src="imageUrl"
        alt="Preview"
        class="w-full max-h-40 object-cover rounded-md border"
      />
    </div>
  </form>
</template>
