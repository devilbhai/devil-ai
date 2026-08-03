import { motion } from "motion/react"

export function PremiumHero() {
  return (
    <section className="rounded-lg border p-8 bg-gradient-to-r from-accent/5 to-transparent">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-semibold">Premium Hero Section</h1>
        <p className="text-muted-foreground mt-2">This is a lazily loaded hero with subtle animations.</p>
        <div className="mt-4 flex gap-3">
          <button className="rounded-md bg-accent px-4 py-2 text-white">Get started</button>
          <button className="rounded-md border px-4 py-2">Learn more</button>
        </div>
      </motion.div>
    </section>
  )
}

export default PremiumHero
