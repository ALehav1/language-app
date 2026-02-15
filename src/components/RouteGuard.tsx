/**
 * RouteGuard - Wrapper for route-level concerns.
 *
 * Previously redirected deep links to Home on fresh load.
 * Language selection is persisted in localStorage, so deep links
 * (e.g. bookmarked /lookup) now work directly on fresh page load.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
