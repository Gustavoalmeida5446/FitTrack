import { NumberInput, type NumberInputProps } from '@carbon/react';
import { useEffect, useState } from 'react';
import { parseNumberInputValue } from '../lib/number';

interface Props extends Omit<NumberInputProps, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

export function AppNumberInput({ value, onValueChange, onBlur, onFocus, ...props }: Props) {
  const [inputValue, setInputValue] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      return;
    }

    setInputValue(String(value));
  }, [isFocused, value]);

  return (
    <NumberInput
      {...props}
      allowEmpty
      value={inputValue}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onChange={(event, state) => {
        const nextInputValue = String(state.value);
        setInputValue(nextInputValue);

        const parsedValue = parseNumberInputValue(state.value);

        if (parsedValue === null) {
          return;
        }

        onValueChange(parsedValue);
      }}
      onBlur={(event) => {
        setIsFocused(false);

        const parsedValue = parseNumberInputValue(inputValue);

        if (parsedValue === null) {
          setInputValue(String(value));
          onBlur?.(event, value);
          return;
        }

        setInputValue(String(parsedValue));
        onValueChange(parsedValue);
        onBlur?.(event, parsedValue);
      }}
    />
  );
}
