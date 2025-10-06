import { I18nManager } from 'react-native';

export const isRTL = (language: string): boolean => {
  return language === 'ar';
};

export const getRTLStyle = (isRTL: boolean) => ({
  textAlign: isRTL ? 'right' : 'left' as 'left' | 'right' | 'center',
  writingDirection: isRTL ? 'rtl' : 'ltr' as 'ltr' | 'rtl',
  direction: isRTL ? 'rtl' : 'ltr' as 'ltr' | 'rtl',
});

export const getRTLFlexDirection = (isRTL: boolean, direction: 'row' | 'column' = 'row') => {
  if (direction === 'column') return 'column';
  return isRTL ? 'row-reverse' : 'row';
};

export const getRTLMargin = (isRTL: boolean, marginStart: number, marginEnd: number) => ({
  marginLeft: isRTL ? marginEnd : marginStart,
  marginRight: isRTL ? marginStart : marginEnd,
});

export const getRTLPadding = (isRTL: boolean, paddingStart: number, paddingEnd: number) => ({
  paddingLeft: isRTL ? paddingEnd : paddingStart,
  paddingRight: isRTL ? paddingStart : paddingEnd,
});

export const getRTLBorderRadius = (isRTL: boolean, topStart: number, topEnd: number, bottomStart: number, bottomEnd: number) => ({
  borderTopLeftRadius: isRTL ? topEnd : topStart,
  borderTopRightRadius: isRTL ? topStart : topEnd,
  borderBottomLeftRadius: isRTL ? bottomEnd : bottomStart,
  borderBottomRightRadius: isRTL ? bottomStart : bottomEnd,
});