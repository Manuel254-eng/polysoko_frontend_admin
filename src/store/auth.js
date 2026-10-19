import { defineStore } from "pinia";
import api from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
  }),
  getters: {
    permissions: (state) => state.user?.permissions || [],
  },
  actions: {
    // A permission name, or a list meaning "any of these".
    can(required) {
      return hasPermission(this.permissions, required);
    },
    async fetchMe() {
      const response = await api.get("/user/staff/me/");
      this.user = response.data;
      localStorage.setItem("activeUser", JSON.stringify(response.data));
      return response.data;
    },
    async logout() {
      try {
        await api.post("/user/logout/");
      } catch {
        // ignore — cookies may already be gone/expired, still clear local state
      }
      this.user = null;
      localStorage.removeItem("activeUser");
    },
  },
});
