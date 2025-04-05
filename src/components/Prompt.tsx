import React, { useCallback, useState } from 'react';
import { Box, useNode } from 'tuir';
import { TextInput } from './text-input/index';
import { Dimensions, ScrollArea } from './ScrollArea';
import { useAppStore } from '../stores';

export function Prompt({ submitCb }: { submitCb: (value: string) => void }) {
  const { isFocus, control } = useNode();
  const [value, setValue] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const promptHeight = useAppStore((s) => s.promptHeight);
  const setPromptHeight = useAppStore((s) => s.setPromptHeight);

  function submit() {
    submitCb(value);
    setValue('');
    setInputKey((old) => old + 1);
    control.goToNode('C');
  }

  const dimensionsChange = useCallback((dimensions: Dimensions) => {
    if (dimensions.height <= 10) {
      setPromptHeight(dimensions.height);
    } else {
      setPromptHeight(10);
    }
  }, []);

  return (
    <Box
      borderStyle="round"
      borderColor={isFocus ? 'green' : undefined}
      titleTopLeft={{ title: 'Prompt', dimColor: true }}
      height={promptHeight + 2}
    >
      <ScrollArea height={10} onDimensionsChange={dimensionsChange}>
        <TextInput
          key={inputKey}
          isDisabled={!isFocus}
          placeholder="..."
          onChange={setValue}
          onSubmit={submit}
        />
        <Box key={value}></Box>
      </ScrollArea>
    </Box>
  );
}
