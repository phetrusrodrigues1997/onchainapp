'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import Cookies from 'js-cookie';
import { Language, getTranslation } from '../Languages/languages';

interface TutorialBridgeProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  selectedMarket?: string;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const TutorialBridge = ({ activeSection, setActiveSection, selectedMarket }: TutorialBridgeProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has seen tutorial
  const hasSeenTutorial = Cookies.get('hasSeenTutorial') === 'true';

  useEffect(() => {
    const savedLang = Cookies.get('language') as Language | undefined;
    if (savedLang) {
      setCurrentLanguage(savedLang);
    }
    setIsVisible(true);

    // Auto-skip if user has seen tutorial
    if (hasSeenTutorial) {
      handleSkip();
    }
  }, []);

  const t = getTranslation(currentLanguage);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      title: t.tutorialStep1Title,
      description: t.tutorialStep1Description,
      icon: '🎯',
      color: 'from-purple-500 to-blue-500'
    },
    {
      id: 2,
      title: t.tutorialStep2Title,
      description: t.tutorialStep2Description,
      icon: '💰',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: t.tutorialStep3Title,
      description: t.tutorialStep3Description,
      icon: '📈',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 4,
      title: t.tutorialStep4Title,
      description: t.tutorialStep4Description,
      icon: '🏆',
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 5,
      title: t.tutorialStep5Title,
      description: t.tutorialStep5Description,
      icon: '🚀',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    Cookies.set('hasSeenTutorial', 'true', { expires: 30 }); // Remember for 30 days
    setActiveSection('bitcoinPot');
  };

  const handleComplete = () => {
    Cookies.set('hasSeenTutorial', 'true', { expires: 30 });
    setActiveSection('bitcoinPot');
  };

  const currentTutorialStep = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors z-10"
      >
        <span className="text-sm font-medium">{t.skipTutorial}</span>
        <X className="w-4 h-4" />
      </button>

      {/* Main Tutorial Card */}
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tutorial Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r ${currentTutorialStep.color} flex items-center justify-center text-white text-4xl shadow-lg`}>
            {currentTutorialStep.icon}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentTutorialStep.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg mx-auto">
            {currentTutorialStep.description}
          </p>

          {/* Step 2 - Token Actions */}
          {currentStep === 1 && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setActiveSection('buy')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  🛒 {currentLanguage === 'en' ? 'Buy Tokens' : 'Comprar Tokens'}
                </button>
                <button
                  onClick={() => setActiveSection('wallet')}
                  className="bg-white text-gray-900 border-2 border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  📥 {currentLanguage === 'en' ? 'Receive Tokens' : 'Receber Tokens'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                {currentLanguage === 'en' 
                  ? 'You can come back to this tutorial after getting tokens'
                  : 'Você pode voltar a este tutorial após obter tokens'}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.previous}</span>
            </button>

            {/* Step Indicators */}
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index <= currentStep
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Next/Start Button */}
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-transparent text-[#00aa00] px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all hover:shadow-xl transform hover:scale-105"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>{t.startPlaying}</span>
                </>
              ) : (
                <>
                  <span>{t.next}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fun fact or tip */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 <strong>Tip:</strong> {t.tutorialTip}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialBridge;