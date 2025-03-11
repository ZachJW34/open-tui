import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

export const OPENTUI_CONFIG_DIR = path.resolve(os.homedir(), '.opentui');
export const OPENTUI_LOG_FILE = path.join(OPENTUI_CONFIG_DIR, 'log.txt');

export const initLocal = async () => {
  await ensure(OPENTUI_CONFIG_DIR);
  await ensure(OPENTUI_LOG_FILE, false);
};

const ensure = async (file: string, isDir = true) => {
  await fs.access(file, fs.constants.R_OK | fs.constants.W_OK).catch(async (err) => {
    if (err.code === 'ENOENT') {
      if (isDir) {
        await fs.mkdir(file, { recursive: true });
      } else {
        await fs.writeFile(file, '');
      }
    }
  });
};
