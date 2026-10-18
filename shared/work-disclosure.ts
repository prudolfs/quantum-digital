import type { ManagedCaseStudy } from './content'

const privateLinkSlugs = new Set([
  'care-coordination',
  'accounting-workflows',
  'research-workflow',
])

/** Apply the approved private-project link policy without changing saved records. */
export function publicWorkRecord(study: ManagedCaseStudy): ManagedCaseStudy {
  if (!privateLinkSlugs.has(study.slug)) return study
  const publicStudy = { ...study }
  delete publicStudy.repositoryUrl
  delete publicStudy.demoUrl
  return publicStudy
}
