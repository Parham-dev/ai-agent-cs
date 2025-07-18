/**
 * Organization context - hardcoded to parham organization
 */

export const ORGANIZATION_CONTEXT = {
  id: 'cmd97wv8x0001jgulv6p9rxbj',
  name: 'Test Organization',
  slug: 'test-org',
} as const;

export function getOrganizationId(): string {
  return ORGANIZATION_CONTEXT.id;
}

export function getOrganizationName(): string {
  return ORGANIZATION_CONTEXT.name;
}

export function getOrganizationSlug(): string {
  return ORGANIZATION_CONTEXT.slug;
}