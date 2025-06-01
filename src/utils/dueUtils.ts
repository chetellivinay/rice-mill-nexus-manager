
import { getTransactions, getStockTransactions, getDues } from './localStorage';

export interface CustomerDueInfo {
  totalDue: number;
  transactionDue: number;
  stockDue: number;
  customDue: number;
  hasAnyDue: boolean;
}

export const getCustomerDueInfo = (phone: string): CustomerDueInfo => {
  const transactions = getTransactions();
  const stockTransactions = getStockTransactions();
  const customDues = getDues();

  const transactionDue = transactions
    .filter(t => t.phone === phone && t.dueAmount > 0)
    .reduce((sum, t) => sum + t.dueAmount, 0);

  const stockDue = stockTransactions
    .filter(t => t.phoneNumber === phone && t.dueAmount > 0)
    .reduce((sum, t) => sum + t.dueAmount, 0);

  const customDue = customDues
    .filter(d => d.customerName.includes(phone))
    .reduce((sum, d) => sum + d.amount, 0);

  const totalDue = transactionDue + stockDue + customDue;

  return {
    totalDue,
    transactionDue,
    stockDue,
    customDue,
    hasAnyDue: totalDue > 0
  };
};

export const formatDueDisplay = (dueInfo: CustomerDueInfo): string => {
  if (!dueInfo.hasAnyDue) return '';
  return `Total Due: ₹${dueInfo.totalDue.toFixed(2)}`;
};
