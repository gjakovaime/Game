import { STRINGS } from '../i18n/strings';
import { useProfile } from './useProfile';

export function useT() {
  const { activeProfile } = useProfile();
  return STRINGS[activeProfile?.uiLang ?? 'sq'];
}
