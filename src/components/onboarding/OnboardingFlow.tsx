import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

const steps = [
  {
    title: 'Welcome to GPA Tracker',
    subtitle: 'Your academic journey, beautifully organized',
    description: 'Track your NTU modules, monitor your GPA, set goals, and plan your path to graduation.',
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: 'Track Every Module',
    subtitle: 'All your courses in one place',
    description: 'Add modules with grades, AUs, and prerequisites. See your GPA update instantly across semesters.',
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    title: 'Set Goals & Predict',
    subtitle: 'Know what you need to achieve',
    description: 'Set target GPAs, run what-if simulations, and see exactly what grades you need for your goals.',
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    title: "You're All Set!",
    subtitle: 'Start adding your modules',
    description: "Press N or click the + button anytime to add a module. Use Cmd+K to quickly search and navigate.",
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    ),
  },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-lg mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="p-6 rounded-3xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                {step.icon}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h1>
            <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-4">
              {step.subtitle}
            </p>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    i === currentStep
                      ? 'w-8 bg-primary-600 dark:bg-primary-400'
                      : i < currentStep
                      ? 'w-2 bg-primary-300 dark:bg-primary-700'
                      : 'w-2 bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3">
              {!isLast && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              <Button variant="primary" size="lg" onClick={handleNext}>
                {isLast ? "Let's Go!" : 'Continue'}
              </Button>
            </div>

            {/* Keyboard hint */}
            {isLast && (
              <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">
                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-mono">Enter</kbd> to start
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
