import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

let navigationRef: NavigationContainerRef<any> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

export const handleDeepLink = (url: string) => {
  if (!navigationRef) return;

  console.log('Handling deep link:', url);

  // Handle invitation links: managetime://invitation/{token}
  const invitationMatch = url.match(/managetime:\/\/invitation\/([a-f0-9]+)/);
  if (invitationMatch) {
    const token = invitationMatch[1];
    console.log('Navigating to InvitationAccept with token:', token);
    navigationRef.navigate('InvitationAccept', { token });
    return;
  }

  // Handle web invitation links: /invitation/{token}
  const webInvitationMatch = url.match(/\/invitation\/([a-f0-9]+)/);
  if (webInvitationMatch) {
    const token = webInvitationMatch[1];
    console.log('Navigating to InvitationAccept with token (web):', token);
    navigationRef.navigate('InvitationAccept', { token });
    return;
  }

  // Handle other deep links here if needed
  console.log('Unhandled deep link:', url);
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
