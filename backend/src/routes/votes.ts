import { Router } from 'express'

import { voteOnTarget, removeVoteFromTarget, getUserVotes } from '@/controllers/voteController'
import { validateVotingPhase } from '@/middleware/votingPhase'
import { requireGuestUser } from '@/middleware/auth'

const router = Router()

// Vote management routes - all require voting phase validation
router.post('/', requireGuestUser, validateVotingPhase, voteOnTarget)           // POST /api/votes
router.delete('/', requireGuestUser, validateVotingPhase, removeVoteFromTarget) // DELETE /api/votes

// Vote query routes
router.get('/user/:userId/room/:roomId', getUserVotes)  // GET /api/votes/user/:userId/room/:roomId

export { router as voteRouter }