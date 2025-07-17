<script setup>
import PostItem from "./PostItem.vue";
import ViewPostModal from './ViewPostModal.vue'
import EditPostModal from './EditPostModal.vue'

defineProps({ posts: Array });
const emit = defineEmits(["delete", "updated"]);

import { ref } from 'vue'

const selectedPost = ref(null)
const showView = ref(false)
const showEdit = ref(false)

function openView(post) {
  selectedPost.value = post
  showView.value = true
}

function openEdit(post) {
  selectedPost.value = post
  showEdit.value = true
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

    <ViewPostModal v-if="selectedPost" v-model:visible="showView" :post="selectedPost" />
    <EditPostModal
      v-if="selectedPost"
      v-model:visible="showEdit"
      :post="selectedPost"
      @updated="emit('updated')"
    />
  </div>
</template>