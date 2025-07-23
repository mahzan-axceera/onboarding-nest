import { defineStore } from "pinia";
import type { Role } from "~/types/auth";
import type { ActionResult } from "~/types/post";

const apiBaseUrl = "http://localhost:3001";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
    loading: false,
    initialized: false,
  }),

  actions: {
    async register(payload: {
      email: string;
      name: string;
      password: string;
    }): Promise<ActionResult> {
      this.loading = true;
      try {
        const response = await $fetch<{ status: boolean; data: User }>(
          `${apiBaseUrl}/auth/register`,
          {
            method: "POST",
            body: payload,
          }
        );
        if (response.status) {
          this.user = response.data;
          return { success: true };
        }

        return { success: false, error: "Registration failed" };
      } catch (error: any) {
        console.log("Registration error:", error);

        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loading = false;
      }
    },

    async login(payload: {
      email: string;
      password: string;
    }): Promise<ActionResult> {
      this.loading = true;
      try {
        const response = await $fetch<{
          status: boolean;
          data: { accessToken: string; user: User };
        }>(`${apiBaseUrl}/auth/login`, {
          method: "POST",
          body: payload,
          credentials: "include",
        });
        console.log("Login response:", response); // Debug log
        if (response.status) {
          this.user = response.data.user;
          this.accessToken = response.data.accessToken;

          console.log("Current cookies:", document.cookie); // Debug log
          return { success: true };
        }
        return { success: false, error: "Login failed" };
      } catch (error: any) {
        console.log("Login error:", error);
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loading = false;
      }
    },

    async refreshAccessToken(): Promise<ActionResult> {
      this.loading = true;

      try {
        const response = await $fetch<{
          status: boolean;
          data: { accessToken: string };
        }>(`${apiBaseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (response.status) {
          this.accessToken = response.data.accessToken;
          // Fetch user data to restore user state
          const userResponse = await $fetch<{ status: boolean; data: User }>(
            `${apiBaseUrl}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
              credentials: "include",
            }
          );
          if (userResponse.status) {
            this.user = userResponse.data;
            this.initialized = true;
            return { success: true };
          }
          return { success: false, error: "Failed to fetch user data" };
        }
        return { success: false, error: "Refresh token invalid" };
      } catch (error: any) {
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loading = false;
      }
    },

    async logout(): Promise<ActionResult> {
      this.loading = true;
      try {
        const response = await $fetch<{
          status: boolean;
          data: { message: string };
        }>(`${apiBaseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          credentials: "include",
        });

        if (response.status) {
          this.clearAuth();
          return { success: true };
        }
        return { success: false, error: "Logout failed" };
      } catch (error: any) {
        return {
          success: false,
          error:
            error.response?._data?.message || "An unexpected error occurred",
        };
      } finally {
        this.loading = false;
      }
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;

      const postsStore = usePostsStore();
      postsStore.$reset();
      this.initialized = false;

      document.cookie =
        "refreshToken=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
      console.log("Cleared auth, cookies:", document.cookie);
    },
  },
});
