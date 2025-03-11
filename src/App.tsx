import React from 'react';
import { Box, Text } from 'tuir';
import { Main } from './components/Main';
import { openWebStore } from './stores';
import { useQuery } from '@tanstack/react-query';

export function App() {
  const initQuery = useQuery({
    queryKey: ['init'],
    queryFn: () => {
      return openWebStore.init();
    },
  });

  if (initQuery.isLoading || initQuery.isError) {
    return (
      <Box width="100%" borderStyle="round">
        <Text>{initQuery.isLoading ? 'Loading' : String(initQuery.error)}</Text>
      </Box>
    );
  }

  return <Main />;
}
