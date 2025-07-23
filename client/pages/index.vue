<script setup lang="ts">
import { usePostsStore } from "~/stores/posts";
import { onMounted } from "vue";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ProgressSpinner from "primevue/progressspinner";
import type { Post, PostInput } from "~/types/post";

const postsStore = usePostsStore();
const userStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const user = computed(() => userStore.user);
const isLoading = computed(() => userStore.loading);

onMounted(() => {
  const stop = watch(
    () => userStore.initialized,
    async (initialized) => {
      if (!initialized) return;
      stop();

      if (userStore.user) {
        await fetchPosts();
      }
    }
  );
});

async function fetchPosts(page: number = postsStore.currentPage) {
  const result = await postsStore.fetchPosts(page);
  if (!result.success) {
    toast.add({
      severity: "error",
      summary: "Failed to Load Posts",
      detail: result.error || "An unexpected error occurred",
      life: 5000,
    });
  }
}

const handleCreatePost = async (post: FormData) => {
  const result = await postsStore.createPost(post);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "Post Created" : "Failed to Create Post",
    detail: result.success
      ? undefined
      : result.error || "An unexpected error occurred",
    life: result.success ? 3000 : 5000,
  });
};

const handleDeletePost = async (id: number) => {
  confirm.require({
    message: "Are you sure you want to delete this post?",
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    acceptLabel: "Yes",
    rejectLabel: "No",
    accept: async () => {
      const result = await postsStore.deletePost(id);
      toast.add({
        severity: result.success ? "info" : "error",
        summary: result.success ? "Post Deleted" : "Failed to Delete Post",
        detail: result.success
          ? undefined
          : result.error || "An unexpected error occurred",
        life: result.success ? 3000 : 5000,
      });
    },
  });
};

const handleSearch = async (posts: Post[]) => {
  postsStore.posts = posts;
  postsStore.currentPage = 1;
  postsStore.totalPages = Math.ceil(posts.length / postsStore.limit);
  postsStore.isSearchActive = posts.length > 0;
};

const handleClearSearch = async () => {
  postsStore.clearSearch();
  await fetchPosts(1);
};

const changePage = async (page: number) => {
  if (page < 1 || page > postsStore.totalPages || postsStore.loading) return;
  const result = postsStore.isSearchActive
    ? await postsStore.searchPosts(
        postsStore.searchResults[0]?.query || "",
        page
      )
    : await postsStore.fetchPosts(page);
  if (!result.success) {
    toast.add({
      severity: "error",
      summary: "Failed to Load Posts",
      detail: result.error || "An unexpected error occurred",
      life: 5000,
    });
  }
};
</script>

<template>
  <div
    class="max-w-2xl mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
  >
    <div v-if="user">
      <SearchBox
        :loading="postsStore.loading"
        @search="handleSearch"
        @clear="handleClearSearch"
      />
      <PostForm :loading="postsStore.loading" @submit="handleCreatePost" />

      <!-- Loading Spinner for Post List -->
      <div v-if="postsStore.loading" class="flex justify-center py-4">
        <ProgressSpinner style="width: 50px; height: 50px" />
      </div>
      <div
        v-else-if="postsStore.posts.length === 0 && postsStore.isSearchActive"
        class="text-center text-gray-500 py-4"
      >
        No search results found
      </div>
      <PostList
        v-else
        :posts="postsStore.posts"
        @delete="handleDeletePost"
        @updated="
          () =>
            postsStore.isSearchActive
              ? handleClearSearch()
              : postsStore.fetchPosts(postsStore.currentPage)
        "
      />

      <!-- Pagination Controls -->
      <div
        v-if="postsStore.totalPages > 1"
        class="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0 sm:space-x-4"
      >
        <Button
          label="Previous"
          :disabled="postsStore.currentPage === 1 || postsStore.loading"
          @click="changePage(postsStore.currentPage - 1)"
          class="p-button-outlined w-full sm:w-auto hover:bg-gray-100 transition"
        />
        <span class="text-sm text-gray-600">
          Page {{ postsStore.currentPage }} of {{ postsStore.totalPages }}
        </span>
        <Button
          label="Next"
          :disabled="
            postsStore.currentPage === postsStore.totalPages ||
            postsStore.loading
          "
          @click="changePage(postsStore.currentPage + 1)"
          class="p-button-outlined w-full sm:w-auto hover:bg-gray-100 transition"
        />
      </div>
    </div>
    <!-- <div>Loading....</div> -->
    <div v-else-if="isLoading" class="flex justify-center py-4">
      <ProgressSpinner style="width: 50px; height: 50px" />
    </div>
    <div v-else class="text-center text-gray-500 py-4">
      Please log in to view and create posts.
    </div>
  </div>
</template>
