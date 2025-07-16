/**
 * Organization context - hardcoded to parham organization
 */

export const ORGANIZATION_CONTEXT = {
  id: 'parham',
  name: 'parham',
  slug: 'parham',
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