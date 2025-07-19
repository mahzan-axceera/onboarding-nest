<script setup lang="ts">
import { ref } from "vue";
import { z } from "zod";
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

const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),

  bodyText: z
    .string()
    .min(1, "Body text is required")
    .min(3, "Body text must be at least 3 characters")
    .max(250, "Body text must be at most 500 characters"),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

const formErrors = ref<Partial<Record<keyof PostInput, string>>>({});

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
  const payload = {
    title: title.value.trim(),
    bodyText: bodyText.value.trim(),
    imageUrl: imageUrl.value || undefined,
  };

  const result = postSchema.safeParse(payload);

  if (!result.success) {
    formErrors.value = {};
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as keyof PostInput] = issue.message;
    }
    return;
  }

  formErrors.value = {};

  emit("submit", result.data);

  title.value = "";
  bodyText.value = "";
  imageUrl.value = undefined;

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }

  if (payload.imageUrl?.startsWith("blob:")) {
    setTimeout(() => {
      URL.revokeObjectURL(payload.imageUrl!);
    }, 3000);
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
        :class="{ 'border-red-500': formErrors.title }"
      />
      <p v-if="formErrors.title" class="text-xs text-red-500 mt-1">
        {{ formErrors.title }}
      </p>
    </div>

    <div>
      <textarea
        v-model="bodyText"
        rows="2"
        placeholder="What's on your mind?"
        class="w-full p-2 text-sm text-gray-800 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
        :class="{ 'border-red-500': formErrors.bodyText }"
      ></textarea>
      <p v-if="formErrors.bodyText" class="text-xs text-red-500 mt-1">
        {{ formErrors.bodyText }}
      </p>
    </div>

    <div class="flex items-center justify-between gap-3">
      <input
        type="file"
        ref="fileInputRef"
        accept="image/*"
        @change="handleImageUpload"
        class="block text-xs text-gray-600 file:text-sm file:bg-blue-50 file:border-0 file:px-3 file:py-1 file:rounded-full file:text-blue-600 hover:file:bg-blue-100"
      />
      <p v-if="formErrors.imageUrl" class="text-xs text-red-500 mt-1">
        {{ formErrors.imageUrl }}
      </p>
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
