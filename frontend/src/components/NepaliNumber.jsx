import React from 'react';
import { useNumberFormatter } from '../hooks/useNumberFormatter';

const NepaliNumber = ({ 
  value, 
  type = 'number', 
  ...props 
}) => {
  const formatters = useNumberFormatter();
  
  const getFormattedValue = () => {
    switch (type) {
      case 'currency':
        return formatters.currency(value);
      case 'weight':
        return formatters.weight(value);
      case 'percentage':
        return formatters.percentage(value);
      case 'date':
        return formatters.date(value);
      case 'digits':
        return formatters.digits(value);
      case 'number':
      default:
        return formatters.number(value);
    }
  };

  return <span {...props}>{getFormattedValue()}</span>;
};

export default NepaliNumber;