import { useMemo } from 'react';
import { useInput } from 'tuir';
import chalk from 'chalk';

const cursor = chalk.inverse(' ');

export const useTextInput = ({ isDisabled = false, state, placeholder = '' }) => {
  const renderedPlaceholder = useMemo(() => {
    if (isDisabled) {
      return placeholder ? chalk.dim(placeholder) : '';
    }
    return placeholder && placeholder.length > 0
      ? chalk.inverse(placeholder[0]) + chalk.dim(placeholder.slice(1))
      : cursor;
  }, [isDisabled, placeholder]);
  const renderedValue = useMemo(() => {
    if (isDisabled) {
      return state.value;
    }
    let index = 0;
    let result = state.value.length > 0 ? '' : cursor;
    for (const char of state.value) {
      result += index === state.cursorOffset ? chalk.inverse(char) : char;
      index++;
    }
    if (state.suggestion) {
      if (state.cursorOffset === state.value.length) {
        result += chalk.inverse(state.suggestion[0]) + chalk.dim(state.suggestion.slice(1));
      } else {
        result += chalk.dim(state.suggestion);
      }
      return result;
    }
    if (state.value.length > 0 && state.cursorOffset === state.value.length) {
      result += cursor;
    }
    return result;
  }, [isDisabled, state.value, state.cursorOffset, state.suggestion]);
  useInput(
    (input, key) => {
      input = input.replaceAll(/\u001b\[[AB]/g, '');
      if (
        key.up ||
        key.down ||
        (key.ctrl && input === 'c') ||
        key.tab
        // || (key.shift && key.tab)
      ) {
        return;
      }
      // Readline-style editing. Alt is reported as meta by tuir when it parses
      // the key, but xterm's CSI encodings reach this handler as raw text: match
      // those first, or the stripped ESC leaves "[3;3~" typed into the prompt.
      if (input.includes('\u001b\u007f') || input.includes('\u001b[127;3u')) {
        state.deleteWordBackward();
        return;
      }
      if (input.includes('\u001b[3;3~') || input.includes('\u001bd')) {
        state.deleteWordForward();
        return;
      }
      if (input.includes('\u001b[1;3D')) {
        state.moveCursorWordLeft();
        return;
      }
      if (input.includes('\u001b[1;3C')) {
        state.moveCursorWordRight();
        return;
      }
      if (key.meta && (key.backspace || key.delete)) {
        state.deleteWordBackward();
        return;
      }
      if (key.meta && key.left) {
        state.moveCursorWordLeft();
        return;
      }
      if (key.meta && key.right) {
        state.moveCursorWordRight();
        return;
      }
      if (key.shift && key.return) {
        // Shift+Enter is a newline, not a submit.
        state.insert('\n');
        return;
      }
      if (key.ctrl && !key.meta) {
        switch (input) {
          case 'a':
            state.moveCursorStart();
            return;
          case 'e':
            state.moveCursorEnd();
            return;
          case 'b':
            state.moveCursorLeft();
            return;
          case 'f':
            state.moveCursorRight();
            return;
          case 'd':
            state.deleteForward();
            return;
          case 'j':
            // Ctrl+J is LF (0x0a), which tuir's keyboard reports as ctrl+j.
            state.insert('\n');
            return;
          case 'k':
            state.deleteToLineEnd();
            return;
          case 'u':
            state.deleteToLineStart();
            return;
          case 'w':
            state.deleteWordBackward();
            return;
        }
      }
      if (key.return) {
        state.submit();
        return;
      }
      if (key.left) {
        state.moveCursorLeft();
      } else if (key.right) {
        state.moveCursorRight();
      } else if (key.backspace || key.delete || (key.ctrl && input === 'h')) {
        // A Backspace that arrives as ^H (0x08) is reported by tuir's keyboard as
        // ctrl+h; treat it as a delete instead of letting it fall through as text.
        state.delete();
      } else {
        if (input) {
          // Terminals that report Shift+Enter as an escape sequence rather than a
          // modified return key: normalize them to a newline before any control
          // bytes are stripped, otherwise the sequence leaks into the prompt as
          // literal text. (xterm modifyOtherKeys, `\u001b[27;2;13~`, is handled by
          // the insert reducer; CSI-u `\u001b[13;2u` is what tmux >= 3.4 and kitty
          // send.)
          const text = input
            .replaceAll(/\u001b\[13;2u/g, '\n')
            .replaceAll(/\u001b\r|\u001b\n/g, '\n')
            .replaceAll('\r', '\n');
          // Never let a control byte reach the value: unhandled sequences would be
          // rendered into the prompt and sent as part of the message. Newlines are
          // the exception - they are how a multi-line prompt is written.
          const clean = text.replaceAll(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '');
          if (clean) {
            state.insert(clean);
          }
        }
      }
    },
    { isActive: !isDisabled }
  );
  return {
    inputValue: state.value.length > 0 ? renderedValue : renderedPlaceholder,
  };
};
//# sourceMappingURL=use-text-input.js.map
