export const menuItems = [
  {
    isHeadr: true,
    title: "menu",
  },

  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "/app/home",
  },
  {
    isHeadr: true,
    title: "User management",
  },
  {
    title: "Users",
    icon: "heroicons-outline:users",
    child: [
      {
        childtitle: "View",
        childlink: "/app/users",
      },
      {
        childtitle: "Create",
        childlink: "/app/users/create",
      },
    ],
  },
  {
    isHeadr: true,
    title: "Markets",
  },
  {
    title: "Markets",
    icon: "heroicons-outline:chart-bar",
    child: [
      {
        childtitle: "View",
        childlink: "/app/markets",
      },
      {
        childtitle: "Create",
        childlink: "/app/markets/create",
      },
      {
        childtitle: "Categories",
        childlink: "/app/markets/categories",
      },
      {
        childtitle: "Add Category",
        childlink: "/app/markets/categories/create",
      },
      {
        childtitle: "Resolution Requests",
        childlink: "/app/markets/resolution-requests",
      },
    ],
  },
  {
    isHeadr: true,
    title: "Bets",
  },
  {
    title: "Bets",
    icon: "heroicons-outline:ticket",
    child: [
      {
        childtitle: "Dashboard",
        childlink: "/app/bets",
      },
      {
        childtitle: "Bets",
        childlink: "/app/bets/list",
      },
    ],
  },
  {
    isHeadr: true,
    title: "Accounting",
  },
  {
    title: "Accounting",
    icon: "heroicons-outline:calculator",
    child: [
      {
        childtitle: "Accounts",
        childlink: "/app/accounting/accounts",
      },
      {
        childtitle: "Add to Reserve",
        childlink: "/app/accounting/reserve/add",
      },
    ],
  },
];
