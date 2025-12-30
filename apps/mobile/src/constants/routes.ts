/**
 * Route Constants
 * Centralized route definitions for type-safe navigation
 */

export const ROUTES = {
  // Landing & Auth
  LANDING: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY: '/auth/verify',

  // Main Tabs
  DASHBOARD: '/(tabs)/dashboard',
  PETS: '/(tabs)/pets',
  ALERTS: '/(tabs)/alerts',
  SETTINGS: '/(tabs)/settings',

  // Pet Management
  ADD_PET: '/add-pet',
  PET_PROFILE: (id: string) => `/pet/${id}`,
  EDIT_PET: (id: string) => `/pet/${id}/edit`,
  PET_PHOTO_GALLERY: (id: string) => `/pet/${id}/photo-gallery`,
  ADD_VACCINATION: (id: string) => `/pet/${id}/add-vaccination`,
  ADD_MEDICAL_RECORD: (id: string) => `/pet/${id}/add-medical-record`,

  // Quick Actions
  VACCINATION: '/vaccination',
  HEALTH: '/health',
  APPOINTMENTS: '/appointments',

  // Features
  SCHEDULE: '/features/schedule',
  HEALTH_LOG: '/features/health-log',

  // Settings
  PROFILE: '/settings/profile',
  SUBSCRIPTION: '/settings/subscription',
  NOTIFICATIONS: '/settings/notifications',
  PRIVACY: '/settings/privacy',
  SECURITY: '/settings/security',
  LEGAL: '/settings/legal',
  HELP: '/settings/help',
  ABOUT: '/settings/about',

  // Sharing
  SHARING: '/sharing',
  SHARED_PETS: '/sharing/shared-pets',
  SHARED_PET_DETAIL: (id: string) => `/sharing/pet-detail/${id}`,
} as const;

/**
 * Route type definitions for type-safe navigation
 */
export type RouteKey = keyof typeof ROUTES;

export type DynamicRoute =
  | ReturnType<typeof ROUTES.PET_PROFILE>
  | ReturnType<typeof ROUTES.EDIT_PET>
  | ReturnType<typeof ROUTES.PET_PHOTO_GALLERY>
  | ReturnType<typeof ROUTES.ADD_VACCINATION>
  | ReturnType<typeof ROUTES.ADD_MEDICAL_RECORD>
  | ReturnType<typeof ROUTES.SHARED_PET_DETAIL>;

export type StaticRoute = Exclude<(typeof ROUTES)[RouteKey], Function>;

export type AppRoute = StaticRoute | DynamicRoute;

/**
 * Helper to check if a route is dynamic (requires parameters)
 */
export function isDynamicRoute(route: RouteKey): boolean {
  return typeof ROUTES[route] === 'function';
}

/**
 * Get the base path for a dynamic route
 */
export function getRoutePath(route: AppRoute): string {
  return route.toString();
}
