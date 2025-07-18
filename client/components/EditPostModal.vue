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
const imageUrl = ref<string>("");

watch(
  () => props.post,
  (newPost) => {
    title.value = newPost?.title || "";
    bodyText.value = newPost?.bodyText || "";
    imageUrl.value = newPost?.imageUrl || "";
  },
  { immediate: true }
);

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

  if (props.post?.id) {
    const result = await postsStore.updatePost(props.post.id, {
      title: title.value,
      bodyText: bodyText.value.trim() || undefined,
      imageUrl: imageUrl.value.trim() || undefined,
    });
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
        <label for="imageUrl" class="block text-sm font-medium text-gray-700"
          >Image URL (optional)</label
        >
        <input
          id="imageUrl"
          v-model="imageUrl"
          type="url"
          placeholder="Enter image URL"
          class="w-full p-3 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
