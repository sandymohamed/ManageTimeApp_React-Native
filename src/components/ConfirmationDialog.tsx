import React from 'react';
import { Alert } from 'react-native';

interface ConfirmationDialogProps {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const showDeleteConfirmation = (
  itemName: string,
  onConfirm: () => void,
  options?: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  }
) => {
  const {
    title = 'Delete Item',
    message = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmText = 'Delete',
    cancelText = 'Cancel',
  } = options || {};

  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: 'cancel',
        onPress: () => {},
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
};

export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
  }
) => {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  } = options || {};

  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: 'cancel',
        onPress: () => {},
      },
      {
        text: confirmText,
        style: 'default',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
};