import React from 'react';
import { Text } from 'tuir';
import { useTextInputState } from './use-text-input-state.js';
import { useTextInput } from './use-text-input.js';

export function TextInput({
  isDisabled = false,
  defaultValue,
  placeholder = '',
  suggestions,
  onChange,
  onSubmit,
}: {
  isDisabled: boolean;
  defaultValue?: string;
  placeholder?: string;
  suggestions?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}) {
  const state = useTextInputState({
    defaultValue,
    suggestions,
    onChange,
    onSubmit,
  });
  const { inputValue } = useTextInput({
    isDisabled,
    placeholder,
    state,
  });
  // const { styles } = useComponentTheme('TextInput');
  return React.createElement(Text, {}, inputValue);
}
