export function getSignInTargetPath(locationState: unknown): string {
  if (typeof locationState !== 'object' || locationState === null) {
    return '/';
  }

  const state = locationState as { from?: unknown };
  return typeof state.from === 'string' ? state.from : '/';
}
