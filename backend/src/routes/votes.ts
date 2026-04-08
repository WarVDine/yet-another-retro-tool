import { Router } from 'express'

import { voteOnTarget, removeVoteFromTarget } from '@/controllers/voteController'
import { validateVotingPhase } from '@/middleware/votingPhase'
import { requireGuestUser } from '@/middleware/auth'

const router = Router()

// Vote management routes - all require voting phase validation
router.post('/', requireGuestUser, validateVotingPhase, voteOnTarget)           // POST /api/votes
router.delete('/', requireGuestUser, validateVotingPhase, removeVoteFromTarget) // DELETE /api/votes


export { router as voteRouter }