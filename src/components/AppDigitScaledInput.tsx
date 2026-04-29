import { TextInput, type TextInputProps } from '@carbon/react';
import { useEffect, useState } from 'react';
import {
  formatNumberWithFixedDecimals,
  formatNumberWithFixedDecimalsPtBr,
  parseDigitScaledNumberInput
} from '../lib/number';

interface Props extends Omit<TextInputProps, 'value' | 'onChange'> {
  value: number;
  scale: number;
  onValueChange: (value: number) => void;
}

export function AppDigitScaledInput({ value, scale, onValueChange, onBlur, onFocus, ...props }: Props) {
  const [inputValue, setInputValue] = useState(formatNumberWithFixedDecimalsPtBr(value, scale));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      return;
    }

    setInputValue(formatNumberWithFixedDecimalsPtBr(value, scale));
  }, [isFocused, scale, value]);

  return (
    <TextInput
      {...props}
      type="text"
      inputMode="numeric"
      value={inputValue}
      onFocus={(event) => {
        setIsFocused(true);
        window.setTimeout(() => event.target.select(), 0);
        onFocus?.(event);
      }}
      onChange={(event) => {
        const parsedValue = parseDigitScaledNumberInput(event.target.value, scale);

        if (parsedValue === null) {
          setInputValue('');
          return;
        }

        const formattedValue = formatNumberWithFixedDecimalsPtBr(parsedValue, scale);
        setInputValue(formattedValue);
        onValueChange(parsedValue);
      }}
      onBlur={(event) => {
        setIsFocused(false);

        const parsedValue = parseDigitScaledNumberInput(inputValue, scale);

        if (parsedValue === null) {
          setInputValue(formatNumberWithFixedDecimalsPtBr(value, scale));
          onBlur?.(event);
          return;
        }

        const formattedValue = formatNumberWithFixedDecimalsPtBr(parsedValue, scale);
        setInputValue(formattedValue);
        onValueChange(parsedValue);
        onBlur?.(event);
      }}
    />
  );
}
