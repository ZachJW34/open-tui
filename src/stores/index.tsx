import { create } from 'zustand';
import { ChatSlim, Config, User, WebModel } from '../types';
import { Socket } from 'socket.io-client';
import {
  genNewChat,
  getBackendConfig,
  getChats,
  getModels,
  getSessionUser,
  setupSocket,
} from '../utils/ollama-client';

export const ElementDefaults = {
  topBar: 3,
  bottomBar: 3,
};

type Dimensions = {
  width: number;
  height: number;
};

type AppStore = {
  dimensions: Dimensions;
  setDimensions: (dimensions: Dimensions) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  dimensions: {
    width: 0,
    height: 0,
  },
  setDimensions: (dimensions) => set(() => ({ dimensions })),
}));

type OpenWeb = {
  user: User;
  config: Config;
  socket: Socket;
  models: WebModel[];
  chats: ChatSlim[];
  chat: ChatSlim;
  model: WebModel;
  setChat: (chat: ChatSlim) => void;
  setModel: (model: WebModel) => void;
  setChats: (chats: ChatSlim[]) => void;
};

function createOpenWebStore(
  initial: Omit<OpenWeb, 'chat' | 'model' | 'setChat' | 'setModel' | 'setChats'>
) {
  return create<OpenWeb>((set) => ({
    ...initial,
    chat: initial.chats[0] || genNewChat(),
    model: initial.models[0],
    setChat: (chat) => set({ chat }),
    setModel: (model) => set({ model }),
    setChats: (chats) => set({ chats }),
  }));
}

class OpenWebStore {
  #state: ReturnType<typeof createOpenWebStore>;

  async init() {
    const user = await getSessionUser();
    const config = await getBackendConfig();
    const socket = await setupSocket();
    const models = await getModels();
    const chats = await getChats();

    socket.emit('user-join', { auth: { token: user.token } });
    this.#state = createOpenWebStore({ user, config, socket, models, chats });

    return true;
  }

  get useState() {
    if (!this.#state) {
      throw new Error('You are required to call init before accessing state');
    }

    return this.#state;
  }
}

export const openWebStore = new OpenWebStore();

// export const _useOpenWebStore = {
//   async init() {
//     const user = await getSessionUser();
//       const config = await getBackendConfig();
//       const socket = await setupSocket();
//       const models = await getModels();
//       const chats = await getChats();

//       socket.emit('user-join', { auth: { token: user.token } });

//       return { user, config, socket, models, chats };
//   }
//   store: null as any
// }
