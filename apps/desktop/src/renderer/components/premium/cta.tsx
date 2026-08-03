import { motion } from "motion/react"

export function PremiumCTA() {
  return (
    <section className="rounded-lg border p-6">
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Ready to level up?</h3>
            <p className="text-muted-foreground mt-1">Enable premium sections to use beautiful pre-built UI.</p>
          </div>
          <div>
            <button className="rounded-md bg-accent px-4 py-2 text-white">Enable</button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default PremiumCTA
