<script setup lang="ts">
import { ref } from "vue";
import { z } from "zod";
import type { PostInput } from "~/types/post";

const emit = defineEmits<{
  (e: "submit", post: FormData): void;
}>();
defineProps<{
  loading: boolean;
}>();

const title = ref<string>("");
const bodyText = ref<string>("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | undefined>(undefined);
const formErrors = ref<Partial<Record<keyof PostInput, string>>>({});
const fileError = ref<string | undefined>(undefined);

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
});

function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement)?.files?.[0];
  if (file) {
    if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
      fileError.value = "Only JPG, JPEG, and PNG files are allowed";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      fileError.value = "File size must be less than 5MB";
      return;
    }
    fileError.value = undefined;
    if (imagePreview.value?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview.value);
    }
    imagePreview.value = URL.createObjectURL(file);
  } else {
    fileError.value = undefined;
    imagePreview.value = undefined;
  }
}

function handleSubmit() {
  const payload = {
    title: title.value.trim(),
    bodyText: bodyText.value.trim(),
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

  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("bodyText", payload.bodyText);
  if (fileInputRef.value?.files?.[0]) {
    formData.append("image", fileInputRef.value.files[0]);
  }

  emit("submit", formData);

  title.value = "";
  bodyText.value = "";
  imagePreview.value = undefined;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
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
      <p v-if="fileError" class="text-xs text-red-500 mt-1">
        {{ fileError }}
      </p>
      <button
        type="submit"
        :disabled="loading || !title.trim() || !bodyText.trim()"
        class="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? "Posting..." : "Post" }}
      </button>
    </div>

    <!-- Optional: Show image preview -->
    <div v-if="imagePreview" class="pt-1">
      <img
        :src="imagePreview"
        alt="Preview"
        class="w-full max-h-40 object-cover rounded-md border"
      />
    </div>
  </form>
</template>
