import React from 'react';
import { type TextProps, Text } from 'tuir';
import { logger } from '../utils/logger';

const normalizeEmoji = (emoji: string) => emoji.replace(/[\u200B-\u200D\uFE0F]/g, '');

const BLACKLIST = new Set(
  [
    '⭐',
    '✨',
    '❌',
    '✔️',
    '⭕',
    '➕',
    '➖',
    '➗',
    '🏆',
    '🚀',
    '🛠️',
    '⚠️',
    '⏳',
    '⌛',
    '🔥',
    '❤️',
    '🏴',
    '⚓',
    '🔄',
    '🕒',
    '🕘',
  ].map(normalizeEmoji)
);

export const sanitize = (value: string) => {
  let output = '';

  for (const char of normalizeEmoji(value)) {
    if (char === '\n' || char === '\r') {
      output += ' ';
    } else if (BLACKLIST.has(char)) {
      logger.info(`Removing unsafe emoji: ${char}`);
    } else {
      output += char;
    }
  }

  return output.trim();
};

export const SafeText = React.memo(({ children, ...rest }: TextProps) => {
  const parts = Array.isArray(children) ? children : [children];
  let output = '';

  for (const part of parts) {
    output += sanitize(part);
  }
  return <Text {...rest}>{output}</Text>;
});
