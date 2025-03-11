import React, { useEffect } from 'react';
import { ChatSlim } from '../types';
import { SafeText, sanitize } from './SafeText';
import {
  Box,
  List,
  Modal,
  ModalData,
  useInput,
  useKeymap,
  useList,
  useListItem,
  useNode,
  Text,
} from 'tuir';
import { useAppStore } from '../stores';

export const ChooseChat = (props: {
  chat: ChatSlim;
  chats: ChatSlim[];
  openChatCb: () => void;
}) => {
  const { isFocus: isFocused } = useNode();

  const { useEvent } = useKeymap({
    openModal: { key: 'return' },
  });

  useEvent('openModal', () => {
    props.openChatCb();
  });

  return (
    <Box
      borderStyle="round"
      flexGrow={1}
      position="relative"
      borderColor={isFocused ? 'green' : undefined}
      titleTopLeft={{ title: 'Chat', dimColor: true, color: isFocused ? 'green' : undefined }}
    >
      <Box paddingRight={1}>
        <SafeText wrap="truncate">{props.chat.title}</SafeText>
      </Box>
    </Box>
  );
};

export const ChooseChatModal = (props: {
  modal: ModalData;
  chats: ChatSlim[];
  onSubmit: (model: ChatSlim) => void;
}) => {
  const { width: appWidth, height: appHeight } = useAppStore((s) => s.dimensions);
  const { listView, control } = useList(props.chats, {
    windowSize: 'fit',
    unitSize: 1,
    navigation: 'none',
    centerScroll: false,
    fallthrough: true,
  });

  useInput((input, key) => {
    if (!props.modal._vis) {
      return;
    }

    if (key.down) {
      control.nextItem();
    } else if (key.up) {
      control.prevItem();
    } else if (key.return) {
      props.onSubmit(props.chats[control.currentIndex]);
      props.modal._hideModal();
    }
  });

  return (
    <Modal
      modal={props.modal}
      justifySelf="center"
      alignSelf="center"
      height={appHeight - 8}
      width={appWidth - 8}
      borderStyle="round"
      flexDirection="column"
      titleTopCenter={{ title: ' Chats ' }}
      borderColor="green"
    >
      <List listView={listView}>
        {props.chats.map((c) => (
          <Item key={c.id} item={c} />
        ))}
      </List>
    </Modal>
  );
};

function Item({ item }: { item: ChatSlim }): React.ReactNode {
  const { isFocus } = useListItem<ChatSlim[]>();
  const color = isFocus ? 'green' : undefined;
  return (
    <Box width="100" backgroundColor={color} overflowY="hidden" height={1}>
      <SafeText wrap="truncate-end">{item.title}</SafeText>
    </Box>
  );
}
