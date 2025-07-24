<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { ref, watch } from "vue";
import { usePostsStore } from "~/stores/posts";
import type { Post } from "~/types/post";

const props = defineProps<{
  post: Post | null;
}>();
const visible = defineModel<boolean>("visible");
const emit = defineEmits<{
  (e: "updated"): void;
}>();

const postsStore = usePostsStore();
const toast = useToast();
const title = ref<string>("");
const bodyText = ref<string>("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | undefined>(undefined);
const fileError = ref<string | undefined>(undefined);

watch(
  () => props.post,
  (newPost) => {
    title.value = newPost?.title || "";
    bodyText.value = newPost?.bodyText || "";
    imagePreview.value =
      newPost?.imageUrl ||
      `https://picsum.photos/seed/${newPost?.id}/600/400?grayscale`;
    fileError.value = undefined;
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  },
  { immediate: true }
);

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
    imagePreview.value = props.post?.imageUrl || undefined;
  }
}

async function updatePost() {
  if (!title.value.trim()) {
    toast.add({
      severity: "error",
      summary: "Update Failed",
      detail: "Title cannot be empty",
      life: 5000,
    });
    return;
  }

  if (!bodyText.value.trim()) {
    toast.add({
      severity: "error",
      summary: "Update Failed",
      detail: "Body text cannot be empty",
      life: 5000,
    });
    return;
  }

  if (props.post?.id) {
    const formData = new FormData();
    formData.append("title", title.value.trim());
    formData.append("bodyText", bodyText.value.trim());
    if (fileInputRef.value?.files?.[0]) {
      formData.append("image", fileInputRef.value.files[0]);
    }
    const result = await postsStore.updatePost(props.post.id, formData);
    if (result.success) {
      toast.add({ severity: "success", summary: "Post Updated", life: 3000 });
      emit("updated");
      visible.value = false;
    } else {
      toast.add({
        severity: "error",
        summary: "Update Failed",
        detail: result.error || "An unexpected error occurred",
        life: 5000,
      });
    }
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Edit Post"
    :style="{ width: '30rem' }"
  >
    <div class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700"
          >Title</label
        >
        <input
          id="title"
          v-model="title"
          type="text"
          placeholder="Enter post title"
          class="w-full p-3 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label for="bodyText" class="block text-sm font-medium text-gray-700"
          >Body</label
        >
        <Textarea
          id="bodyText"
          v-model="bodyText"
          autoResize
          rows="5"
          class="w-full"
        />
      </div>
      <div>
        <label for="image" class="block text-sm font-medium text-gray-700"
          >Image (optional)</label
        >
        <input
          type="file"
          id="image"
          ref="fileInputRef"
          accept="image/*"
          @change="handleImageUpload"
          class="block text-sm text-gray-600 file:text-sm file:bg-blue-50 file:border-0 file:px-3 file:py-1 file:rounded-full file:text-blue-600 hover:file:bg-blue-100"
        />
        <p v-if="fileError" class="text-xs text-red-500 mt-1">
          {{ fileError }}
        </p>
      </div>
      <div v-if="imagePreview" class="pt-1">
        <img
          :src="imagePreview"
          alt="Preview"
          class="w-full max-h-40 object-cover rounded-md border"
        />
      </div>
      <div class="text-right">
        <Button
          :label="postsStore.loadingUpdate ? 'Updating...' : 'Update'"
          :disabled="postsStore.loadingUpdate || !title.trim()"
          @click="updatePost"
          class="p-button-success"
        />
      </div>
    </div>
  </Dialog>
</template>
