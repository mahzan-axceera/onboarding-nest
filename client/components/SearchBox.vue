<script setup lang="ts">
import { ref, computed } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { usePostsStore } from "~/stores/posts";
import type { Post } from "~/types/post";

const emit = defineEmits<{
  (e: "search", posts: Post[]): void;
  (e: "clear"): void;
}>();
defineProps<{
  loading: boolean;
}>();

const postsStore = usePostsStore();
const toast = useToast();
const searchQuery = ref<string>("");
const isSearching = ref<boolean>(false);

const canSearch = computed(() => searchQuery.value.trim().length > 0);

// Watch for empty query to trigger clear
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    emit("clear");
  }
});

async function handleSearch() {
  if (!canSearch.value) {
    toast.add({
      severity: "warn",
      summary: "Invalid Search",
      detail: "Please enter a search query",
      life: 3000,
    });
    return;
  }

  isSearching.value = true;
  try {
    const result = await postsStore.searchPosts(searchQuery.value);
    if (result.success) {
      emit("search", postsStore.posts);
    } else {
      toast.add({
        severity: "error",
        summary: "Search Failed",
        detail: result.error || "No results found",
        life: 5000,
      });
      emit("search", []);
    }
  } finally {
    isSearching.value = false;
  }
}

function handleClear() {
  searchQuery.value = "";
  emit("clear");
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
    <div class="relative flex items-center gap-2">
      <input
        v-model="searchQuery"
        :disabled="loading || isSearching"
        @keydown.enter="handleSearch"
        type="text"
        placeholder="Search posts by title or body..."
        class="w-full p-3 pr-24 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
      />

      <!-- Clear (X) button -->
      <button
        v-if="searchQuery"
        type="button"
        :disabled="loading || isSearching"
        @click="handleClear"
        class="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-opacity duration-200 disabled:opacity-50"
      >
        ✕
      </button>

      <!-- Search button -->
      <button
        type="button"
        :disabled="!canSearch || loading || isSearching"
        @click="handleSearch"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50"
      >
        <span v-if="!isSearching">🔍</span>
        <span v-else class="animate-spin">⏳</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.p-inputtext:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
</style>
