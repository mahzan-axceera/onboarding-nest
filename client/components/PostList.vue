<script setup lang="ts">
import { ref } from "vue";
import type { Post } from "~/types/post";
import EditPostModal from "./EditPostModal.vue";
import PostItem from "./PostItem.vue";
import ViewPostModal from "./ViewPostModal.vue";

defineProps<{ posts: Post[] }>();
const emit = defineEmits<{
  (e: "delete", id: number): void;
  (e: "updated"): void;
}>();

const selectedPost = ref<Post | null>(null);
const showView = ref(false);
const showEdit = ref(false);

function openView(post: Post) {
  selectedPost.value = post;
  showView.value = true;
}

function openEdit(post: Post) {
  selectedPost.value = post;
  showEdit.value = true;
}
</script>

<template>
  <div>
    <PostItem
      v-for="post in posts"
      :key="post.id"
      :post="post"
      @delete="emit('delete', post.id)"
      @view="openView(post)"
      @edit="openEdit(post)"
    />

    <ViewPostModal
      v-if="selectedPost"
      v-model:visible="showView"
      :post="selectedPost"
    />
    <EditPostModal
      v-if="selectedPost"
      v-model:visible="showEdit"
      :post="selectedPost"
      @updated="emit('updated')"
    />
  </div>
</template>
