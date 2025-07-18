<script setup lang="ts">
import { usePostsStore } from '~/stores/posts';
import { onMounted } from 'vue';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ProgressSpinner from 'primevue/progressspinner';

const postsStore = usePostsStore();
const toast = useToast();
const confirm = useConfirm();

onMounted(async () => {
  const result = await postsStore.fetchPosts(postsStore.currentPage);
  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Load Posts',
      detail: result.error || 'An unexpected error occurred',
      life: 5000,
    });
  }
});

const handleCreatePost = async (content: string) => {
  const result = await postsStore.createPost(content);
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Post Created', life: 3000 });
  } else {
    toast.add({
      severity: 'error',
      summary: 'Failed to Create Post',
      detail: result.error || 'An unexpected error occurred',
      life: 5000,
    });
  }
};

const handleDeletePost = async (id: string) => {
  confirm.require({
    message: 'Are you sure you want to delete this post?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Yes',
    rejectLabel: 'No',
    accept: async () => {
      const result = await postsStore.deletePost(id);
      if (result.success) {
        toast.add({ severity: 'info', summary: 'Post Deleted', life: 3000 });
      } else {
        toast.add({
          severity: 'error',
          summary: 'Failed to Delete Post',
          detail: result.error || 'An unexpected error occurred',
          life: 5000,
        });
      }
    },
  });
};

const changePage = async (page: number) => {
  if (page >= 1 && page <= postsStore.totalPages) {
    const result = await postsStore.fetchPosts(page);
    if (!result.success) {
      toast.add({
        severity: 'error',
        summary: 'Failed to Load Posts',
        detail: result.error || 'An unexpected error occurred',
        life: 5000,
      });
    }
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
    <PostForm :loading="postsStore.loading" @submit="handleCreatePost" />
    
    <!-- Loading Spinner for Post List -->
    <div v-if="postsStore.loading" class="flex justify-center py-4">
      <ProgressSpinner style="width: 50px; height: 50px" />
    </div>
    <PostList
      v-else
      :posts="postsStore.posts"
      @delete="handleDeletePost"
      @updated="() => postsStore.fetchPosts(postsStore.currentPage)"
    />
    
    <!-- Pagination Controls -->
    <div v-if="postsStore.totalPages > 1" class="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0 sm:space-x-4">
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
        :disabled="postsStore.currentPage === postsStore.totalPages || postsStore.loading"
        @click="changePage(postsStore.currentPage + 1)"
        class="p-button-outlined w-full sm:w-auto hover:bg-gray-100 transition"
      />
    </div>
  </div>
</template>