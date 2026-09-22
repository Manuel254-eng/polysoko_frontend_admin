import { defineStore } from "pinia";
import api from "@/lib/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
  }),
  actions: {
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
