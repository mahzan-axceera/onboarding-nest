<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { InputText } from "primevue";

const props = defineProps({ post: Object });
const visible = defineModel("visible", { type: Boolean });
const emit = defineEmits(["updated"]);

const content = ref("");
const toast = useToast();

watch(
  () => props.post,
  (newPost) => {
    content.value = newPost?.content || "";
  },
  { immediate: true }
);

async function updatePost() {
  try {
    console.log("Updating post:", props.post.id);
    await $fetch(`http://localhost:3001/posts/${props.post.id}`, {
      method: "PATCH",
      body: { content: content.value },
    });
    toast.add({ severity: "success", summary: "Post Updated", life: 3000 });
    emit("updated");
    visible.value = false;
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Update Failed",
      detail: e.message,
      life: 5000,
    });
    console.error("Update failed:", e);
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
      <InputText v-model="content" autoResize rows="5" class="w-full" />
      <div class="text-right">
        <Button label="Update" @click="updatePost" class="p-button-success" />
      </div>
    </div>
  </Dialog>
</template>
