
export const isRTL = (language: string): boolean => {
  return language === 'ar';
};

export const getRTLStyle = (isRtl: boolean) => ({
  textAlign: isRtl ? 'right' : 'left' as 'left' | 'right' | 'center',
  writingDirection: isRtl ? 'rtl' : 'ltr' as 'ltr' | 'rtl',
  direction: isRtl ? 'rtl' : 'ltr' as 'ltr' | 'rtl',
});

export const getRTLFlexDirection = (isRtl: boolean, direction: 'row' | 'column' = 'row') => {
  if (direction === 'column') return 'column';
  return isRtl ? 'row-reverse' : 'row';
};

export const getRTLMargin = (isRtl: boolean, marginStart: number, marginEnd: number) => ({
  marginLeft: isRtl ? marginEnd : marginStart,
  marginRight: isRtl ? marginStart : marginEnd,
});

export const getRTLPadding = (isRtl: boolean, paddingStart: number, paddingEnd: number) => ({
  paddingLeft: isRtl ? paddingEnd : paddingStart,
  paddingRight: isRtl ? paddingStart : paddingEnd,
});

export const getRTLBorderRadius = (isRtl: boolean, topStart: number, topEnd: number, bottomStart: number, bottomEnd: number) => ({
  borderTopLeftRadius: isRtl ? topEnd : topStart,
  borderTopRightRadius: isRtl ? topStart : topEnd,
  borderBottomLeftRadius: isRtl ? bottomEnd : bottomStart,
  borderBottomRightRadius: isRtl ? bottomStart : bottomEnd,
});