<script setup>
import Dialog from "primevue/dialog";
defineProps({ post: Object });
const visible = defineModel("visible", { type: Boolean });
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Post Details"
    :style="{ width: '30rem' }"
  >
    <div class="text-black space-y-2">
      <p><strong>Content:</strong> {{ post.content }}</p>
      <p>
        <strong>Author:</strong> {{ post.author?.name }} ({{
          post.author?.email
        }})
      </p>
      <p>
        <strong>Created:</strong>
        {{ new Date(post.createdAt).toLocaleString() }}
      </p>
    </div>
  </Dialog>
</template>
