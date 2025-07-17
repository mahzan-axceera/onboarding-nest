<script setup>
defineProps({ post: Object });
const emit = defineEmits(["delete", "view", "edit"]);

function handleDelete() {
  emit("delete");
}
</script>

<template>
  <div
    class="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm hover:shadow-md transition"
  >
    <!-- Header: Avatar + Author + Timestamp -->
    <div class="flex items-center gap-3 mb-3">
      <div
        class="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm"
      >
        {{ post.author?.name?.charAt(0).toUpperCase() }}
      </div>
      <div>
        <p class="text-sm font-semibold text-gray-800">
          {{ post.author?.name }}
          <span class="text-gray-400 text-xs ml-1"
            >({{ post.author?.email }})</span
          >
        </p>
        <p class="text-xs text-gray-400">
          {{ new Date(post.createdAt).toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- Content -->
    <p class="text-base text-gray-900 mb-3 whitespace-pre-line">
      {{ post.content }}
    </p>

    <!-- Actions -->
    <div class="mt-2 flex gap-4 text-sm text-blue-500 font-medium">
      <button @click="emit('view')" class="hover:underline">View</button>
      <button @click="emit('edit')" class="hover:underline">Edit</button>
      <button class="text-red-500 hover:underline" @click="handleDelete">
        Delete
      </button>
    </div>
  </div>
</template>
