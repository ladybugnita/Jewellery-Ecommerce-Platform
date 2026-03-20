import { useTranslation } from "react-i18next";
import {
  formatCurrency,
  formatNumberNepali,
  formatWeight,
  formatPercent
} from "../utils/nepaliFormat";

export const useNepaliNumber = () => {
  const { i18n } = useTranslation();
  const isNepali = i18n.language === "ne";

  const convertNumber = (num) => {
    return formatNumberNepali(num, 2, isNepali);
  };

  const convertCurrency = (amount) => {
    return formatCurrency(amount, isNepali);
  };

  const convertWeight = (weight) => {
    return formatWeight(weight, isNepali ? "ne" : "en");
  };

  const convertPercentage = (value) => {
    return formatPercent(value, isNepali ? "ne" : "en");
  };

  const convertNumberWithCommas = (value) => {
    if (value === null || value === undefined) return '';
    return formatNumberNepali(value, 2, isNepali);
  };

  return {
    convertNumber,
    convertCurrency,
    convertWeight,
    convertPercentage,
    convertNumberWithCommas,  
  };
};