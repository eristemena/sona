import {
  DEFAULT_NAVIGATION_DESTINATIONS,
  type NavigationDestination,
  type NavigationDestinationId,
} from '@sona/domain/contracts/shell-bootstrap'

export function getNavigationDestinations(): NavigationDestination[] {
  return DEFAULT_NAVIGATION_DESTINATIONS
}

export function getNextNavigationDestination(
  current: NavigationDestinationId,
  direction: 'next' | 'previous',
): NavigationDestinationId {
  const destinations = getNavigationDestinations()
  const currentIndex = destinations.findIndex((destination) => destination.id === current)
  const offset = direction === 'next' ? 1 : -1
  const nextIndex = (currentIndex + offset + destinations.length) % destinations.length

  return destinations[nextIndex]!.id
}