
import { getTransactions } from './localStorage';

export interface DueInfo {
  totalDue: number;
  transactionCount: number;
  lastTransactionDate: string;
}

export const checkDuesByPhone = (phoneNumber: string): DueInfo | null => {
  if (!phoneNumber || phoneNumber.length !== 10) {
    return null;
  }

  const transactions = getTransactions();
  const customerTransactions = transactions.filter(t => t.phone === phoneNumber && t.dueAmount > 0);
  
  if (customerTransactions.length === 0) {
    return null;
  }

  const totalDue = customerTransactions.reduce((sum, t) => sum + t.dueAmount, 0);
  const lastTransactionDate = customerTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date;

  return {
    totalDue,
    transactionCount: customerTransactions.length,
    lastTransactionDate
  };
};

export const getUniqueVillages = (): string[] => {
  const transactions = getTransactions();
  const villages = transactions.map(t => t.village).filter(Boolean);
  return [...new Set(villages)].sort();
};
