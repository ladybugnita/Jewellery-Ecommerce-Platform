import { useTranslation } from 'react-i18next';
import {
  formatCurrency,
  formatNumberNepali,
  formatPercent,
  formatWeight,
  formatDate
} from '../utils/nepaliFormat';

export const useFormatter = () => {
  const { i18n } = useTranslation();

  const language = i18n.language;

  return {
    currency: (value) => formatCurrency(value, language),
    number: (value) =>
      language === 'ne' ? formatNumberNepali(value) : value.toLocaleString(),

    percent: (value) => formatPercent(value, language),
    weight: (value) => formatWeight(value, language),
    date: (value) => formatDate(value, language)
  };
};