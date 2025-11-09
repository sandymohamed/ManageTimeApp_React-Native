import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

let navigationRef: NavigationContainerRef<any> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

export const navigate = (name: string, params?: any) => {
  if (!navigationRef) return;
  try {
    // @ts-ignore
    navigationRef.navigate(name, params);
  } catch (e) {
    console.log('Navigation error', e);
  }
};

export const handleDeepLink = (url: string) => {
  if (!navigationRef) return;

  // Handle invitation links: managetime://invitation/{token}
  const invitationMatch = url.match(/managetime:\/\/invitation\/([a-f0-9]+)/);
  if (invitationMatch) {
    const token = invitationMatch[1];
    navigationRef.navigate('InvitationAccept', { token });
    return;
  }

  // Handle web invitation links: /invitation/{token}
  const webInvitationMatch = url.match(/\/invitation\/([a-f0-9]+)/);
  if (webInvitationMatch) {
    const token = webInvitationMatch[1];
    navigationRef.navigate('InvitationAccept', { token });
    return;
  }
};

export const initializeDeepLinking = () => {
  // Handle initial URL (when app is opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url);
    }
  });

  // Handle URL changes (when app is already running)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return subscription;
};
