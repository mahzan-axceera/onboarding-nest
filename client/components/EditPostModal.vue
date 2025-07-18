<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import { usePostsStore } from "~/stores/posts";
import { useToast } from "primevue/usetoast";

const props = defineProps({ post: Object });
const visible = defineModel("visible", { type: Boolean });
const emit = defineEmits(["updated"]);

const postsStore = usePostsStore();
const toast = useToast();
const content = ref("");

watch(
  () => props.post,
  (newPost) => {
    content.value = newPost?.content || "";
  },
  { immediate: true }
);

async function updatePost() {
  if (!content.value.trim()) {
    toast.add({
      severity: "error",
      summary: "Update Failed",
      detail: "Content cannot be empty",
      life: 5000,
    });
    return;
  }

  const result = await postsStore.updatePost(props.post.id, content.value);
  if (result.success) {
    toast.add({ severity: "success", summary: "Post Updated", life: 3000 });
    emit("updated");
    visible.value = false;
  } else {
    toast.add({
      severity: "error",
      summary: "Update Failed",
      detail: result.error,
      life: 5000,
    });
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Edit Post"
    :style="{ width: '30rem' }"
  >
    <div class="space-y-4">
      <Textarea v-model="content" autoResize rows="5" class="w-full" />
      <div class="text-right">
        <Button
          :label="postsStore.loadingUpdate ? 'Updating...' : 'Update'"
          :disabled="postsStore.loadingUpdate"
          @click="updatePost"
          class="p-button-success"
        />
      </div>
    </div>
  </Dialog>
</template>
