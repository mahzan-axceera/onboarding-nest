<script setup>
import { usePostsStore } from '~/stores/posts';
import PostForm from '~/components/PostForm.vue';
import PostList from '~/components/PostList.vue';
import { onMounted } from 'vue';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const postsStore = usePostsStore();
const toast = useToast();
const confirm = useConfirm();

onMounted(async () => {
  const result = await postsStore.fetchPosts(postsStore.currentPage);
  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Fetch Failed',
      detail: result.error,
      life: 5000,
    });
  }
});

const handleCreatePost = async (content) => {
  const result = await postsStore.createPost(content);
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Post Created', life: 3000 });
  } else {
    toast.add({
      severity: 'error',
      summary: 'Post Failed',
      detail: result.error,
      life: 5000,
    });
  }
};

const handleDeletePost = async (id) => {
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
          summary: 'Delete Failed',
          detail: result.error,
          life: 5000,
        });
      }
    },
  });
};

const changePage = async (page) => {
  if (page >= 1 && page <= postsStore.totalPages) {
    const result = await postsStore.fetchPosts(page);
    if (!result.success) {
      toast.add({
        severity: 'error',
        summary: 'Fetch Failed',
        detail: result.error,
        life: 5000,
      });
    }
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
    <PostForm :loading="postsStore.loading" @submit="handleCreatePost" />
    <PostList :posts="postsStore.posts" @delete="handleDeletePost" @updated="() => postsStore.fetchPosts(postsStore.currentPage)" />
    <div v-if="postsStore.totalPages > 1" class="flex justify-between items-center mt-4">
      <Button
        label="Previous"
        :disabled="postsStore.currentPage === 1"
        @click="changePage(postsStore.currentPage - 1)"
        class="p-button-outlined"
      />
      <span class="text-sm text-gray-600">
        Page {{ postsStore.currentPage }} of {{ postsStore.totalPages }}
      </span>
      <Button
        label="Next"
        :disabled="postsStore.currentPage === postsStore.totalPages"
        @click="changePage(postsStore.currentPage + 1)"
        class="p-button-outlined"
      />
    </div>
  </div>
</template>