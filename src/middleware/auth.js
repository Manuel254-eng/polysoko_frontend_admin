import { useAuthStore } from "@/store/auth";

export default async function auth({ next }) {
  if (!localStorage.activeUser) {
    return next({ name: "Login" });
  }

  const authStore = useAuthStore();
  try {
    await authStore.fetchMe();
    return next();
  } catch {
    // /user/staff/me/ rejects anything that isn't a staff session — e.g. a
    // player's cookie left over on this shared origin. Sign out silently and
    // send them to login, no error message.
    await authStore.logout();
    return next({ name: "Login" });
  }
}