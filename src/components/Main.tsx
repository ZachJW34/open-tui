import React, { useEffect, useState } from 'react';
import { ChooseModel, ChooseModelModal } from './ChooseModel.js';
import { Chat } from './Chat.js';
import { genNewChat } from '../utils/ollama-client.js';
import { ChooseChat, ChooseChatModal } from './ChooseChat.js';
import { Box, NodeMap, useKeymap, useNodeMap, Node, useModal } from 'tuir';
import { Prompt } from './Prompt.js';
import { NewChat } from './NewChat.js';
import { openWebStore } from '../stores/index.js';

const nodeMap = [['A', 'B', 'E'], ['C'], ['D']] as const satisfies NodeMap;

export function Main() {
  const openWeb = openWebStore.useState((s) => s);
  const { register, control } = useNodeMap(nodeMap, { navigation: 'none', initialFocus: 'D' });
  const [prompt, setPrompt] = useState('');
  const chooseModelModal = useModal({ show: { input: '' }, hide: { key: 'esc' } });
  const chooseChatModal = useModal({ show: { input: '' }, hide: { key: 'esc' } });

  const { useEvent } = useKeymap({
    // goToNode: [{ input: 'A' }, { input: 'B' }, { input: 'C' }, { input: 'D' }],
    next: { key: 'tab' },
  });

  // useEvent('goToNode', (char: string) => {
  //   control.goToNode(char);
  // });

  useEvent('next', () => {
    control.next();
  });

  function newChatSubmit() {
    openWeb.setChat(genNewChat());
    control.goToNode('D');
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Node {...register('A')}>
          <ChooseModel
            value={openWeb.model}
            models={openWeb.models}
            openModalCb={chooseModelModal.showModal}
          />
        </Node>
        <Node {...register('B')}>
          <ChooseChat
            key={openWeb.chat.id}
            chat={openWeb.chat}
            chats={openWeb.chats}
            openChatCb={chooseChatModal.showModal}
          />
        </Node>
        <Node {...register('E')}>
          <NewChat onSubmit={newChatSubmit} />
        </Node>
      </Box>
      <Node {...register('C')}>
        <Chat prompt={prompt} />
      </Node>
      <Node {...register('D')}>
        <Prompt submitCb={setPrompt} />
      </Node>
      <ChooseModelModal
        modal={chooseModelModal.modal}
        models={openWeb.models}
        onSubmit={openWeb.setModel}
      />
      <ChooseChatModal
        modal={chooseChatModal.modal}
        chats={openWeb.chats}
        onSubmit={openWeb.setChat}
      />
    </Box>
  );
}
