import { Router } from 'express'

import { voteOnTarget, removeVoteFromTarget } from '@/controllers/voteController'
import { validateVotingPhase } from '@/middleware/votingPhase'
import { requireGuestUser, requireRoomParticipant } from '@/middleware/auth'

const router = Router()

// Vote management routes - all require voting phase validation and room participation
router.post('/', requireGuestUser, validateVotingPhase, requireRoomParticipant, voteOnTarget)           // POST /api/votes
router.delete('/', requireGuestUser, validateVotingPhase, requireRoomParticipant, removeVoteFromTarget) // DELETE /api/votes


export { router as voteRouter }