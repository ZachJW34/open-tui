#!/usr/bin/env node
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, Instance, Viewport, preserveScreen, render, setConsole } from 'tuir';
import { useAppStore } from './stores/index.js';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { initLocal } from './utils/local.js';
import { App } from './App.js';
import { logger } from './utils/logger.js';

marked.setOptions({
  async: false,
  renderer: new TerminalRenderer() as any,
});

async function main() {
  if (!process.env.OPENTUI_WEBUI_HOST || !process.env.OPENTUI_WEBUI_TOKEN) {
    console.error(
      'Cannot connect without OPENTUI_WEBUI_HOST and OPENTUI_WEBUI_TOKEN environment variables.'
    );
    process.exit(1);
  }

  try {
    await initLocal();
  } catch (e) {
    console.error(`Failed to create local files: ${e}`);
    process.exit(1);
  }

  renderWithResize(
    (width, height) => (
      <QueryClientProvider client={new QueryClient()}>
        <Viewport>
          <Box width={width} height={height}>
            <App />
          </Box>
        </Viewport>
      </QueryClientProvider>
    ),
    useAppStore
  );
}

main();

function renderWithResize(
  renderFn: (width: number, height: number) => React.ReactNode,
  appStore: typeof useAppStore
) {
  preserveScreen();
  let app: Instance;

  const r = () => {
    const width = process.stdout.columns;
    const height = process.stdout.rows;
    appStore.setState({ dimensions: { width, height } });

    const node = renderFn(width, height);

    if (app) {
      app.rerender(node);
    } else {
      app = render(node, { throttle: 20 });
    }
  };

  process.stdout.on('resize', r);
  return r();
}

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  let message = 'Unhandled Rejection: ';

  if (reason instanceof Error) {
    message += reason.message + '\nStack trace:\n' + reason.stack;
  } else {
    message += String(reason);
  }

  logger.error(message);
  process.exit(1);
});
