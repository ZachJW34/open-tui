import React from 'react';
import { Box, Text, useKeymap, useNode } from 'tuir';
import { SafeText } from './SafeText';

export function NewChat(props: { onSubmit: () => void }) {
  const { isFocus } = useNode();

  const { useEvent } = useKeymap({
    submit: { key: 'return' },
  });

  useEvent('submit', () => {
    props.onSubmit();
  });

  return (
    <Box
      borderStyle="round"
      width={5}
      justifyContent="center"
      alignItems="stretch"
      borderColor={isFocus ? 'green' : undefined}
    >
      <SafeText>+</SafeText>
    </Box>
  );
}
