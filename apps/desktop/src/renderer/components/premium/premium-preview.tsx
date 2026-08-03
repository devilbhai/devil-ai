import { Suspense, lazy } from "react"
import { useAtomValue } from "jotai"
import { premiumSectionsEnabledAtom } from "../../atoms/feature-flags"

const Hero = lazy(() => import("./hero").then((m) => ({ default: m.PremiumHero })))
const CTA = lazy(() => import("./cta").then((m) => ({ default: m.PremiumCTA })))

export function PremiumPreview() {
  const enabled = useAtomValue(premiumSectionsEnabledAtom)

  if (!enabled) {
    return <div className="text-sm text-muted-foreground">Premium sections are disabled. Enable from settings.</div>
  }

  return (
    <Suspense fallback={<div>Loading premium preview…</div>}>
      <div className="space-y-4">
        <Hero />
        <CTA />
      </div>
    </Suspense>
  )
}

export default PremiumPreview
