import { Box, measureElement } from 'tuir';
import React, { ReactNode, useEffect, useReducer } from 'react';
import { useInput } from 'tuir';

type State = { height: number; scrollTop: number; innerHeight: number };

const reducer = (state: State, action: any): State => {
  switch (action.type) {
    case 'SET_INNER_HEIGHT':
      return {
        ...state,
        innerHeight: action.innerHeight,
        scrollTop: Math.max(action.innerHeight - state.height, 0),
      };

    case 'SET_HEIGHT':
      return {
        ...state,
        height: action.height,
      };

    case 'SCROLL_DOWN':
      return {
        ...state,
        scrollTop: Math.min(Math.max(state.innerHeight - state.height, 0), state.scrollTop + 1),
      };

    case 'SCROLL_UP':
      return {
        ...state,
        scrollTop: Math.max(0, state.scrollTop - 1),
      };

    default:
      return state;
  }
};

export function ScrollArea({
  height,
  children,
  disabled,
}: {
  height: number;
  children: ReactNode;
  disabled?: boolean;
}) {
  const [state, dispatch] = useReducer(reducer, {
    innerHeight: 0,
    height,
    scrollTop: 0,
  });
  const innerRef = React.useRef<any>();

  useEffect(() => {
    if (innerRef.current) {
      const dimensions = measureElement(innerRef.current);

      if (state.innerHeight === dimensions.height) {
        return;
      }

      dispatch({
        type: 'SET_INNER_HEIGHT',
        innerHeight: dimensions.height,
      });
    }
  }, [children]);

  useEffect(() => {
    if (innerRef.current) {
      dispatch({
        type: 'SET_HEIGHT',
        height,
      });
    }
  }, [height]);

  useInput((_input, key) => {
    if (disabled) {
      return;
    }

    if (key.down) {
      dispatch({
        type: 'SCROLL_DOWN',
      });
    }

    if (key.up) {
      dispatch({
        type: 'SCROLL_UP',
      });
    }
  });

  return (
    <Box height={height} flexDirection="column" overflow="hidden">
      <Box ref={innerRef} flexShrink={0} flexDirection="column" marginTop={-state.scrollTop}>
        {children}
      </Box>
    </Box>
  );
}
