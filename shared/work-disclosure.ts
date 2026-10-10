import type { ManagedCaseStudy } from './content'

const abstractSlugs = new Set([
  'care-coordination',
  'accounting-workflows',
  'research-workflow',
])

/** Apply the approved abstract-project policy without changing saved records. */
export function publicWorkRecord(study: ManagedCaseStudy): ManagedCaseStudy {
  if (!abstractSlugs.has(study.slug)) return study
  const publicStudy = { ...study }
  delete publicStudy.repositoryUrl
  delete publicStudy.demoUrl
  return publicStudy
}
