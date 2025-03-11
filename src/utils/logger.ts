import pino from 'pino';
import { OPENTUI_LOG_FILE } from './local.js';

export const logger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: OPENTUI_LOG_FILE, append: !!process.env.OPENTUI_APPEND_LOG },
  },
  enabled: !!process.env.OPENTUI_LOG,
});
