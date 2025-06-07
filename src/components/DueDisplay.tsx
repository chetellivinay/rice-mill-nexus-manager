
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getCustomerDueInfo } from '@/utils/dueUtils';

interface DueDisplayProps {
  phone: string;
  variant?: 'default' | 'destructive' | 'secondary' | 'outline';
  className?: string;
}

const DueDisplay: React.FC<DueDisplayProps> = ({ phone, variant = 'destructive', className = '' }) => {
  const dueInfo = getCustomerDueInfo(phone);

  if (!dueInfo.hasAnyDue) {
    return null;
  }

  return (
    <Badge variant={variant} className={className}>
      Due: ₹{dueInfo.totalDue.toFixed(2)}
    </Badge>
  );
};

export default DueDisplay;
