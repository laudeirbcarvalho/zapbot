'use client';

import { useState } from 'react';

interface HelpStep {
  title: string;
  description: string;
  image?: string;
  tips?: string[];
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  steps: HelpStep[];
}

export default function HelpModal({ isOpen, onClose, moduleName, steps }: HelpModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">💡 Como usar: {moduleName}</h2>
              <p className="text-blue-100 mt-1">
                Passo {currentStep + 1} de {steps.length}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div 
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Tips */}
          {steps[currentStep].tips && steps[currentStep].tips!.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Dicas:</h4>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                {steps[currentStep].tips!.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Indicators */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                  title={`Ir para passo ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            ← Anterior
          </button>

          <div className="text-sm text-gray-500">
            {currentStep + 1} / {steps.length}
          </div>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              ✓ Concluir
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}