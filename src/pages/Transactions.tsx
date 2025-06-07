
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import InventoryMismatch from '@/components/InventoryMismatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Calculator, Trash2, Eye, CalendarDays } from 'lucide-react';
import { Transaction, getTransactions, saveTransactions, addToBin, getInventory, saveInventory } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showHamaliCalculator, setShowHamaliCalculator] = useState(false);
  const [showTodayCalculator, setShowTodayCalculator] = useState(false);
  const [selectedForHamali, setSelectedForHamali] = useState<string[]>([]);
  const [selectedForToday, setSelectedForToday] = useState<string[]>([]);
  const [selectedDayForBulk, setSelectedDayForBulk] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInventoryRestoreDialog, setShowInventoryRestoreDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.phone.includes(searchTerm);
    
    return showDueOnly ? (matchesSearch && transaction.dueAmount > 0) : matchesSearch;
  });

  const parseTransactionDate = (dateString: string) => {
    try {
      // Handle MM/DD/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
      return new Date(dateString);
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date();
    }
  };

  // Group transactions by date with most recent dates first
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = parseTransactionDate(a);
    const dateB = parseTransactionDate(b);
    return dateB.getTime() - dateA.getTime();
  });

  const restoreInventory = (transaction: Transaction) => {
    const inventory = getInventory();
    let restoredItems = 0;
    
    transaction.items.forEach(item => {
      const inventoryItem = inventory.find(inv => inv.name === item.name);
      
      if (inventoryItem && item.quantity > 0) {
        inventoryItem.count += item.quantity;
        restoredItems++;
        console.log(`Successfully restored ${item.quantity} ${item.name} to inventory`);
      } else {
        console.log(`Could not restore ${item.name} - inventory item not found or quantity is 0`);
      }
    });
    
    if (restoredItems > 0) {
      saveInventory(inventory);
      toast({
        title: "Inventory Restored",
        description: `${restoredItems} inventory items have been restored`
      });
    } else {
      toast({
        title: "No Items Restored",
        description: "No eligible inventory items found to restore",
        variant: "destructive"
      });
    }
  };

  const deleteTransaction = (id: string, shouldRestoreInventory: boolean = false) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (transactionToDelete) {
      if (shouldRestoreInventory) {
        restoreInventory(transactionToDelete);
      }
      
      addToBin('transaction', transactionToDelete);
      
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
      
      setShowDeleteDialog(false);
      setShowInventoryRestoreDialog(false);
      setTransactionToDelete(null);
      
      toast({
        title: "Transaction Deleted",
        description: "Transaction moved to bin for 7 days"
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    setShowInventoryRestoreDialog(true);
  };

  const calculateHamali = () => {
    const selectedTransactions = transactions.filter(t => selectedForHamali.includes(t.id));
    return selectedTransactions.reduce((sum, transaction) => {
      const loadingItem = transaction.items.find(item => item.name === 'Loading');
      const unloadingItem = transaction.items.find(item => item.name === 'Unloading');
      return sum + (loadingItem?.total || 0) + (unloadingItem?.total || 0);
    }, 0);
  };

  const calculateTodayTotal = () => {
    const selectedTransactions = transactions.filter(t => selectedForToday.includes(t.id));
    return selectedTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
  };

  const selectAllForDay = (date: string, type: 'hamali' | 'today') => {
    const dayTransactions = groupedTransactions[date] || [];
    const transactionIds = dayTransactions.map(t => t.id);
    
    if (type === 'hamali') {
      setSelectedForHamali(prev => [...new Set([...prev, ...transactionIds])]);
    } else {
      setSelectedForToday(prev => [...new Set([...prev, ...transactionIds])]);
    }
  };

  const viewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDialog(true);
  };

  const toggleHamaliSelection = (id: string) => {
    setSelectedForHamali(prev => 
      prev.includes(id) ? prev.filter(txId => txId !== id) : [...prev, id]
    );
  };

  const toggleTodaySelection = (id: string) => {
    setSelectedForToday(prev => 
      prev.includes(id) ? prev.filter(txId => txId !== id) : [...prev, id]
    );
  };

  const getDayName = (dateString: string) => {
    try {
      const date = parseTransactionDate(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch (error) {
      return '';
    }
  };

  const getDateDisplayText = (dateString: string) => {
    try {
      const date = parseTransactionDate(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dateOnly = date.toDateString();
      const todayOnly = today.toDateString();
      const yesterdayOnly = yesterday.toDateString();
      
      if (dateOnly === todayOnly) {
        return `Today (${dateString})`;
      } else if (dateOnly === yesterdayOnly) {
        return `Yesterday (${dateString})`;
      } else {
        return dateString;
      }
    } catch (error) {
      return dateString;
    }
  };

  const resetCalculators = () => {
    setShowTodayCalculator(false);
    setShowHamaliCalculator(false);
    setSelectedForToday([]);
    setSelectedForHamali([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>

        {/* Inventory Mismatch Management */}
        <InventoryMismatch />

        {/* Calculator Results - Moved to top */}
        {(showHamaliCalculator && selectedForHamali.length > 0) && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">
                  Total Hamali: ₹{calculateHamali().toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Selected {selectedForHamali.length} transactions
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(showTodayCalculator && selectedForToday.length > 0) && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">
                  Today's Total: ₹{calculateTodayTotal().toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Selected {selectedForToday.length} transactions
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant={showDueOnly ? "default" : "outline"}
                onClick={() => {
                  setShowDueOnly(!showDueOnly);
                  if (!showDueOnly) {
                    resetCalculators();
                  }
                }}
              >
                Show Due Only
              </Button>
              <Button
                variant={showTodayCalculator ? "default" : "outline"}
                onClick={() => setShowTodayCalculator(!showTodayCalculator)}
                disabled={showDueOnly}
              >
                Calculate Today's Total
              </Button>
              <Button
                variant={showHamaliCalculator ? "default" : "outline"}
                onClick={() => setShowHamaliCalculator(!showHamaliCalculator)}
                disabled={showDueOnly}
              >
                <Calculator size={16} className="mr-2" />
                Calculate Hamali
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Grouped by Date (Most Recent First) */}
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayName = getDayName(date);
            const dayTransactions = groupedTransactions[date];
            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{getDateDisplayText(date)}</CardTitle>
                      {dayName && <Badge variant="secondary">{dayName}</Badge>}
                      <Badge variant="outline">{dayTransactions.length} transactions</Badge>
                    </div>
                    <div className="flex gap-2">
                      {(showHamaliCalculator || showTodayCalculator) && (
                        <div className="flex gap-2">
                          {showHamaliCalculator && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectAllForDay(date, 'hamali')}
                            >
                              <CalendarDays size={16} className="mr-1" />
                              Select Day (Hamali)
                            </Button>
                          )}
                          {showTodayCalculator && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectAllForDay(date, 'today')}
                            >
                              <CalendarDays size={16} className="mr-1" />
                              Select Day (Total)
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Village</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due</TableHead>
                          {(showHamaliCalculator || showTodayCalculator) && (
                            <TableHead>Select</TableHead>
                          )}
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayTransactions
                          .sort((a, b) => b.time.localeCompare(a.time))
                          .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.time}</TableCell>
                            <TableCell className="font-medium">{transaction.name}</TableCell>
                            <TableCell>{transaction.village}</TableCell>
                            <TableCell>₹{transaction.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              {transaction.dueAmount > 0 && (
                                <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                              )}
                            </TableCell>
                            {(showHamaliCalculator || showTodayCalculator) && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  {showHamaliCalculator && (
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={selectedForHamali.includes(transaction.id)}
                                        onCheckedChange={() => toggleHamaliSelection(transaction.id)}
                                      />
                                      <span className="text-sm">Hamali</span>
                                    </div>
                                  )}
                                  {showTodayCalculator && (
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={selectedForToday.includes(transaction.id)}
                                        onCheckedChange={() => toggleTodaySelection(transaction.id)}
                                      />
                                      <span className="text-sm">Today</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewTransaction(transaction)}
                                >
                                  <Eye size={16} className="mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(transaction.id)}
                                >
                                  <Trash2 size={16} className="mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No transactions found</div>
          </div>
        )}

        {/* Transaction Details Dialog */}
        {showTransactionDialog && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <div className="text-sm text-gray-600">
                  {selectedTransaction.name} • {selectedTransaction.village} • {selectedTransaction.date} at {selectedTransaction.time}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Phone</div>
                      <div className="font-medium">{selectedTransaction.phone}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="font-bold">₹{selectedTransaction.totalAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Paid Amount</div>
                      <div className="font-bold text-green-600">₹{selectedTransaction.paidAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Due Amount</div>
                      <div className="font-bold text-red-600">₹{selectedTransaction.dueAmount.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left">Item</th>
                          <th className="border border-gray-300 p-3 text-left">Rate</th>
                          <th className="border border-gray-300 p-3 text-left">Quantity</th>
                          <th className="border border-gray-300 p-3 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-3">{item.name}</td>
                            <td className="border border-gray-300 p-3">₹{item.rate.toFixed(2)}</td>
                            <td className="border border-gray-300 p-3">{item.quantity}</td>
                            <td className="border border-gray-300 p-3">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setShowTransactionDialog(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? It will be moved to the bin for 7 days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Inventory Restore Dialog */}
        <AlertDialog open={showInventoryRestoreDialog} onOpenChange={setShowInventoryRestoreDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Inventory</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to restore the inventory items used in this transaction back to the inventory?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => transactionToDelete && deleteTransaction(transactionToDelete, false)}>
                No
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => transactionToDelete && deleteTransaction(transactionToDelete, true)}>
                Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Transactions;
