import NepaliDate from "nepali-date-converter";

const nepaliDigits = ['०','१','२','३','४','५','६','७','८','९'];

export const toNepaliDigits = (value) => {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\d/g, d => nepaliDigits[d]);
};

export const toEnglishDigits = (value) => {
  if (!value) return '';
  const map = {
    '०':'0','१':'1','२':'2','३':'3','४':'4',
    '५':'5','६':'6','७':'7','८':'8','९':'9'
  };
  return value.toString().replace(/[०-९]/g, d => map[d]);
};

export const formatNumberNepali = (num, decimals = 2, isNepali = null) => {
  if (num === null || num === undefined) return '';

  const numericValue = parseFloat(toEnglishDigits(num));
  if (isNaN(numericValue)) return num;

  const formatted = numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return isNepali ? toNepaliDigits(formatted) : formatted;
};

export const formatCurrency = (amount, isNepali = false) => {
  if (amount === null || amount === undefined) return '';

  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNepali
    ? `रु ${toNepaliDigits(formatted)}`
    : `NPR ${formatted}`;
};

export const formatWeight = (weight, language) => {
  if (weight === null || weight === undefined) return '';
  
  const formatted = Number(weight).toFixed(2);

 if (language === 'ne') {
    return `${toNepaliDigits(formatted)} ग्राम`;
  }

  return `${formatted} g`;
};

export const formatPercent = (value, language) => {
  if (value === null || value === undefined) return '';

  const formatted = Number(value).toFixed(2);

  if (language === 'ne') {
    return `${toNepaliDigits(formatted)}%`;
  }

  return `${formatted}%`;
};

export const formatDate = (date, language) => {
  if (!date) return '';
  
  try {
    const jsDate = new Date(date);
    if (isNaN(jsDate.getTime())) {
      return language === 'ne' ? toNepaliDigits(date) : date;
    }
    
    if (language === 'ne') {
      try {
        const nepDate = new NepaliDate(jsDate);
        const formatted = nepDate.format('YYYY/MM/DD');
        return toNepaliDigits(formatted);
      } catch (error) {
        console.error('Error formatting Nepali date:', error);
        const fallback = jsDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '/');
        return toNepaliDigits(fallback);
      }
    }
    
    return jsDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error in formatDate:', error);
    return date;
  }
};

export const formatDateTime = (date, language) => {
  if (!date) return '';
  
  try {
    const jsDate = new Date(date);
    if (isNaN(jsDate.getTime())) {
      return language === 'ne' ? toNepaliDigits(date) : date;
    }
    
    if (language === 'ne') {
      try {
        const nepDate = new NepaliDate(jsDate);
        const formatted = nepDate.format('YYYY/MM/DD HH:mm');
        return toNepaliDigits(formatted);
      } catch (error) {
        console.error('Error formatting Nepali datetime:', error);
        const fallback = jsDate.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        return toNepaliDigits(fallback);
      }
    }
    
    return jsDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error in formatDateTime:', error);
    return date;
  }
};