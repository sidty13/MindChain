'use client';

import { useState, useEffect } from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: '/icons/IsYourDayOkfinal.png',
      title: 'Welcome to IsYourDayOk',
      description: 'Your daily mental wellness companion. Check in with your mood, journal, and meditate to build healthy habits.',
      isImage: true,
    },
    {
      icon: '/emojis/happy.png',
      title: 'Track & Earn Rewards',
      description: 'Log your mood (10 pts), write in your journal (20 pts), or meditate (30 pts). Build streaks and track your progress.',
      isImage: true,
    },
    {
      icon: '/icons/trophy.png',
      title: 'Unlock NFT Achievements',
      description: 'Hit 7 or 30-day streaks to earn achievement NFTs on Base blockchain. Your wellness milestones, owned forever.',
      isImage: true,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={step.icon} 
              alt={step.title} 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{step.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : index < currentStep
                    ? 'w-2 bg-blue-400'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep === 0 && (
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
