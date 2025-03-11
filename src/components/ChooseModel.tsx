import React from 'react';
import { WebModel } from '../types';
import {
  Text,
  Box,
  List,
  Modal,
  ModalData,
  useInput,
  useKeymap,
  useList,
  useListItem,
  useNode,
} from 'tuir';
import { SafeText } from './SafeText';

export function ChooseModel(props: {
  value: WebModel;
  models: WebModel[];
  openModalCb: () => void;
}) {
  const { isFocus: isFocused } = useNode();

  const { useEvent } = useKeymap({
    openModal: { key: 'return' },
  });

  useEvent('openModal', () => {
    props.openModalCb();
  });

  return (
    <Box
      borderStyle="round"
      borderColor={isFocused ? 'green' : undefined}
      flexShrink={0}
      titleTopLeft={{ title: 'Model', dimColor: true, color: isFocused ? 'green' : undefined }}
    >
      <Text>{props.value.name}</Text>
    </Box>
  );
}

export const ChooseModelModal = (props: {
  modal: ModalData;
  models: WebModel[];
  onSubmit: (model: WebModel) => void;
}) => {
  const { listView, items, control } = useList(props.models, {
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
      props.onSubmit(items[control.currentIndex]);
      props.modal._hideModal();
    }
  });

  return (
    <Modal
      modal={props.modal}
      justifySelf="center"
      alignSelf="center"
      height={10}
      width={32}
      borderStyle="round"
      flexDirection="column"
      titleTopCenter={{ title: ' Models ' }}
      borderColor="green"
    >
      <List listView={listView}>
        {items.map((item) => (
          <Item key={item.id} />
        ))}
      </List>
    </Modal>
  );
};

function Item(): React.ReactNode {
  const { isFocus, item } = useListItem<WebModel[]>();
  const color = isFocus ? 'green' : undefined;
  return (
    <Box width="100" backgroundColor={color}>
      <SafeText wrap="truncate-end">{item.name}</SafeText>
    </Box>
  );
}
