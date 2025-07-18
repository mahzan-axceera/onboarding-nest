import { defineStore } from 'pinia';
import type { State, ActionResult, Post } from '~/types/post';

// const config = useRuntimeConfig();
const apiBaseUrl = 'http://localhost:3001';

export const usePostsStore = defineStore('posts', {
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
  }),

  actions: {
    async fetchTotalPosts(): Promise<ActionResult> {

      try {
        const allPosts = await $fetch<{ data: Post[] }>(`${apiBaseUrl}/posts?page=1&limit=1000`);
        this.totalPosts = allPosts.data.length;
        this.totalPages = Math.ceil(this.totalPosts / this.limit);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async fetchPosts(page: number = 1): Promise<ActionResult> {
      this.loading = true;
      try {
        const response = await $fetch<{ data: Post[] }>(`${apiBaseUrl}/posts?page=${page}&limit=${this.limit}`);
        this.posts = response.data || [];
        this.currentPage = page;
        if (this.totalPosts === 0) {
          await this.fetchTotalPosts();
        } else {
          this.totalPages = Math.ceil(this.totalPosts / this.limit);
        }
        this.isSearchActive = false;
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async searchPosts(query: string, page: number = 1): Promise<ActionResult> {
      if (!query.trim()) return { success: false, error: 'Query cannot be empty' };
      // Check cache
      const cachedResult = this.searchResults.find((result) => result.query === query);
      if (cachedResult && Date.now() - cachedResult.timestamp < 5 * 60 * 1000) { // Cache valid for 5 minutes
        this.posts = cachedResult.posts.slice((page - 1) * this.limit, page * this.limit);
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
          this.posts = response.data.slice((page - 1) * this.limit, page * this.limit);
          this.currentPage = page;
          this.totalPages = Math.ceil(response.data.length / this.limit);
          this.isSearchActive = true;
          return { success: true };
        } else {
          this.posts = [];
          this.currentPage = 1;
          this.totalPages = 1;
          this.isSearchActive = true;
          return { success: false, error: 'No results found' };
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

    async createPost(post: { title: string; bodyText?: string; imageUrl?: string }): Promise<ActionResult> {
      if (!post.title.trim()) return { success: false, error: 'Title cannot be empty' };
      this.loading = true;
      try {
        await $fetch(`${apiBaseUrl}/posts`, {
          method: 'POST',
          body: {
            title: post.title,
            bodyText: post.bodyText,
            imageUrl: post.imageUrl,
            authorId: 'f71d155b-2b45-4f6c-85b9-1be1a846d3f3',
          },
        });
        await this.fetchPosts(this.currentPage);
        this.totalPosts++;
        this.totalPages = Math.ceil(this.totalPosts / this.limit);
        this.searchResults = []; // Clear cache on new post
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async deletePost(id: string): Promise<ActionResult> {
      const previousPosts = [...this.posts];
      this.posts = this.posts.filter((post) => post.id !== id);
      try {
        await $fetch(`${apiBaseUrl}/posts/${id}`, {
          method: 'DELETE',
        });
        this.totalPosts = Math.max(0, this.totalPosts - 1);
        this.totalPages = Math.ceil(this.totalPosts / this.limit);
        this.searchResults = []; // Clear cache on delete
        return { success: true };
      } catch (error: any) {
        this.posts = previousPosts;
        return { success: false, error: error.message };
      }
    },

    async updatePost(id: string, post: { title: string; bodyText?: string; imageUrl?: string }): Promise<ActionResult> {
      if (!post.title.trim()) return { success: false, error: 'Title cannot be empty' };
      this.loadingUpdate = true;
      try {
        await $fetch(`${apiBaseUrl}/posts/${id}`, {
          method: 'PATCH',
          body: { title: post.title, bodyText: post.bodyText, imageUrl: post.imageUrl },
        });
        await this.fetchPosts(this.currentPage);
        this.searchResults = []; // Clear cache on update
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
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