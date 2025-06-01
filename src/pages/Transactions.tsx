
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Calendar, Eye, Trash2 } from 'lucide-react';
import { getTransactions, saveTransactions, getInventory, saveInventory, Transaction } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showTodayTotal, setShowTodayTotal] = useState(false);
  const [showHamali, setShowHamali] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [hamaliTotal, setHamaliTotal] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    const allTransactions = getTransactions();
    const sortedTransactions = allTransactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      
      const timeA = new Date(`1970-01-01 ${a.time}`);
      const timeB = new Date(`1970-01-01 ${b.time}`);
      return timeB.getTime() - timeA.getTime();
    });
    
    setTransactions(sortedTransactions);
  };

  const calculateTodayTotal = () => {
    const today = new Date().toLocaleDateString();
    const todayTransactions = filteredTransactions.filter(t => t.date === today);
    const total = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    setTodayTotal(total);
    setShowTodayTotal(true);
    toast({
      title: "Today's Total Calculated",
      description: `Total: ₹${total.toFixed(2)} from ${todayTransactions.length} transactions`
    });
  };

  const calculateHamali = () => {
    const hamali = filteredTransactions.reduce((sum, transaction) => {
      const loadingCharges = transaction.items
        .filter(item => item.name.toLowerCase().includes('loading'))
        .reduce((itemSum, item) => itemSum + item.total, 0);
      const unloadingCharges = transaction.items
        .filter(item => item.name.toLowerCase().includes('unloading'))
        .reduce((itemSum, item) => itemSum + item.total, 0);
      return sum + loadingCharges + unloadingCharges;
    }, 0);
    
    setHamaliTotal(hamali);
    setShowHamali(true);
    toast({
      title: "Hamali Total Calculated",
      description: `Total Hamali: ₹${hamali.toFixed(2)}`
    });
  };

  const viewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const confirmDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const deleteTransaction = () => {
    if (!transactionToDelete) return;

    // Restore inventory items
    const inventory = getInventory();
    transactionToDelete.items.forEach(item => {
      const inventoryItem = inventory.find(inv => inv.name === item.name);
      if (inventoryItem) {
        inventoryItem.count += item.quantity;
      }
    });
    saveInventory(inventory);

    // Remove transaction
    const updatedTransactions = transactions.filter(t => t.id !== transactionToDelete.id);
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);

    setTransactionToDelete(null);
    toast({
      title: "Transaction Deleted",
      description: "Transaction deleted and inventory restored successfully"
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.phone.includes(searchTerm);

    const matchesDue = !showDueOnly || transaction.dueAmount > 0;

    return matchesSearch && matchesDue;
  });

  const groupedTransactions = filteredTransactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { weekday: 'long' });
    }
  };

  const getTransactionCountForDate = (date: string) => {
    return groupedTransactions[date]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>

        {/* Totals Display */}
        {(showTodayTotal || showHamali) && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-6">
                {showTodayTotal && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Today's Total:</span>
                    <Badge variant="default" className="text-lg">₹{todayTotal.toFixed(2)}</Badge>
                  </div>
                )}
                {showHamali && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Total Hamali:</span>
                    <Badge variant="secondary" className="text-lg">₹{hamaliTotal.toFixed(2)}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant={showDueOnly ? "default" : "outline"}
                onClick={() => setShowDueOnly(!showDueOnly)}
              >
                Show Due Only
              </Button>
              
              <Button
                variant="outline"
                onClick={calculateTodayTotal}
              >
                Calculate Today's Total
              </Button>
              
              <Button
                variant="outline"
                onClick={calculateHamali}
                className="whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calculate Hamali
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-6">
          {Object.keys(groupedTransactions)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((date) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {date} <span className="text-gray-500">{formatDateHeader(date)}</span>
                </h2>
                <Badge variant="outline">
                  {getTransactionCountForDate(date)} transaction{getTransactionCountForDate(date) !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">Customer Name</th>
                      <th className="text-left p-3 font-medium">Village</th>
                      <th className="text-center p-3 font-medium">Amount</th>
                      <th className="text-center p-3 font-medium">Due</th>
                      <th className="text-center p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedTransactions[date].map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{transaction.time}</td>
                        <td className="p-3 font-medium">{transaction.name}</td>
                        <td className="p-3">{transaction.village}</td>
                        <td className="p-3 text-center font-bold">₹{transaction.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          {transaction.dueAmount > 0 ? (
                            <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => viewTransaction(transaction)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => confirmDeleteTransaction(transaction)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No transactions found</div>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Transaction Details Dialog */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Customer Name:</label>
                    <p>{selectedTransaction.name}</p>
                  </div>
                  <div>
                    <label className="font-medium">Village:</label>
                    <p>{selectedTransaction.village}</p>
                  </div>
                  <div>
                    <label className="font-medium">Phone:</label>
                    <p>{selectedTransaction.phone}</p>
                  </div>
                  <div>
                    <label className="font-medium">Date & Time:</label>
                    <p>{selectedTransaction.date} at {selectedTransaction.time}</p>
                  </div>
                </div>
                
                <div>
                  <label className="font-medium">Items:</label>
                  <div className="mt-2 border rounded">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Item</th>
                          <th className="text-center p-2">Quantity</th>
                          <th className="text-center p-2">Rate</th>
                          <th className="text-center p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-center">₹{item.rate.toFixed(2)}</td>
                            <td className="p-2 text-center">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="font-medium">Total Amount:</label>
                    <p className="text-lg font-bold">₹{selectedTransaction.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="font-medium">Paid Amount:</label>
                    <p className="text-lg font-bold text-green-600">₹{selectedTransaction.paidAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="font-medium">Due Amount:</label>
                    <p className="text-lg font-bold text-red-600">₹{selectedTransaction.dueAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This will restore the inventory items back to stock.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteTransaction}>Delete & Restore Inventory</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Transactions;
