'use client'

import { Check } from 'lucide-react'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps?: number
}

const steps = [
  { number: 1, label: 'Resume' },
  { number: 2, label: 'Profile' },
  { number: 3, label: 'More Profiles' },
  { number: 4, label: 'Complete' },
]

export function ProgressIndicator({ currentStep, totalSteps = 4 }: ProgressIndicatorProps) {
  return (
    <div className="w-full mb-8">
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isUpcoming = step.number > currentStep

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex items-center justify-center space-x-2">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep

          return (
            <div
              key={step.number}
              className={`h-2 rounded-full transition-all ${
                isCompleted
                  ? 'bg-green-500 w-8'
                  : isCurrent
                  ? 'bg-primary w-8'
                  : 'bg-gray-200 w-2'
              }`}
            />
          )
        })}
      </div>

      {/* Progress percentage */}
      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps} ({Math.round((currentStep / totalSteps) * 100)}%)
        </span>
      </div>
    </div>
  )
}

