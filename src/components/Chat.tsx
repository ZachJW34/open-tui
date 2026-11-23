import { Box, Text, Spacer } from 'tuir';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from './ScrollArea.js';
import { ChatCompletionData, ChatEvent, ChatHistory, Message } from '../types.js';
import {
  chatCompleted,
  createMessagesList,
  createNewChat,
  generateOpenAIChatCompletion,
  getChats,
  removeDetails,
  updateChatById,
} from '../utils/ollama-client.js';
import { Markdown } from './Markdown.js';
import { useNode } from 'tuir';
import { ElementDefaults, useAppStore, openWebStore } from '../stores/index.js';
import { v4 } from 'uuid';
import { logger } from '../utils/logger.js';

const Wrapper = (props: { children: React.ReactNode; isFocused: boolean; height: number }) => (
  <Box width="100%" flexDirection="column" height={props.height}>
    <Box
      borderStyle="single"
      borderColor={props.isFocused ? 'green' : undefined}
      width="100%"
      borderBottom={false}
    ></Box>
    <Box justifyContent="center" flexDirection="row" height={props.height - 2}>
      <Box width={2}></Box>
      {props.children}
      <Box width={2}></Box>
    </Box>
    <Box
      borderStyle="single"
      borderColor={props.isFocused ? 'green' : undefined}
      width="100%"
      borderTop={false}
    ></Box>
  </Box>
);

let _chatHistory: ChatHistory;
let _chatId: string;

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

type AgentStatusKind = 'working' | 'thinking' | 'done' | 'error' | 'waiting';

// Owns its own animation clock so a running spinner never re-renders the
// transcript. `startedAt` is set when a request is submitted and `durationMs` is
// frozen once it finishes, which is what separates in-flight from completed.
const AgentStatus = (props: {
  status: AgentStatusKind;
  startedAt: number | null;
  durationMs: number | null;
}) => {
  const busy = props.status === 'working' || props.status === 'thinking';
  const [frame, setFrame] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!busy || props.startedAt === null) {
      return;
    }
    const startedAt = props.startedAt;
    setElapsedMs(Date.now() - startedAt);
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 100);
    return () => clearInterval(id);
  }, [busy, props.startedAt]);

  const seconds = ((busy ? elapsedMs : (props.durationMs ?? 0)) / 1000).toFixed(1);

  if (busy) {
    const label = props.status === 'thinking' ? 'Thinking' : 'Generating';
    return <Text color="yellow">{`${SPINNER_FRAMES[frame]} ${label}... ${seconds}s`}</Text>;
  }
  if (props.status === 'error' && props.durationMs !== null) {
    return <Text color="red">{`✖ Failed after ${seconds}s`}</Text>;
  }
  if (props.durationMs !== null) {
    return <Text color="green">{`✔ Done in ${seconds}s`}</Text>;
  }
  return <Text color="grey">{'● Waiting for input'}</Text>;
};

