import { useAuthStore } from "@/store/auth";
import { firstAllowedPath } from "@/lib/permissions";

export default async function auth({ to, next }) {
  if (!localStorage.activeUser) {
    return next({ name: "Login" });
  }

  const authStore = useAuthStore();
  try {
    await authStore.fetchMe();
  } catch {
    // /user/staff/me/ rejects anything that isn't a staff session — e.g. a
    // player's cookie left over on this shared origin. Sign out silently and
    // send them to login, no error message.
    await authStore.logout();
    return next({ name: "Login" });
  }

  // A page this staff member's role can't use (typed URL, old link, or the
  // dashboard for someone without report access): send them to the first
  // page they can.
  const required = to.matched.map((record) => record.meta.permission).filter(Boolean);
  if (required.every((permission) => authStore.can(permission))) {
    return next();
  }
  const fallback = firstAllowedPath(authStore.permissions);
  if (fallback && fallback !== to.path) {
    return next(fallback);
  }
  return next({ name: "404" });
}
