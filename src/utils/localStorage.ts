
export interface QueueCustomer {
  id: string;
  name: string;
  phoneNumber: string;
  driverName?: string;
  driverPhone?: string;
  loadBrought: number;
  arrivalTime: string;
  date: string;
  village?: string;
}

export interface BillingItem {
  name: string;
  rate: number;
  quantity: number;
  total: number;
}

export interface Transaction {
  id: string;
  name: string;
  village: string;
  phone: string;
  items: BillingItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  time: string;
}

export interface InventoryItem {
  name: string;
  count: number;
}

export interface StockItem {
  name: string;
  kg25: number;
  kg50: number;
}

export interface StockTransaction {
  id: string;
  customerName: string;
  phoneNumber: string;
  village: string;
  stockBought: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  time: string;
}

export interface DueRecord {
  id: string;
  customerName: string;
  type: 'bran' | 'rice' | 'custom';
  stockType?: string;
  amount: number;
  description: string;
  date: string;
}

export interface WorkerRecord {
  id: string;
  name: string;
  borrowedAmount: number;
  salary: number;
  totalDue: number;
  date: string;
}

export interface DeletedTransaction {
  transaction: Transaction;
  deletedDate: string;
}

export interface BinItem {
  id: string;
  type: 'transaction' | 'inventory';
  data: any;
  deletedDate: string;
  restoreDeadline: string;
}

// Storage keys
const STORAGE_KEYS = {
  QUEUE: 'rice_mill_queue',
  TRANSACTIONS: 'rice_mill_transactions',
  INVENTORY: 'rice_mill_inventory',
  STOCK: 'rice_mill_stock',
  DUES: 'rice_mill_dues',
  WORKERS: 'rice_mill_workers',
  DELETED_TRANSACTIONS: 'rice_mill_deleted_transactions',
  RATES: 'rice_mill_rates',
  BIN: 'rice_mill_bin'
};

// Generic storage functions
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Queue functions
export const saveQueueCustomers = (customers: QueueCustomer[]): void => {
  saveToStorage(STORAGE_KEYS.QUEUE, customers);
};

export const getQueueCustomers = (): QueueCustomer[] => {
  return getFromStorage(STORAGE_KEYS.QUEUE, []);
};

// Transaction functions
export const saveTransactions = (transactions: Transaction[]): void => {
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
};

export const getTransactions = (): Transaction[] => {
  return getFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
};

// Inventory functions
export const saveInventory = (inventory: InventoryItem[]): void => {
  saveToStorage(STORAGE_KEYS.INVENTORY, inventory);
};

export const getInventory = (): InventoryItem[] => {
  return getFromStorage(STORAGE_KEYS.INVENTORY, [
    { name: 'Powders', count: 0 },
    { name: 'Small Bags', count: 0 },
    { name: 'Big Bags', count: 0 },
    { name: 'Bran Bags', count: 0 }
  ]);
};

// Stock functions
export const saveStock = (stock: StockItem[]): void => {
  saveToStorage(STORAGE_KEYS.STOCK, stock);
};

export const getStock = (): StockItem[] => {
  return getFromStorage(STORAGE_KEYS.STOCK, [
    { name: 'Bran Stock', kg25: 0, kg50: 0 },
    { name: 'Dhana Stock', kg25: 0, kg50: 0 },
    { name: 'Nukalu Stock', kg25: 0, kg50: 0 },
    { name: 'HMT Rice', kg25: 0, kg50: 0 },
    { name: 'JSR Rice', kg25: 0, kg50: 0 },
    { name: 'BPT Rice', kg25: 0, kg50: 0 }
  ]);
};

// Dues functions
export const saveDues = (dues: DueRecord[]): void => {
  saveToStorage(STORAGE_KEYS.DUES, dues);
};

export const getDues = (): DueRecord[] => {
  return getFromStorage(STORAGE_KEYS.DUES, []);
};

// Workers functions
export const saveWorkers = (workers: WorkerRecord[]): void => {
  saveToStorage(STORAGE_KEYS.WORKERS, workers);
};

export const getWorkers = (): WorkerRecord[] => {
  return getFromStorage(STORAGE_KEYS.WORKERS, []);
};

// Deleted transactions functions
export const saveDeletedTransactions = (deletedTransactions: DeletedTransaction[]): void => {
  saveToStorage(STORAGE_KEYS.DELETED_TRANSACTIONS, deletedTransactions);
};

export const getDeletedTransactions = (): DeletedTransaction[] => {
  return getFromStorage(STORAGE_KEYS.DELETED_TRANSACTIONS, []);
};

// Clean up deleted transactions older than 7 days
export const cleanupDeletedTransactions = (): void => {
  const deletedTransactions = getDeletedTransactions();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const cleanedTransactions = deletedTransactions.filter(
    deleted => new Date(deleted.deletedDate) > sevenDaysAgo
  );
  
  saveDeletedTransactions(cleanedTransactions);
};

// Bin functions
export const saveBinItems = (items: BinItem[]): void => {
  saveToStorage('rice_mill_bin', items);
};

export const getBinItems = (): BinItem[] => {
  return getFromStorage('rice_mill_bin', []);
};

export const addToBin = (type: 'transaction' | 'inventory', data: any): void => {
  const binItems = getBinItems();
  const deletedDate = new Date();
  const restoreDeadline = new Date(deletedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const binItem: BinItem = {
    id: Date.now().toString(),
    type,
    data,
    deletedDate: deletedDate.toISOString(),
    restoreDeadline: restoreDeadline.toISOString()
  };
  
  binItems.push(binItem);
  saveBinItems(binItems);
};

export const removeFromBin = (id: string): void => {
  const binItems = getBinItems();
  const updatedItems = binItems.filter(item => item.id !== id);
  saveBinItems(updatedItems);
};

export const cleanupExpiredBinItems = (): void => {
  const binItems = getBinItems();
  const now = new Date();
  const validItems = binItems.filter(item => new Date(item.restoreDeadline) > now);
  saveBinItems(validItems);
};

// Default rates
export const getDefaultRates = () => {
  return getFromStorage(STORAGE_KEYS.RATES, {
    milling: [2.50, 0.50],
    powder: 100.00,
    bigBags: 15.00,
    smallBags: 12.00,
    branBags: 20.00,
    unloading: 10.00,
    loading: 15.00,
    nukalu: 12.00,
    extra: 1.00
  });
};

export const saveRates = (rates: any): void => {
  saveToStorage(STORAGE_KEYS.RATES, rates);
};

// Stock transactions functions
export const saveStockTransactions = (transactions: StockTransaction[]): void => {
  saveToStorage('rice_mill_stock_transactions', transactions);
};

export const getStockTransactions = (): StockTransaction[] => {
  return getFromStorage('rice_mill_stock_transactions', []);
};

// Default stock rates
export const getDefaultStockRates = () => {
  return getFromStorage('rice_mill_stock_rates', {
    'Bran Stock': 25.00,
    'Dhana Stock': 30.00,
    'Nukalu Stock': 12.00,
    'HMT Rice': 45.00,
    'JSR Rice': 50.00,
    'BPT Rice': 48.00
  });
};

export const saveStockRates = (rates: any): void => {
  saveToStorage('rice_mill_stock_rates', rates);
};
