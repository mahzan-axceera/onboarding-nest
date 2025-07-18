import { defineStore } from "pinia";

export const usePostsStore = defineStore("posts", {
  state: () => ({
    posts: [],
    loading: false,
    loadingUpdate: false, // New state for update loading
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  }),

  actions: {
    async fetchPosts(page = 1) {
      this.loading = true;
      try {
        const response = await $fetch(
          `http://localhost:3001/posts?page=${page}&limit=${this.limit}`
        );
        this.posts = response.data || [];
        this.currentPage = page;
        this.totalPages = response.data.length < this.limit ? page : page + 1;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async createPost(content) {
      if (!content.trim())
        return { success: false, error: "Content cannot be empty" };
      this.loading = true;
      try {
        await $fetch("http://localhost:3001/posts", {
          method: "POST",
          body: {
            content,
            authorId: "f71d155b-2b45-4f6c-85b9-1be1a846d3f3",
          },
        });
        await this.fetchPosts(this.currentPage);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async deletePost(id) {
      const previousPosts = [...this.posts];
      this.posts = this.posts.filter((post) => post.id !== id);
      try {
        await $fetch(`http://localhost:3001/posts/${id}`, {
          method: "DELETE",
        });
        return { success: true };
      } catch (error) {
        this.posts = previousPosts;
        return { success: false, error: error.message };
      }
    },

    async updatePost(id, content) {
      if (!content.trim())
        return { success: false, error: "Content cannot be empty" };
      this.loadingUpdate = true;
      try {
        await $fetch(`http://localhost:3001/posts/${id}`, {
          method: "PATCH",
          body: { content },
        });
        await this.fetchPosts(this.currentPage);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        this.loadingUpdate = false;
      }
    },
  },
});
