import React from 'react';
import './QuantityStepper.css';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false,
}) => {
  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="quantity-stepper">
      <button
        type="button"
        className="stepper-button stepper-decrement"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        className="stepper-input"
        value={value}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value) || min;
          if (newValue >= min && (max === undefined || newValue <= max)) {
            onChange(newValue);
          }
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <button
        type="button"
        className="stepper-button stepper-increment"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default QuantityStepper;

