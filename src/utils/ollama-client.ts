import { ChatCompleted, ChatFull, ChatSlim, User, WebModel } from '../types';
import { ChatHistory, Message } from '../types';
import { io } from 'socket.io-client';
import { logger } from './logger';

const { OPENTUI_WEBUI_HOST, OPENTUI_WEBUI_TOKEN } = process.env;

export const getSessionUser = async (): Promise<User> => {
  return fetchJson('getSessionUser', `${OPENTUI_WEBUI_HOST}/api/v1/auths/`, {
    headers: {
      'Content-Type': 'application/json',
      ...genAuthHeaders(),
    },
    credentials: 'include',
  });
};

export const getBackendConfig = async (): Promise<any> => {
  return fetchJson('getBackendConfig', `${OPENTUI_WEBUI_HOST}/api/config`, {
    headers: genAuthHeaders(),
  });
};

export const setupSocket = async () => {
  const socket = io(`${OPENTUI_WEBUI_HOST}` || undefined, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    path: '/ws/socket.io',
    transports: ['websocket'],
    auth: { token: OPENTUI_WEBUI_TOKEN },
  });

  return socket;
};

export function getModels(): Promise<WebModel[]> {
  return fetchJson<{ data: any }>('getBackendConfig', `${OPENTUI_WEBUI_HOST}/api/models`, {
    headers: genAuthHeaders(),
  }).then((res) => res.data);
}

export function getChats(page = 1): Promise<ChatSlim[]> {
  return fetchJson('getChats', `${OPENTUI_WEBUI_HOST}/api/v1/chats/?page=${page}`, {
    headers: genAuthHeaders(),
  });
}

export function getChat(id: string): Promise<ChatFull> {
  return fetchJson('getChat', `${OPENTUI_WEBUI_HOST}/api/v1/chats/${id}`, {
    headers: genAuthHeaders(),
  });
}

export function updateChatById(id: string, chat: object): Promise<ChatFull> {
  return fetchJson('updateChatById', `${OPENTUI_WEBUI_HOST}/api/v1/chats/${id}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...genAuthHeaders(),
    },
    body: JSON.stringify({
      chat: chat,
    }),
  });
}

export function generateOpenAIChatCompletion(body: object): Promise<any> {
  return fetchJson('generateOpenAIChatCompletion', `${OPENTUI_WEBUI_HOST}/api/chat/completions`, {
    method: 'POST',
    headers: {
      ...genAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export function chatCompleted(body: object): Promise<ChatCompleted> {
  return fetchJson('chatCompleted', `${OPENTUI_WEBUI_HOST}/api/chat/completed`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...genAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
}

export const createNewChat = async (chat: object): Promise<ChatFull> => {
  return fetchJson('createNewChat', `${OPENTUI_WEBUI_HOST}/api/v1/chats/new`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...genAuthHeaders(),
    },
    body: JSON.stringify({
      chat: chat,
    }),
  });
};

export const removeDetails = (
  content: string,
  types: string[]
): { content: string; thinking: boolean } => {
  let thinking = false;
  for (const type of types) {
    thinking = content.includes(`type="${type}" done="false"`);
    content = content.replace(
      new RegExp(`<details\\s+type="${type}"[^>]*>.*?<\\/details>`, 'gis'),
      ''
    );
  }

  return { content, thinking };
};

export const createMessagesList = (history: ChatHistory, messageId: string): Message[] => {
  if (messageId === null) {
    return [];
  }

  const message = history.messages[messageId];
  if (message?.parentId) {
    return [...createMessagesList(history, message.parentId), message];
  } else {
    return [message];
  }
};

export class FetchError extends Error {
  status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.status = status;
    this.name = 'FetchError';
  }
}

type FetchArgs = Parameters<typeof fetch>;

async function fetchJson<T>(ctx: string, ...fetchArgs: FetchArgs): Promise<T> {
  const req = new Request(...fetchArgs);
  let body = fetchArgs[1]?.body;
  logger.info({
    [ctx]: { type: 'FETCHING', url: req.url, body },
  });

  let error = null;

  const res = await fetch(req)
    .then(async (res) => {
      if (!res.ok) throw await res.json();
      return res.json();
    })
    .catch((err) => {
      error = err.detail;
      return null;
    });

  if (error) {
    logger.info({ [ctx]: { type: 'ERROR', error } });
    throw error;
  }

  logger.info({ [ctx]: { type: 'SUCCESS', res } });

  return res;
}

function genAuthHeaders() {
  return {
    Authorization: `Bearer ${OPENTUI_WEBUI_TOKEN}`,
  };
}

export const NEW_CHAT_ID = '__NEW__';

export function genNewChat(): ChatSlim {
  return {
    id: NEW_CHAT_ID,
    title: 'New Chat',
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000,
  };
}
