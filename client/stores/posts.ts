import { defineStore } from "pinia";
import type { State, ActionResult, Post } from "~/types/post";

// const config = useRuntimeConfig();
const apiBaseUrl = "http://localhost:3001";

export const usePostsStore = defineStore("posts", {
  state: (): State => ({
    posts: [],
    searchResults: [],
    loading: false,
    loadingUpdate: false,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalPosts: 0,
    isSearchActive: false,
    fetchedUserId: null,
  }),

  actions: {
    async fetchTotalPosts(): Promise<ActionResult> {
      const authStore = useAuthStore();
      if (!authStore.accessToken) {
        return { success: false, error: "User not authenticated" };
      }
      if (this.fetchedUserId === authStore.user?.id) return { success: true };
      try {
        const response = await $fetch<{ status: boolean; data: Post[] }>(
          `${apiBaseUrl}/posts?page=1&limit=1000`,
          {
            headers: {
              Authorization: `Bearer ${authStore.accessToken}`,
            },
            credentials: "include",
          }
        );
        if (response.status) {
          this.totalPosts = response.data.length;
          this.totalPages = Math.ceil(this.totalPosts / this.limit);
          return { success: true };
        }
        return { success: false, error: "Failed to fetch total posts" };
      } catch (error: any) {
        if (error.response?.status === 401) {
          const refreshResult = await authStore.refreshAccessToken();
          console.log("Refresh result:", refreshResult);

          if (refreshResult.success) {
            return await this.fetchTotalPosts();
          }
          return {
            success: false,
            error: "Authentication failed. Please log in again.",
          };
        }
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      }
    },

    async fetchPosts(page: number = 1): Promise<ActionResult> {
      const authStore = useAuthStore();
      if (!authStore.accessToken) {
        return { success: false, error: "User not authenticated" };
      }
      if (this.fetchedUserId === authStore.user?.id) return { success: true };
      this.loading = true;
      try {
        const response = await $fetch<{ status: boolean; data: Post[] }>(
          `${apiBaseUrl}/posts?page=${page}&limit=${this.limit}`,
          {
            headers: {
              Authorization: `Bearer ${authStore.accessToken}`,
            },
            credentials: "include",
          }
        );
        if (response.status) {
          this.posts = response.data || [];
          this.currentPage = page;
          if (this.totalPosts === 0) {
            await this.fetchTotalPosts();
          } else {
            this.totalPages = Math.ceil(this.totalPosts / this.limit);
          }
          this.isSearchActive = false;
          return { success: true };
        }
        return { success: false, error: "Failed to fetch posts" };
      } catch (error: any) {
        if (error.response?.status === 401) {
          const refreshResult = await authStore.refreshAccessToken();
          if (refreshResult.success) {
            return await this.fetchPosts(page);
          }
          return {
            success: false,
            error: "Authentication failed. Please log in again.",
          };
        }
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loading = false;
      }
    },

    async searchPosts(query: string, page: number = 1): Promise<ActionResult> {
      if (!query.trim())
        return { success: false, error: "Query cannot be empty" };
      // Check cache
      const cachedResult = this.searchResults.find(
        (result) => result.query === query
      );
      if (cachedResult && Date.now() - cachedResult.timestamp < 5 * 60 * 1000) {
        // Cache valid for 5 minutes
        this.posts = cachedResult.posts.slice(
          (page - 1) * this.limit,
          page * this.limit
        );
        this.currentPage = page;
        this.totalPages = Math.ceil(cachedResult.posts.length / this.limit);
        this.isSearchActive = true;
        return { success: true };
      }
      this.loading = true;
      try {
        const response = await $fetch<{ status: boolean; data: Post[] }>(
          `${apiBaseUrl}/posts/search?q=${encodeURIComponent(query)}`
        );
        if (response.status && response.data) {
          this.searchResults = [
            { query, posts: response.data, timestamp: Date.now() },
            ...this.searchResults.slice(0, 4),
          ];
          this.posts = response.data.slice(
            (page - 1) * this.limit,
            page * this.limit
          );
          this.currentPage = page;
          this.totalPages = Math.ceil(response.data.length / this.limit);
          this.isSearchActive = true;
          return { success: true };
        } else {
          this.posts = [];
          this.currentPage = 1;
          this.totalPages = 1;
          this.isSearchActive = true;
          return { success: false, error: "No results found" };
        }
      } catch (error: any) {
        this.posts = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.isSearchActive = true;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async createPost(formData: FormData): Promise<ActionResult> {
      const authStore = useAuthStore();
      if (!authStore.user || !authStore.accessToken) {
        return { success: false, error: "User not authenticated" };
      }
      this.loading = true;
      try {
        const response = await $fetch<{ status: boolean; data: Post }>(
          `${apiBaseUrl}/posts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStore.accessToken}`,
            },
            body: formData,
            credentials: "include",
          }
        );

        if (response.status) {
          await this.fetchPosts(this.currentPage);
          this.totalPosts++;
          this.totalPages = Math.ceil(this.totalPosts / this.limit);
          this.searchResults = [];
          return { success: true };
        }

        return { success: false, error: "Failed to create post" };
      } catch (error: any) {
        if (error.response?.status === 401) {
          const refreshResult = await authStore.refreshAccessToken();
          if (refreshResult.success) {
            return await this.createPost(formData); // Retry after refresh
          }
          return {
            success: false,
            error: "Authentication failed. Please log in again.",
          };
        }
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loading = false;
      }
    },

    async deletePost(id: number): Promise<ActionResult> {
      const authStore = useAuthStore();
      if (!authStore.accessToken) {
        return { success: false, error: "User not authenticated" };
      }
      const previousPosts = [...this.posts];
      this.posts = this.posts.filter((post) => post.id !== id);
      try {
        const response = await $fetch<{ status: boolean; message?: string }>(
          `${apiBaseUrl}/posts/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${authStore.accessToken}`,
            },
            credentials: "include",
          }
        );
        if (response.status) {
          this.totalPosts = Math.max(0, this.totalPosts - 1);
          this.totalPages = Math.ceil(this.totalPosts / this.limit);
          this.searchResults = [];
          return { success: true };
        }
        this.posts = previousPosts;
        return {
          success: false,
          error: response.message || "Failed to delete post",
        };
      } catch (error: any) {
        this.posts = previousPosts;
        if (error.response?.status === 401) {
          const refreshResult = await authStore.refreshAccessToken();
          if (refreshResult.success) {
            return await this.deletePost(id); // Retry after refresh
          }
          return {
            success: false,
            error: "Authentication failed. Please log in again.",
          };
        }
        // Handle 403 explicitly to avoid retry loop
        if (error.response?.status === 403) {
          return {
            success: false,
            error: "Not authorized to delete this post",
          };
        }
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      }
    },

    async updatePost(id: number, formData: FormData): Promise<ActionResult> {
      const authStore = useAuthStore();
      if (!formData.get("title")?.toString().trim())
        return { success: false, error: "Title cannot be empty" };
      if (!authStore.accessToken) {
        return { success: false, error: "User not authenticated" };
      }
      this.loadingUpdate = true;
      try {
        const response = await $fetch<{ status: boolean; data: Post }>(
          `${apiBaseUrl}/posts/${id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${authStore.accessToken}`,
            },
            body: formData,
            credentials: "include",
          }
        );
        if (response.status) {
          await this.fetchPosts(this.currentPage);
          this.searchResults = [];
          return { success: true };
        }
        return { success: false, error: "Failed to update post" };
      } catch (error: any) {
        if (error.response?.status === 401) {
          const refreshResult = await authStore.refreshAccessToken();
          if (refreshResult.success) {
            return await this.updatePost(id, formData);
          }
          return {
            success: false,
            error: "Authentication failed. Please log in again.",
          };
        }
        if (error.response?.status === 403) {
          return {
            success: false,
            error: "Not authorized to update this post",
          };
        }
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loadingUpdate = false;
      }
    },

    clearSearch() {
      this.posts = [];
      this.currentPage = 1;
      this.totalPages = 1;
      this.isSearchActive = false;
      this.searchResults = []; // Clear cache on reset
    },
  },
});
