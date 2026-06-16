'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign } from 'lucide-react'

const JOBS = [
  { id: 'stripe', title: 'Senior Software Engineer', company: 'Stripe', salary: '$160k–$220k', tag: 'Remote' },
  { id: 'figma', title: 'Product Designer', company: 'Figma', salary: '$130k–$175k', tag: 'Hybrid' },
  { id: 'shopify', title: 'Data Analyst', company: 'Shopify', salary: '$95k–$130k', tag: 'Remote' },
  { id: 'doordash', title: 'Marketing Manager', company: 'DoorDash', salary: '$110k–$145k', tag: 'Hybrid' },
]

/**
 * Interactive dashboard grid. A single shared `layoutId` highlight glides
 * between cards as the user hovers/focuses, and the active card lifts —
 * a smooth, stateful "expand/highlight" interaction.
 */
export function JobShowcase() {
  const [active, setActive] = useState<string>('stripe')

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {JOBS.map((j) => {
        const isActive = active === j.id
        return (
          <motion.button
            key={j.id}
            type="button"
            onHoverStart={() => setActive(j.id)}
            onFocus={() => setActive(j.id)}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="relative text-left rounded-xl bg-white border border-border p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            {isActive && (
              <motion.span
                layoutId="job-highlight"
                className="absolute inset-0 rounded-xl ring-2 ring-primary-500 bg-primary-50/70 shadow-card-hover"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <div className="relative z-[1]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold text-sm transition-colors ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>
                    {j.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{j.company}</p>
                </div>
                <span className="text-[10px] font-semibold text-primary-700 bg-primary-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                  {j.tag}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-600">
                <DollarSign className="h-3.5 w-3.5" />
                {j.salary}
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
