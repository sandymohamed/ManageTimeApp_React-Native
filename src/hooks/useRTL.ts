import { useLanguage } from '@/contexts/LanguageContext';

export const useRTL = () => {
  const { isRTL } = useLanguage();
  
  return {
    isRTL,
    textAlign: isRTL ? 'right' : 'left' as 'left' | 'right' | 'center',
    flexDirection: isRTL ? 'row-reverse' : 'row' as 'row' | 'row-reverse',
    textAlignVertical: 'center' as 'auto' | 'top' | 'bottom' | 'center',
  };
};
