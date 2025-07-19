<script setup lang="ts">
import type { Post } from "~/types/post";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";

defineProps<{ post: Post }>();
const emit = defineEmits<{
  (e: "delete"): void;
  (e: "view"): void;
  (e: "edit"): void;
}>();

function handleDelete() {
  emit("delete");
}
</script>

<template>
  <div
    class="bg-white p-4 rounded-lg border border-gray-200 shadow hover:shadow-md transition duration-200 max-w-xl mx-auto mb-4 flex gap-4"
  >
    <!-- Main Content Area -->
    <div class="flex-1">
      <!-- Header -->
      <div class="flex items-start gap-3 mb-3">
        <!-- Avatar -->
        <div
          class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-semibold text-sm mt-1"
        >
          {{ post.author?.name?.charAt(0).toUpperCase() }}
        </div>
        <!-- Name and handle -->
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-800">
            {{ post.author?.name }}
          </span>
          <span class="text-xs text-gray-500 -mt-0.5">
            @{{ post.author?.email }}
          </span>
        </div>
      </div>

      <!-- Title -->
      <p
        class="text-base text-gray-900 mb-1 whitespace-pre-line leading-snug break-words font-semibold"
      >
        {{ post.title }}
      </p>

      <!-- Body Preview -->
      <p
        class="text-sm text-gray-700 mb-3 whitespace-pre-line leading-snug break-words"
      >
        {{ post.bodyText?.slice(0, 160)
        }}<span v-if="post.bodyText && post.bodyText.length > 160">...</span>
      </p>

      <!-- Footer: Timestamp and Admin controls -->
      <div class="flex justify-between items-center text-gray-500 text-sm mt-2">
        <div class="flex items-center gap-2">
          <span
            class="text-gray-400"
            :title="new Date(post.createdAt).toLocaleString()"
          >
            Posted on
          </span>
          <span
            class="font-medium text-gray-800"
            :title="new Date(post.createdAt).toLocaleString()"
          >
            {{
              new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }}
          </span>
        </div>

        <div class="flex gap-2 text-gray-500">
          <button
            @click="emit('view')"
            title="View"
            class="hover:text-blue-600 transition-colors"
          >
            <EyeIcon class="w-5 h-5" />
          </button>
          <button
            @click="emit('edit')"
            title="Edit"
            class="hover:text-blue-600 transition-colors"
          >
            <PencilSquareIcon class="w-5 h-5" />
          </button>
          <button
            @click="handleDelete"
            title="Delete"
            class="text-red-500 hover:text-red-700 transition-colors"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Image Preview -->
    <div
      class="w-24 h-24 flex-shrink-0 rounded overflow-hidden border border-gray-200"
    >
      <img
        :src="post.imageUrl || `https://picsum.photos/seed/${post.id}/600/400?grayscale` "
        alt="Post preview"
        class="w-full h-full object-cover"
      />
    </div>
  </div>
</template>
