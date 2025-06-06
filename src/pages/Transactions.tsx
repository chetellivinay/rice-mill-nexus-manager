
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Eye, Trash2, Calculator, DollarSign } from 'lucide-react';
import { 
  Transaction,
  getTransactions, 
  saveTransactions,
  getInventory,
  saveInventory,
  addToBin 
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [todaysTotal, setTodaysTotal] = useState(0);
  const [totalHamali, setTotalHamali] = useState(0);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.phone.includes(searchTerm) ||
                         transaction.village.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate ? transaction.date === selectedDate : true;
    return matchesSearch && matchesDate;
  });

  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const calculateTodaysTotal = () => {
    const today = new Date().toLocaleDateString();
    const todayTransactions = transactions.filter(t => t.date === today);
    const total = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    setTodaysTotal(total);
    toast({
      title: "Today's Total Calculated",
      description: `Total: ₹${total.toFixed(2)}`
    });
  };

  const calculateTotalHamali = () => {
    const selectedTransactions = selectedDate 
      ? transactions.filter(t => t.date === selectedDate)
      : transactions;
    
    const hamali = selectedTransactions.reduce((sum, transaction) => {
      return sum + transaction.items.reduce((itemSum, item) => {
        if (item.name.toLowerCase().includes('unloading') || 
            item.name.toLowerCase().includes('loading') ||
            item.name.toLowerCase().includes('hamali')) {
          return itemSum + item.total;
        }
        return itemSum;
      }, 0);
    }, 0);
    
    setTotalHamali(hamali);
    toast({
      title: "Hamali Total Calculated",
      description: `Total Hamali: ₹${hamali.toFixed(2)}`
    });
  };

  const deleteTransaction = (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (transactionToDelete) {
      // Restore inventory items
      const inventory = getInventory();
      transactionToDelete.items.forEach(item => {
        const inventoryItem = inventory.find(inv => inv.name === item.name);
        if (inventoryItem) {
          inventoryItem.count += item.quantity;
        }
      });
      saveInventory(inventory);

      // Move to bin
      addToBin('transaction', transactionToDelete);
      
      // Remove from transactions
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
      
      toast({
        title: "Transaction Deleted",
        description: "Transaction moved to bin and inventory restored"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transactions</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Total</p>
                  <p className="text-2xl font-bold text-green-600">₹{todaysTotal.toFixed(2)}</p>
                </div>
                <Button onClick={calculateTodaysTotal} size="sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Hamali</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalHamali.toFixed(2)}</p>
                </div>
                <Button onClick={calculateTotalHamali} size="sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, or village..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button variant="outline" onClick={() => {setSearchTerm(''); setSelectedDate('');}}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-6">
          {Object.keys(groupedTransactions).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedTransactions)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateTransactions]) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{date}</span>
                      <Badge variant="outline">
                        {dateTransactions.length} transaction{dateTransactions.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3 text-left">Time</th>
                            <th className="border border-gray-300 p-3 text-left">Customer</th>
                            <th className="border border-gray-300 p-3 text-left">Village</th>
                            <th className="border border-gray-300 p-3 text-center">Items</th>
                            <th className="border border-gray-300 p-3 text-center">Amount</th>
                            <th className="border border-gray-300 p-3 text-center">Due</th>
                            <th className="border border-gray-300 p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateTransactions
                            .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
                            .map((transaction) => (
                              <tr key={transaction.id}>
                                <td className="border border-gray-300 p-3">{transaction.time}</td>
                                <td className="border border-gray-300 p-3">
                                  <div>
                                    <div className="font-medium">{transaction.name}</div>
                                    <div className="text-sm text-gray-600">{transaction.phone}</div>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-3">{transaction.village}</td>
                                <td className="border border-gray-300 p-3 text-center">
                                  <Badge variant="outline">{transaction.items.length}</Badge>
                                </td>
                                <td className="border border-gray-300 p-3 text-center">₹{transaction.totalAmount.toFixed(2)}</td>
                                <td className="border border-gray-300 p-3 text-center">
                                  {transaction.dueAmount > 0 ? (
                                    <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                                  ) : (
                                    <Badge variant="default">Paid</Badge>
                                  )}
                                </td>
                                <td className="border border-gray-300 p-3 text-center">
                                  <div className="flex space-x-2 justify-center">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={() => setSelectedTransaction(transaction)}>
                                          <Eye size={16} className="mr-1" />
                                          View
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Transaction Details</DialogTitle>
                                        </DialogHeader>
                                        {selectedTransaction && (
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div><strong>Customer:</strong> {selectedTransaction.name}</div>
                                              <div><strong>Phone:</strong> {selectedTransaction.phone}</div>
                                              <div><strong>Village:</strong> {selectedTransaction.village}</div>
                                              <div><strong>Date:</strong> {selectedTransaction.date}</div>
                                              <div><strong>Time:</strong> {selectedTransaction.time}</div>
                                              <div><strong>Total Amount:</strong> ₹{selectedTransaction.totalAmount.toFixed(2)}</div>
                                              <div><strong>Paid Amount:</strong> ₹{selectedTransaction.paidAmount.toFixed(2)}</div>
                                              <div><strong>Due Amount:</strong> ₹{selectedTransaction.dueAmount.toFixed(2)}</div>
                                            </div>
                                            <div>
                                              <strong>Items:</strong>
                                              <div className="mt-2 border rounded">
                                                <table className="w-full">
                                                  <thead>
                                                    <tr className="bg-gray-50">
                                                      <th className="p-2 text-left">Item</th>
                                                      <th className="p-2 text-center">Quantity</th>
                                                      <th className="p-2 text-center">Rate</th>
                                                      <th className="p-2 text-center">Total</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {selectedTransaction.items.map((item, index) => (
                                                      <tr key={index}>
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
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => deleteTransaction(transaction.id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
