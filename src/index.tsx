#!/usr/bin/env node
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, Instance, preserveScreen, render, setConsole } from 'tuir';
import { useAppStore } from './stores/index.js';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { initLocal } from './utils/local.js';
import { App } from './App.js';
import { logger } from './utils/logger.js';

// tuir paints a frame as one write: an erase run for every row of the canvas
// followed by the whole screen (node_modules/tuir/build/log-update.js). Blanking
// and repainting 40 rows in one go is the flicker. Rewrite each frame as a
// per-line update instead: erase and redraw only the rows whose text changed, and
// never blank the screen as a whole. The cursor run and the line separators are
// kept byte for byte, so the canvas still lands where tuir expects it. The DEC 2026
// bracket stays for terminals that composite it into a single update.
const rawStdoutWrite = process.stdout.write.bind(process.stdout);
const eraseRun = /^(?:(?:\u001b\[2K)|(?:\u001b\[1A)|(?:\u001b\[G))*/;
let paintedLines: string[] = [];
// After a resize the terminal's rows are not what we last painted, so forget the
// cache and let the next frame redraw everything.
process.stdout.on('resize', () => {
  paintedLines = [];
});
process.stdout.write = ((chunk: any, ...rest: any[]): boolean => {
  if (typeof chunk !== 'string' || !chunk.includes('\u001b[2K')) {
    return rawStdoutWrite(chunk, ...rest);
  }
  const run = eraseRun.exec(chunk);
  const prefix = run ? run[0] : '';
  const parts = chunk.slice(prefix.length).split(/(\r?\n)/);
  let out = prefix.replace(/\u001b\[2K/g, '');
  const next: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i];
    next.push(line);
    if (line !== paintedLines[i / 2]) out += '\u001b[2K' + line;
    if (i + 1 < parts.length) out += parts[i + 1];
  }
  paintedLines = next;
  return rawStdoutWrite(`\u001b[?2026h${out}\u001b[?2026l`, ...rest);
}) as typeof process.stdout.write;

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
        <Box width={width} height={height}>
          <App />
        </Box>
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
    // Ink falls back to clearing the whole screen (including scrollback) on every
    // frame once its output is as tall as the terminal, which is what makes a
    // full-screen app flicker; one row of headroom keeps repaints in place.
    const height = Math.max((process.stdout.rows ?? 24) - 1, 1);
    appStore.setState({ dimensions: { width, height } });

    const node = renderFn(width, height);

    if (app) {
      app.rerender(node);
    } else {
      // Every frame erases and rewrites every line of the screen (ink has no
      // dirty-region rendering), so the frame rate is the flicker knob: 100ms
      // caps sustained repaints at 10/s, while the leading edge keeps a lone
      // keystroke instant.
      app = render(node, { throttle: 100 });
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
