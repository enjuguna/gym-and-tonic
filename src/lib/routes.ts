export type AppRoute = "today" | "plan" | "progress" | "meals" | "settings";

export interface AppRouteDefinition {
  id: AppRoute;
  label: string;
  href: `/${string}`;
}

export const APP_ROUTES: readonly AppRouteDefinition[] = [
  { id: "today", label: "Today", href: "/today" },
  { id: "plan", label: "Plan", href: "/plan" },
  { id: "progress", label: "Progress", href: "/progress" },
  { id: "meals", label: "Meals", href: "/meals" },
] as const;
