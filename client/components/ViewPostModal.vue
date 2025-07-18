<script setup lang="ts">
import Dialog from "primevue/dialog";
import type { Post } from "~/types/post";

const props = defineProps<{
  post: Post | null;
}>();
const visible = defineModel<boolean>("visible");
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    
    :style="{ width: '36rem', maxWidth: '90vw' }"
    class="p-dialog-rounded bg-white"
    
    :draggable="false"
    :pt="{
      content: { class: 'p-0' },
      mask: { class: 'bg-black/50' },
    }"
  >
    <div v-if="props.post" class="bg-white p-6 rounded-xl">
      <!-- Twitter-like Post Structure -->
      <div class="flex gap-4">
        <!-- Avatar -->
        <div
          class="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg shrink-0"
        >
          {{ props.post.author?.name?.charAt(0).toUpperCase() }}
        </div>
        <!-- Content -->
        <div class="flex-1 space-y-2">
          <!-- Author and Timestamp -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-base font-semibold text-gray-900">
                {{ props.post.author?.name }}
              </p>
              <p class="text-sm text-gray-500">
                @{{ props.post.author?.email.split("@")[0] }}
                <span class="mx-1">·</span>
                <span>{{
                  new Date(props.post.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                }}</span>
              </p>
            </div>
          </div>
          <!-- Post Title and Body -->
          <h2 class="text-xl font-bold text-gray-900">
            {{ props.post.title }}
          </h2>
          <p
            v-if="props.post.bodyText"
            class="text-base text-gray-800 whitespace-pre-line leading-relaxed"
          >
            {{ props.post.bodyText }}
          </p>
          <!-- Post Image -->
          <img
            v-if="props.post.imageUrl"
            :src="props.post.imageUrl"
            alt="Post image"
            class="w-full h-auto rounded-lg mt-3 max-h-96 object-cover shadow-sm"
            @error="props.post.imageUrl = ''"
          />
        </div>
      </div>
      <!-- Footer: Close Button -->
      <div class="mt-6 flex justify-end">
        <button
          @click="visible = false"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-full transition"
        >
          Close
        </button>
      </div>
    </div>
    <div v-else class="p-6 text-gray-600 text-center bg-white rounded-xl">
      No post data available
    </div>
  </Dialog>
</template>

<style scoped>
:deep(.p-dialog-rounded .p-dialog) {
  border-radius: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
:deep(.p-dialog-content) {
  background-color: #ffffff;
}
</style>
