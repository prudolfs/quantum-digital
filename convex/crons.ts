import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()
crons.interval(
  'Remove expired intake drafts',
  { hours: 1 },
  internal.inquiries.prune,
)
export default crons
