<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import PostForm from "~/components/PostForm.vue";
import PostList from "~/components/PostList.vue";

const posts = ref([]);
const loading = ref(false);

const toast = useToast();
const confirm = useConfirm();

async function fetchPosts() {
  const data = await $fetch("http://localhost:3001/posts");
  posts.value = data?.data || [];
}

async function createPost(content) {
  if (!content.trim()) return;

  loading.value = true;

  try {
    await $fetch("http://localhost:3001/posts", {
      method: "POST",
      body: {
        content,
        authorId: "f71d155b-2b45-4f6c-85b9-1be1a846d3f3",
      },
    });

    await fetchPosts();
    toast.add({ severity: "success", summary: "Post Created", life: 3000 });
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Post Failed",
      detail: e.message,
      life: 5000,
    });
  }

  loading.value = false;
}

async function deletePost(id) {
  return new Promise((resolve) => {
    confirm.require({
      message: "Are you sure you want to delete this post?",
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClass: "p-button-danger",
      acceptLabel: "Yes",
      rejectLabel: "No",
      accept: async () => {
        const previousPosts = [...posts.value];
        posts.value = posts.value.filter((post) => post.id !== id);

        try {
          await $fetch(`http://localhost:3001/posts/${id}`, {
            method: "DELETE",
          });
          toast.add({ severity: "info", summary: "Post Deleted", life: 3000 });
        } catch (error) {
          posts.value = previousPosts;
          toast.add({
            severity: "error",
            summary: "Delete Failed",
            detail: error.message,
            life: 5000,
          });
        }

        resolve(true);
      },
      reject: () => {
        resolve(false);
      },
    });
  });
}

onMounted(fetchPosts);
</script>

<template>
  <div
    class="max-w-2xl mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
  >

    <PostForm :loading="loading" @submit="createPost" />
    <PostList :posts="posts" @delete="deletePost" @updated="fetchPosts" />
  </div>
</template>