export const Chat = (props: { prompt: string }) => {
  const $chat = openWebStore.useState((s) => s.chat);
  const $chatQuery = openWebStore.useState((s) => s.chatQuery);
  const $model = openWebStore.useState((s) => s.model);
  const $socket = openWebStore.useState((s) => s.socket);
  const setChat = openWebStore.useState((s) => s.setChat);
  const setChats = openWebStore.useState((s) => s.setChats);
  const ref = useRef<any>();
  const { isFocus: isFocused } = useNode();
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [run, setRun] = useState<number | null>(null);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const { width: appWidth, height: appHeight } = useAppStore((s) => s.dimensions);
  const promptHeight = useAppStore((s) => s.promptHeight);

  useEffect(() => {
    if ($chatQuery.type === 'SUCCESS') {
      _chatId = $chat.id;
      _chatHistory = $chatQuery.data?.chat.history || ({ currentId: null, messages: {} } as any);
      setChatHistory(_chatHistory);
    }
  }, [$chat, $chatQuery]);

  // The agent is in flight from the moment a request is submitted until the
  // assistant message it created is marked done, or failed.
  useEffect(() => {
    if (run === null) {
      return;
    }
    const history = chatHistory || $chatQuery.data?.chat.history;
    const historyMessages = Object.values(history?.messages ?? {});
    const last = historyMessages[historyMessages.length - 1] as Message | undefined;
    if (last && last.role === 'assistant' && (last.done || last.error)) {
      setLastDuration(Date.now() - run);
      setRun(null);
    }
  }, [run, chatHistory, $chatQuery]);

  // const chatQuery = useQuery({
  //   queryKey: ['chat', $chat.id],
  //   queryFn: () => {
  //     if ($chat.id === NEW_CHAT_ID) {
  //       return Promise.resolve(null);
  //     }
  //     return getChat($chat.id);
  //   },
  //   onSuccess(data) {
  //     _chatId = $chat.id;
  //     _chatHistory = data?.chat.history || ({ currentId: null, messages: {} } as any);
  //     setChatHistory(_chatHistory);
  //   },
  // });

  useEffect(() => {
    $socket.on('chat-events', (e: ChatEvent) => {
      logger.info({ CONTEXT: 'WS', ...e });

      if (e.chat_id === _chatId) {
        const message = _chatHistory.messages[e.message_id];
        if (message) {
          if (e.data.type === 'chat:completion') {
            chatCompletionEventHandler(e.data.data, message, _chatId);
          }
        }
      }
    });

    return () => {
      $socket.off('chat-events');
    };
  }, [$chat.id, $socket]);

  useEffect(() => {
    if (props.prompt && $chatQuery.isSuccess) {
      submit(props.prompt, $chat.id);
    }
  }, [props.prompt]);

  const submit = async (userPrompt: string, chatId: string) => {
    const messages = createMessagesList(_chatHistory, _chatHistory.currentId);

    const selectedModels = [$model.id];
    const userMessageId = v4();
    const userMessage: Message = {
      id: userMessageId,
      parentId: messages.at(-1)?.id ?? null,
      childrenIds: [],
      role: 'user',
      content: userPrompt,
      // files: [] TODO,
      timestamp: Math.floor(Date.now() / 1000),
      models: selectedModels,
    };

    _chatHistory.messages[userMessageId] = userMessage;
    _chatHistory.currentId = userMessageId;

    if (messages.length !== 0) {
      _chatHistory.messages[messages.at(-1)?.id || ''].childrenIds.push(userMessageId);
    }

    setChatHistory({ ..._chatHistory });

    await sendPrompt(userPrompt, userMessageId, chatId);
  };

  const sendPrompt = async (prompt: string, parentId: string, chatId: string) => {
    if (_chatHistory.messages[_chatHistory.currentId].parentId === null) {
      chatId = await initChatHandler();
    }
    // const responseMessageIds: Record<PropertyKey, string> = {};
    let responseMessageId = v4();
    let responseMessage: Message = {
      parentId: parentId,
      id: responseMessageId,
      childrenIds: [],
      role: 'assistant',
      content: '',
      model: $model.id,
      modelName: $model.name ?? $model.id,
      modelIdx: 0,
      userContext: null,
      timestamp: Math.floor(Date.now() / 1000), // Unix epoch
    };

    _chatHistory.messages[responseMessageId] = responseMessage;
    _chatHistory.currentId = responseMessageId;
    setRun(Date.now());
    setLastDuration(null);

    if (parentId !== null && _chatHistory.messages[parentId]) {
      _chatHistory.messages[parentId].childrenIds = [
        ..._chatHistory.messages[parentId].childrenIds,
        responseMessageId,
      ];
    }

    setChatHistory({ ..._chatHistory });

    await updateChatById(chatId, {
      models: [$model.id],
      history: _chatHistory,
      messages: createMessagesList(_chatHistory, _chatHistory.currentId),
      params: {},
      files: [],
    });

    let userContext = null;
    responseMessage.userContext = userContext;

    await sendPromptSocket(responseMessageId, chatId);
  };

  const sendPromptSocket = async (responseMessageId: string, chatId: string) => {
    const responseMessage = _chatHistory.messages[responseMessageId];
    const stream = true;

    let messages = createMessagesList(_chatHistory, responseMessageId)
      .map((m) => ({
        ...m,
        content: removeDetails(m.content, ['reasoning', 'code_interpreter']).content,
      }))
      .filter((m) => m.role === 'user' || m.content?.trim());

    const res = await generateOpenAIChatCompletion({
      stream: stream,
      model: $model.id,
      messages: messages,
      params: {},

      files: undefined,
      tool_ids: undefined,

      features: {
        image_generation: false,
        code_interpreter: false,
        web_search: false,
      },
      variables: {},
      model_item: $model,

      session_id: $socket.id,
      chat_id: chatId,
      id: responseMessageId,
      background_tasks: {
        title_generation: true,
        tags_generation: true,
      },
    }).catch((error) => {
      responseMessage.error = {
        content: error,
      };
      responseMessage.done = true;

      _chatHistory.messages[responseMessageId] = responseMessage;
      _chatHistory.currentId = responseMessageId;

      setChatHistory({ ..._chatHistory });
    });
  };

  const initChatHandler = async () => {
    const chat = await createNewChat({
      id: '',
      title: 'New Chat',
      models: [$model],
      system: undefined,
      params: {},
      history: _chatHistory,
      messages: createMessagesList(_chatHistory, _chatHistory.currentId),
      tags: [],
      timestamp: Date.now(),
    });

    _chatId = chat.id;
    return _chatId;
  };

  const chatCompletionEventHandler = async (
    data: ChatCompletionData['data'],
    message: Message,
    chatId: string
  ) => {
    const { id, done, choices, content, sources, selected_model_id, error, usage } = data;

    if (error) {
      message.error = {
        content: error,
      };
      message.done = true;

      if (message.statusHistory) {
        message.statusHistory = message.statusHistory.filter(
          (status) => status.action !== 'knowledge_search'
        );
      }

      _chatHistory.messages[message.id] = message;

      setChatHistory({ ..._chatHistory });
    }

    if (content) {
      message.content = content;
    }

    if (usage) {
      message.usage = usage;
    }

    _chatHistory.messages[message.id] = message;
    setChatHistory({ ..._chatHistory });

    if (done) {
      message.done = true;

      await chatCompletedHandler(
        chatId,
        message.model || '',
        message.id,
        createMessagesList(_chatHistory, message.id)
      );
    }
  };

  const chatCompletedHandler = async (
    chatId: string,
    modelId: string,
    responseMessageId: string,
    messages: Message[]
  ) => {
    const res = await chatCompleted({
      model: modelId,
      messages: messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        info: m.info ? m.info : undefined,
        timestamp: m.timestamp,
        ...(m.usage ? { usage: m.usage } : {}),
        ...(m.sources ? { sources: m.sources } : {}),
      })),
      model_item: $model,
      chat_id: chatId,
      session_id: $socket.id,
      id: responseMessageId,
    }).catch((error) => {
      if (messages.length > 0) {
        messages[messages.length - 1].error = { content: error };
      }

      return null;
    });

    if (res !== null && res.messages) {
      // Update chat history with the new messages
      for (const message of res.messages) {
        if (message?.id) {
          // Add null check for message and message.id
          _chatHistory.messages[message.id] = {
            ..._chatHistory.messages[message.id],
            ...(_chatHistory.messages[message.id].content !== message.content
              ? { originalContent: _chatHistory.messages[message.id].content }
              : {}),
            ...message,
          };
        }
      }
    }

    // if (!$temporaryChatEnabled) {
    const chat = await updateChatById(chatId, {
      models: [modelId],
      messages: messages,
      history: _chatHistory,
      params: {},
      files: [],
    });

    const refreshedChats = await getChats();
    setChats([...refreshedChats]);
    setChat(refreshedChats.find((c) => chat.id === c.id) || chat);

    // currentChatPage.set(1);
    // await chats.set(await getChatList(localStorage.token, $currentChatPage));
    // }
  };

  const middleBarHeight = appHeight - ElementDefaults.topBar - (promptHeight + 2);

  if ($chatQuery.isLoading) {
    return (
      <Wrapper isFocused={isFocused} height={middleBarHeight}>
        <Text>Loading...</Text>
      </Wrapper>
    );
  }

  if ($chatQuery.isError) {
    return (
      <Wrapper isFocused={isFocused} height={middleBarHeight}>
        <Text>Error</Text>
      </Wrapper>
    );
  }

  const historyToRender = chatHistory || $chatQuery.data?.chat.history || { messages: {} };
  const scrollHeight = middleBarHeight - 2;
  const messages: (
    | { role: 'user'; content: string; id: string }
    | {
        role: 'assistant';
        id: string;
        content: string;
        thinking: boolean;
        done: boolean;
        error: boolean;
      }
  )[] = Object.values(historyToRender.messages).map((m) => {
    if (m.role === 'user') {
      return { role: m.role, content: m.content, id: m.id };
    } else {
      return {
        role: m.role,
        id: m.id,
        ...removeDetails(m.content, ['reasoning']),
        done: m.done === true,
        error: Boolean(m.error),
      };
    }
  });

  const lastAssistant = messages.filter((m) => m.role === 'assistant').slice(-1)[0] as
    | Extract<(typeof messages)[number], { role: 'assistant' }>
    | undefined;
  const status: AgentStatusKind =
    run !== null
      ? lastAssistant?.thinking
        ? 'thinking'
        : 'working'
      : lastAssistant
        ? lastAssistant.error
          ? 'error'
          : 'done'
        : 'waiting';

  return (
    <Box ref={ref} flexDirection="column" width={appWidth}>
      <Wrapper isFocused={isFocused} height={middleBarHeight}>
        <ScrollArea height={scrollHeight} disabled={!isFocused}>
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <Box key={m.id} flexDirection="row" width={appWidth - 4}>
                  <Spacer />
                  <Box borderStyle="round" borderColor="grey">
                    <Text>{m.content}</Text>
                  </Box>
                </Box>
              );
            } else {
              return (
                <Box width={appWidth - 4} key={m.id}>
                  {m.thinking ? (
                    <Text>Thinking...</Text>
                  ) : (
                    <Markdown content={m.content}></Markdown>
                  )}
                </Box>
              );
            }
          })}
          <AgentStatus status={status} startedAt={run} durationMs={lastDuration} />
        </ScrollArea>
      </Wrapper>
    </Box>
  );
};
