import { useReducer, useCallback, useEffect, useMemo } from 'react';

const lineStart = (value, offset) => value.lastIndexOf('\n', offset - 1) + 1;
const lineEnd = (value, offset) => {
  const index = value.indexOf('\n', offset);
  return index === -1 ? value.length : index;
};
const wordLeft = (value, offset) => {
  let index = offset;
  while (index > 0 && /\s/.test(value[index - 1])) index--;
  while (index > 0 && !/\s/.test(value[index - 1])) index--;
  return index;
};
const wordRight = (value, offset) => {
  let index = offset;
  while (index < value.length && /\s/.test(value[index])) index++;
  while (index < value.length && !/\s/.test(value[index])) index++;
  return index;
};
const cut = (state, start, end) => ({
  ...state,
  previousValue: state.value,
  value: state.value.slice(0, start) + state.value.slice(end),
  cursorOffset: start,
});

const reducer = (state, action) => {
  switch (action.type) {
    case 'move-cursor-left': {
      return {
        ...state,
        cursorOffset: Math.max(0, state.cursorOffset - 1),
      };
    }
    case 'move-cursor-right': {
      return {
        ...state,
        cursorOffset: Math.min(state.value.length, state.cursorOffset + 1),
      };
    }
    case 'move-cursor-start': {
      return { ...state, cursorOffset: lineStart(state.value, state.cursorOffset) };
    }
    case 'move-cursor-end': {
      return { ...state, cursorOffset: lineEnd(state.value, state.cursorOffset) };
    }
    case 'move-cursor-word-left': {
      return { ...state, cursorOffset: wordLeft(state.value, state.cursorOffset) };
    }
    case 'move-cursor-word-right': {
      return { ...state, cursorOffset: wordRight(state.value, state.cursorOffset) };
    }
    case 'delete-word-backward': {
      return cut(state, wordLeft(state.value, state.cursorOffset), state.cursorOffset);
    }
    case 'delete-word-forward': {
      return cut(state, state.cursorOffset, wordRight(state.value, state.cursorOffset));
    }
    case 'delete-to-line-start': {
      return cut(state, lineStart(state.value, state.cursorOffset), state.cursorOffset);
    }
    case 'delete-to-line-end': {
      return cut(state, state.cursorOffset, lineEnd(state.value, state.cursorOffset));
    }
    case 'delete-forward': {
      return state.cursorOffset < state.value.length
        ? cut(state, state.cursorOffset, state.cursorOffset + 1)
        : state;
    }
    case 'insert': {
      let fixed = action.text
        .replaceAll('\r', '\n')
        .replaceAll('[27;2;13~', '\n')
        .replaceAll('\u001b', '');

      return {
        ...state,
        previousValue: state.value,
        value:
          state.value.slice(0, state.cursorOffset) + fixed + state.value.slice(state.cursorOffset),
        cursorOffset: state.cursorOffset + fixed.length,
      };
    }
    case 'delete': {
      const newCursorOffset = Math.max(0, state.cursorOffset - 1);
      return {
        ...state,
        previousValue: state.value,
        value: state.value.slice(0, newCursorOffset) + state.value.slice(newCursorOffset + 1),
        cursorOffset: newCursorOffset,
      };
    }
  }
};

export const useTextInputState = ({ defaultValue = '', suggestions, onChange, onSubmit }) => {
  const [state, dispatch] = useReducer(reducer, {
    previousValue: defaultValue,
    value: defaultValue,
    cursorOffset: defaultValue.length,
  });
  const suggestion = useMemo(() => {
    if (state.value.length === 0) {
      return;
    }
    return suggestions
      ?.find((suggestion) => suggestion.startsWith(state.value))
      ?.replace(state.value, '');
  }, [state.value, suggestions]);
  const moveCursorLeft = useCallback(() => {
    dispatch({
      type: 'move-cursor-left',
    });
  }, []);
  const moveCursorRight = useCallback(() => {
    dispatch({
      type: 'move-cursor-right',
    });
  }, []);
  const moveCursorStart = useCallback(() => {
    dispatch({
      type: 'move-cursor-start',
    });
  }, []);
  const moveCursorEnd = useCallback(() => {
    dispatch({
      type: 'move-cursor-end',
    });
  }, []);
  const moveCursorWordLeft = useCallback(() => {
    dispatch({
      type: 'move-cursor-word-left',
    });
  }, []);
  const moveCursorWordRight = useCallback(() => {
    dispatch({
      type: 'move-cursor-word-right',
    });
  }, []);
  const deleteWordBackward = useCallback(() => {
    dispatch({
      type: 'delete-word-backward',
    });
  }, []);
  const deleteWordForward = useCallback(() => {
    dispatch({
      type: 'delete-word-forward',
    });
  }, []);
  const deleteToLineStart = useCallback(() => {
    dispatch({
      type: 'delete-to-line-start',
    });
  }, []);
  const deleteToLineEnd = useCallback(() => {
    dispatch({
      type: 'delete-to-line-end',
    });
  }, []);
  const deleteForward = useCallback(() => {
    dispatch({
      type: 'delete-forward',
    });
  }, []);
  const insert = useCallback((text) => {
    dispatch({
      type: 'insert',
      text,
    });
  }, []);
  const deleteCharacter = useCallback(() => {
    dispatch({
      type: 'delete',
    });
  }, []);
  const submit = useCallback(() => {
    if (suggestion) {
      insert(suggestion);
      onSubmit?.(state.value + suggestion);
      return;
    }
    onSubmit?.(state.value);
  }, [state.value, suggestion, insert, onSubmit]);
  useEffect(() => {
    if (state.value !== state.previousValue) {
      onChange?.(state.value);
    }
  }, [state.previousValue, state.value, onChange]);
  return {
    ...state,
    suggestion,
    moveCursorLeft,
    moveCursorRight,
    moveCursorStart,
    moveCursorEnd,
    moveCursorWordLeft,
    moveCursorWordRight,
    deleteWordBackward,
    deleteWordForward,
    deleteToLineStart,
    deleteToLineEnd,
    deleteForward,
    insert,
    delete: deleteCharacter,
    submit,
  };
};
