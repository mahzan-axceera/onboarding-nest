import { defineStore } from 'pinia';

export interface Post {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
}

interface State {
  posts: Post[];
  loading: boolean;
  loadingUpdate: boolean;
  currentPage: number;
  totalPages: number;
  limit: number;
  totalPosts: number;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export const usePostsStore = defineStore('posts', {
  state: (): State => ({
    posts: [],
    loading: false,
    loadingUpdate: false,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalPosts: 0,
  }),

  actions: {
    async fetchTotalPosts(): Promise<ActionResult> {
      try {
        const allPosts = await $fetch<{ data: Post[] }>('http://localhost:3001/posts?page=1&limit=1000');
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
        const response = await $fetch<{ data: Post[] }>(`http://localhost:3001/posts?page=${page}&limit=${this.limit}`);
        this.posts = response.data || [];
        this.currentPage = page;
        if (this.totalPosts === 0) {
          await this.fetchTotalPosts();
        } else {
          this.totalPages = Math.ceil(this.totalPosts / this.limit);
        }
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async createPost(content: string): Promise<ActionResult> {
      if (!content.trim()) return { success: false, error: 'Content cannot be empty' };
      this.loading = true;
      try {
        await $fetch('http://localhost:3001/posts', {
          method: 'POST',
          body: {
            content,
            authorId: 'f71d155b-2b45-4f6c-85b9-1be1a846d3f3',
          },
        });
        await this.fetchPosts(this.currentPage);
        this.totalPosts++;
        this.totalPages = Math.ceil(this.totalPosts / this.limit);
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
        await $fetch(`http://localhost:3001/posts/${id}`, {
          method: 'DELETE',
        });
        this.totalPosts = Math.max(0, this.totalPosts - 1);
        this.totalPages = Math.ceil(this.totalPosts / this.limit);
        return { success: true };
      } catch (error: any) {
        this.posts = previousPosts;
        return { success: false, error: error.message };
      }
    },

    async updatePost(id: string, content: string): Promise<ActionResult> {
      if (!content.trim()) return { success: false, error: 'Content cannot be empty' };
      this.loadingUpdate = true;
      try {
        await $fetch(`http://localhost:3001/posts/${id}`, {
          method: 'PATCH',
          body: { content },
        });
        await this.fetchPosts(this.currentPage);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        this.loadingUpdate = false;
      }
    },
  },
});