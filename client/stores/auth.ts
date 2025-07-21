import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ActionResult } from '~/types/post';
import type { Role } from '~/types/auth';

const apiBaseUrl = 'http://localhost:3001'; // Update to match your backend port

export interface User {
    id: number;
    email: string;
    name: string;
    role: Role;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        accessToken: null as string | null,
        loading: false,
    }),

    actions: {
        async register(payload: { email: string; name: string; password: string; }): Promise<ActionResult> {
            this.loading = true;
            try {
                console.log("Registering with payload:", payload);
                
                const response = await $fetch<{ status: boolean; data: User }>(`${apiBaseUrl}/auth/register`, {
                    method: 'POST',
                    body: payload,
                });
                console.log("Register payload:", payload);
                
                console.log('Registration failed:', response);
                if (response.status) {
                    this.user = response.data;
                    return { success: true };
                }
                
                return { success: false, error: 'Registration failed' };
            } catch (error: any) {
                console.log('Registration error:', error);
                
                return { success: false, error: error.response?._data?.message || 'An unexpected error occurred' };
            } finally {
                this.loading = false;
            }
        },

        // Placeholder for login and logout (added in later steps)
        async login(payload: { email: string; password: string }): Promise<ActionResult> {
            // To be implemented
            return { success: false, error: 'Not implemented' };
        },

        async logout(): Promise<ActionResult> {
            // To be implemented
            return { success: false, error: 'Not implemented' };
        },

        clearAuth() {
            this.user = null;
            this.accessToken = null;
        },
    },
});