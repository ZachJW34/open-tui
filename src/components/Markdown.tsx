import React from 'react';
import { marked } from 'marked';
import { Text } from 'tuir';

export const Markdown = React.memo(({ content }: { content: string }) => {
  const parsed = marked(content) as string;

  return <Text>{parsed}</Text>;
});
