/**
 * The navigation surface screens call. Throws when used outside a
 * `NavigationProvider`, so a missing provider fails loudly rather than silently.
 */
import { useContext } from 'react';
import { NavigationContext, type NavigationApi } from './NavigationContext';

export function useNavigation(): NavigationApi {
  const api = useContext(NavigationContext);
  if (!api) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return api;
}
