import { useEffect, useState } from "react"
import { useSubscriptionDetails } from "../hooks/use-subscription"
import { Clock } from "lucide-react"

export function TrialTimer() {
  const { planId, expiresAt } = useSubscriptionDetails()
  const [timeLeft, setTimeLeft] = useState<string | null>(null)

  useEffect(() => {
    if (planId !== "TRIAL" || !expiresAt) {
      setTimeLeft(null)
      return
    }

    const expiryDate = new Date(expiresAt).getTime()

    const calculateTimeLeft = () => {
      const now = Date.now()
      const difference = expiryDate - now

      if (difference <= 0) {
        setTimeLeft("Expired")
        // Force a storage event to let other components know it's expired
        window.dispatchEvent(new Event('storage'))
        return
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      )
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [planId, expiresAt])

  if (!timeLeft || planId !== "TRIAL") return null

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 mr-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium" style={{ WebkitAppRegion: "no-drag" } as any}>
      <Clock className="w-3.5 h-3.5" />
      <span>Trial ends in {timeLeft}</span>
    </div>
  )
}
