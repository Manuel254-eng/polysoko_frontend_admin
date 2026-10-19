// `permission` (a name, or a list meaning "any of these") hides an item from
// staff without it — the same permission its page's API calls need, so
// nobody is shown a page that would only answer 403. Items without one are
// open to all staff. See lib/permissions.js.
export const menuItems = [
  {
    isHeadr: true,
    title: "menu",
  },

  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "/app/home",
    permission: "VIEW_REPORTS",
  },
  {
    isHeadr: true,
    title: "Urgent actions",
  },
  {
    title: "Urgent actions",
    icon: "heroicons-outline:exclamation-circle",
    link: "/app/urgent-actions",
    permission: "VIEW_REPORTS",
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
        permission: "VIEW_USER",
      },
      {
        childtitle: "Create",
        childlink: "/app/users/create",
        permission: "CREATE_USER",
      },
    ],
  },
  {
    title: "Players",
    icon: "heroicons-outline:user-group",
    link: "/app/users/clients",
    permission: "VIEW_USER",
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
        permission: "UPDATE_MARKET",
      },
      {
        childtitle: "Create",
        childlink: "/app/markets/create",
        permission: "CREATE_MARKET",
      },
      {
        childtitle: "Categories",
        childlink: "/app/markets/categories",
        permission: "CREATE_MARKET_CATEGORY",
      },
      {
        childtitle: "Add Category",
        childlink: "/app/markets/categories/create",
        permission: "CREATE_MARKET_CATEGORY",
      },
      {
        childtitle: "Campuses",
        childlink: "/app/markets/campuses",
        permission: "VIEW_CAMPUS",
      },
      {
        childtitle: "Resolution Requests",
        childlink: "/app/markets/resolution-requests",
        permission: "APPROVE_MARKET_RESOLUTION",
      },
      {
        childtitle: "Combos",
        childlink: "/app/markets/combos",
        permission: ["CREATE_COMBO", "UPDATE_COMBO"],
      },
      {
        childtitle: "Jackpots",
        childlink: "/app/markets/jackpots",
        permission: ["CREATE_JACKPOT", "UPDATE_JACKPOT"],
      },
    ],
  },
  {
    isHeadr: true,
    title: "Research",
  },
  {
    title: "Proposals",
    icon: "heroicons-outline:light-bulb",
    child: [
      {
        childtitle: "Proposals",
        childlink: "/app/proposals",
        permission: ["PROPOSE_MARKET", "REVIEW_MARKET_PROPOSAL"],
      },
      {
        childtitle: "Propose a market",
        childlink: "/app/proposals/create",
        permission: "PROPOSE_MARKET",
      },
      {
        childtitle: "Search markets",
        childlink: "/app/proposals/search",
        permission: "PROPOSE_MARKET",
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
        permission: "VIEW_REPORTS",
      },
      {
        childtitle: "Bets",
        childlink: "/app/bets/list",
        permission: "VIEW_REPORTS",
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
        permission: "VIEW_REPORTS",
      },
      {
        childtitle: "Add to Reserve",
        childlink: "/app/accounting/reserve/add",
        permission: "DEPOSIT_TO_PLATFORM",
      },
    ],
  },
  {
    isHeadr: true,
    title: "Testing",
  },
  {
    title: "Test tools",
    icon: "heroicons-outline:beaker",
    link: "/app/testing",
    permission: "CREATE_USER",
  },
];
