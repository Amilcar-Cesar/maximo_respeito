import React from 'react';

interface StepperProps {
  currentStep: 'cart' | 'checkout' | 'confirmation';
}

export function FlowStepper({ currentStep }: StepperProps) {
  const steps = [
    { key: 'cart', label: 'Sacola', number: 1 },
    { key: 'checkout', label: 'Identificação & Entrega', number: 2 },
    { key: 'confirmation', label: 'Confirmação', number: 3 },
  ];

  return (
    <div className="flow-stepper-container">
      <div className="flow-stepper">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            (currentStep === 'checkout' && step.key === 'cart') ||
            (currentStep === 'confirmation' && (step.key === 'cart' || step.key === 'checkout'));

          return (
            <React.Fragment key={step.key}>
              <div className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-badge">
                  {isCompleted ? '✓' : step.number}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`step-connector ${isCompleted && currentStep !== 'checkout' ? 'completed' : isCompleted && currentStep === 'checkout' && idx === 0 ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
