
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
  
  // Sort by date and time to get the most recent transaction
  const sortedTransactions = customerTransactions.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });
  
  const lastTransactionDate = sortedTransactions[0].date;

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

export const getCustomersByVillage = (village: string) => {
  const transactions = getTransactions();
  const customers = transactions
    .filter(t => t.village.toLowerCase() === village.toLowerCase())
    .map(t => ({ name: t.name, phone: t.phone }));
  
  // Remove duplicates based on phone number
  const uniqueCustomers = customers.filter((customer, index, self) => 
    index === self.findIndex(c => c.phone === customer.phone)
  );
  
  return uniqueCustomers;
};

export const getTotalDuesAmount = (): number => {
  const transactions = getTransactions();
  return transactions.reduce((sum, t) => sum + t.dueAmount, 0);
};

export const getCustomersWithDues = () => {
  const transactions = getTransactions();
  const customersWithDues = new Map();
  
  transactions.forEach(t => {
    if (t.dueAmount > 0) {
      const key = t.phone || t.name;
      if (customersWithDues.has(key)) {
        const existing = customersWithDues.get(key);
        existing.totalDue += t.dueAmount;
        existing.transactionCount++;
      } else {
        customersWithDues.set(key, {
          name: t.name,
          phone: t.phone,
          village: t.village,
          totalDue: t.dueAmount,
          transactionCount: 1,
          lastTransactionDate: t.date
        });
      }
    }
  });
  
  return Array.from(customersWithDues.values());
};
