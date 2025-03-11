import React from 'react';
import { Box, TextInput, useNode, useTextInput } from 'tuir';

export function Prompt({ submitCb }: { submitCb: (value: string) => void }) {
  const { isFocus, control } = useNode();
  const { onChange, setValue, enterInsert } = useTextInput('');

  function onExit(value: string, stdin: string) {
    if (stdin === '\t') return control.next();
    if (value === '' || stdin.charCodeAt(0) === 0x1b) return;

    submitCb(value);
    setValue('');
    control.goToNode('C');
  }

  return (
    <Box
      borderStyle="round"
      borderColor={isFocus ? 'green' : undefined}
      titleTopLeft={{ title: 'Prompt', dimColor: true }}
      height={3}
    >
      {/* <ScrollArea height={1}> */}
      <TextInput
        onChange={onChange}
        onExit={onExit}
        enterKeymap={{ key: 'return' }}
        exitKeymap={[{ key: 'esc' }, { key: 'return' }, { key: 'tab' }]}
        autoEnter
      />
      {/* </ScrollArea> */}
    </Box>
  );
}
