/**
 * Ponytail Review Wrapper - avoids scoping issues with large ChatView component.
 */

import { useAtomValue } from "jotai"
import { ponytailEnabledAtom } from "../../atoms/feature-flags"
import { usePonytailAutoReview } from "../../hooks/use-ponytail-auto-review"
import { PonytailReviewIndicator } from "./ponytail-review-indicator"

interface PonytailReviewWrapperProps {
	sessionId: string
}

export function PonytailReviewWrapper({ sessionId }: PonytailReviewWrapperProps) {
	const ponytailEnabled = useAtomValue(ponytailEnabledAtom)

	if (!ponytailEnabled) return null

	const { reviews, isReviewing, clearReviews } = usePonytailAutoReview(sessionId)

	if (reviews.length === 0 && !isReviewing) return null

	return (
		<PonytailReviewIndicator
			reviews={reviews}
			isReviewing={isReviewing}
			onClear={clearReviews}
		/>
	)
}