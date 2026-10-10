import resume from './resume.md?raw'
import portfolio from './portfolio.md?raw'

// Public, approved snapshots; update these when the source references change.
export const professionalBackground = { resume, portfolio }
export const portfolioLinks = [
  ...portfolio.matchAll(/\]\((https:\/\/github\.com\/prudolfs\/[^)]+)\)/g),
].map((match) => match[1])
