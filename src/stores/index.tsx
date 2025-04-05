import { create } from 'zustand';
import { ChatFull, ChatSlim, Config, User, WebModel } from '../types';
import { Socket } from 'socket.io-client';
import {
  genNewChat,
  getBackendConfig,
  getChat,
  getChats,
  getFullChat,
  getModels,
  getSessionUser,
  NEW_CHAT_ID,
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
  promptHeight: number;
  setPromptHeight: (promptHeight: number) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  dimensions: {
    width: 0,
    height: 0,
  },
  setDimensions: (dimensions) => set(() => ({ dimensions })),
  promptHeight: 1,
  setPromptHeight: (promptHeight) => set({ promptHeight }),
}));

const loadingFlags = () =>
  ({ type: 'LOADING', isLoading: true, isSuccess: false, isError: false }) as const;
type LoadingFlags = ReturnType<typeof loadingFlags>;
const successFlags = () =>
  ({ type: 'SUCCESS', isLoading: false, isSuccess: true, isError: false }) as const;
type SuccessFlags = ReturnType<typeof successFlags>;
const errorFlags = () =>
  ({ type: 'ERROR', isLoading: false, isSuccess: false, isError: true }) as const;
type ErrorFlags = ReturnType<typeof errorFlags>;

type OpenWeb = {
  user: User;
  config: Config;
  socket: Socket;
  models: WebModel[];
  chats: ChatSlim[];
  chat: ChatSlim;
  chatQuery:
    | LoadingFlags
    | (ErrorFlags & { message: string })
    | (SuccessFlags & { data: ChatFull | null });
  model: WebModel;
  setChat: (chat: ChatSlim) => void;
  setModel: (model: WebModel) => void;
  setChats: (chats: ChatSlim[]) => void;
};

function createOpenWebStore(initial: Omit<OpenWeb, 'setChat' | 'setModel' | 'setChats'>) {
  return create<OpenWeb>((set, get) => ({
    ...initial,
    setChat: (chat) => {
      if (chat.id === NEW_CHAT_ID) {
        set({ chat, chatQuery: { data: null, ...successFlags() } });
        return;
      }
      set({ chat, chatQuery: { ...loadingFlags() } });
      getFullChat(chat.id)
        .then((chatFull) => {
          set({
            chatQuery: { data: chatFull, ...successFlags() },
            model: getModelFromChat(chatFull, get().models),
          });
        })
        .catch((e) => {
          set({ chatQuery: { message: String(e), ...errorFlags() } });
        });
    },
    setModel: (model) => set({ model }),
    setChats: (chats) => set({ chats }),
  }));
}

function getModelFromChat(chat: ChatFull, models: WebModel[]) {
  return models.find((m) => m.id === chat.chat.models[0]) || models[0];
}

class OpenWebStore {
  #state: ReturnType<typeof createOpenWebStore>;

  async init() {
    const user = await getSessionUser();
    const config = await getBackendConfig();
    const socket = await setupSocket();
    const models = await getModels();
    const chats = await getChats();
    const chosenChat = chats[0];
    const chatFull = await getFullChat(chosenChat.id || NEW_CHAT_ID);
    const model = getModelFromChat(chatFull, models);

    socket.emit('user-join', { auth: { token: user.token } });
    this.#state = createOpenWebStore({
      user,
      config,
      socket,
      models,
      chats,
      model,
      chat: chosenChat,
      chatQuery: {
        type: 'SUCCESS',
        data: chatFull,
        isSuccess: true,
        isError: false,
        isLoading: false,
      },
    });

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
