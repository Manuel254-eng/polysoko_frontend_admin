import { menuItems } from "@/constant/data";

// `required` is a permission name, a list meaning "any of these", or empty
// (open to every staff member).
export function hasPermission(permissions, required) {
  if (!required) return true;
  const anyOf = Array.isArray(required) ? required : [required];
  return anyOf.some((name) => permissions.includes(name));
}

// The menu with everything this staff member can't use removed: items and
// sub-items without the permission, groups left with no sub-items, and
// section headers with nothing under them.
export function visibleMenu(permissions, items = menuItems) {
  const kept = [];
  for (const item of items) {
    if (item.isHeadr) {
      kept.push(item);
      continue;
    }
    if (!hasPermission(permissions, item.permission)) continue;
    if (item.child) {
      const child = item.child.filter((ci) => hasPermission(permissions, ci.permission));
      if (child.length) kept.push({ ...item, child });
    } else {
      kept.push(item);
    }
  }
  // Drop headers with no items before the next header.
  return kept.filter((item, i) => !item.isHeadr || (kept[i + 1] && !kept[i + 1].isHeadr));
}

// Where to send a staff member who lands somewhere they can't use (or on the
// dashboard without report access): their first menu entry.
export function firstAllowedPath(permissions) {
  for (const item of visibleMenu(permissions)) {
    if (item.isHeadr) continue;
    if (item.link) return item.link;
    if (item.child?.length) return item.child[0].childlink;
  }
  return null;
}
