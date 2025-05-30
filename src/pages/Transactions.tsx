
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Calculator, Trash2, DollarSign } from 'lucide-react';
import { Transaction, getTransactions, saveTransactions, getDeletedTransactions, saveDeletedTransactions, cleanupDeletedTransactions } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showHamaliCalculator, setShowHamaliCalculator] = useState(false);
  const [showTodayCalculator, setShowTodayCalculator] = useState(false);
  const [selectedForHamali, setSelectedForHamali] = useState<string[]>([]);
  const [selectedForToday, setSelectedForToday] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    setTransactions(getTransactions());
    cleanupDeletedTransactions();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.phone.includes(searchTerm);
    
    if (showDueOnly) {
      return matchesSearch && transaction.dueAmount > 0;
    }
    
    return matchesSearch;
  });

  const deleteTransaction = (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (transactionToDelete) {
      const deletedTransactions = getDeletedTransactions();
      deletedTransactions.push({
        transaction: transactionToDelete,
        deletedDate: new Date().toISOString()
      });
      saveDeletedTransactions(deletedTransactions);
      
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
      
      toast({
        title: "Transaction Deleted",
        description: "Transaction moved to bin for 7 days"
      });
    }
  };

  const calculateHamali = () => {
    const selectedTransactions = transactions.filter(t => selectedForHamali.includes(t.id));
    const totalHamali = selectedTransactions.reduce((sum, transaction) => {
      const loadingItem = transaction.items.find(item => item.name === 'Loading');
      const unloadingItem = transaction.items.find(item => item.name === 'Unloading');
      return sum + (loadingItem?.total || 0) + (unloadingItem?.total || 0);
    }, 0);
    
    return { selectedTransactions, totalHamali };
  };

  const calculateTodayTotal = () => {
    const selectedTransactions = transactions.filter(t => selectedForToday.includes(t.id));
    const totalAmount = selectedTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    
    return { selectedTransactions, totalAmount };
  };

  const handleDuePayment = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const processDuePayment = () => {
    if (!selectedTransaction || paymentAmount <= 0) return;
    
    const updatedTransactions = transactions.map(t => {
      if (t.id === selectedTransaction.id) {
        const newPaidAmount = t.paidAmount + paymentAmount;
        const newDueAmount = Math.max(0, t.totalAmount - newPaidAmount);
        return {
          ...t,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount
        };
      }
      return t;
    });
    
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    setShowPaymentModal(false);
    setSelectedTransaction(null);
    setPaymentAmount(0);
    
    toast({
      title: "Payment Processed",
      description: `₹${paymentAmount} payment recorded successfully`
    });
  };

  const { selectedTransactions: hamaliTransactions, totalHamali } = calculateHamali();
  const { selectedTransactions: todayTransactions, totalAmount: todayTotal } = calculateTodayTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>

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
                onClick={() => setShowDueOnly(!showDueOnly)}
              >
                Show Due Only
              </Button>
              <Button
                variant={showTodayCalculator ? "default" : "outline"}
                onClick={() => setShowTodayCalculator(!showTodayCalculator)}
              >
                Calculate Today's Total
              </Button>
              <Button
                variant={showHamaliCalculator ? "default" : "outline"}
                onClick={() => setShowHamaliCalculator(!showHamaliCalculator)}
              >
                <Calculator size={16} className="mr-2" />
                Calculate Hamali
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hamali Calculator */}
        {showHamaliCalculator && (
          <Card className="mb-6 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Hamali Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hamaliTransactions.map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <div>
                      <div className="font-medium">{transaction.name}</div>
                      <div className="text-sm text-gray-600">{transaction.village} • {transaction.date}</div>
                      <div className="text-sm">
                        Loading: ₹{transaction.items.find(i => i.name === 'Loading')?.total || 0} • 
                        Unloading: ₹{transaction.items.find(i => i.name === 'Unloading')?.total || 0}
                      </div>
                    </div>
                    <div className="font-bold text-blue-800">
                      ₹{(transaction.items.find(i => i.name === 'Loading')?.total || 0) + 
                         (transaction.items.find(i => i.name === 'Unloading')?.total || 0)}
                    </div>
                  </div>
                ))}
                <div className="text-center p-4 bg-blue-100 rounded">
                  <div className="text-2xl font-bold text-blue-800">
                    Total Hamali: ₹{totalHamali.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Total Calculator */}
        {showTodayCalculator && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Today's Total Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayTransactions.map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <div>
                      <div className="font-medium">{transaction.name}</div>
                      <div className="text-sm text-gray-600">{transaction.village} • {transaction.time}</div>
                    </div>
                    <div className="font-bold text-green-800">₹{transaction.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
                <div className="text-center p-4 bg-green-100 rounded">
                  <div className="text-2xl font-bold text-green-800">
                    Total Income: ₹{todayTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{transaction.name}</CardTitle>
                    <div className="text-sm text-gray-600">
                      {transaction.village} • {transaction.phone} • {transaction.date} at {transaction.time}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {transaction.dueAmount > 0 && (
                      <Badge variant="destructive">Due: ₹{transaction.dueAmount.toFixed(2)}</Badge>
                    )}
                    {showHamaliCalculator && (
                      <Button
                        size="sm"
                        variant={selectedForHamali.includes(transaction.id) ? "default" : "outline"}
                        onClick={() => {
                          if (selectedForHamali.includes(transaction.id)) {
                            setSelectedForHamali(selectedForHamali.filter(id => id !== transaction.id));
                          } else {
                            setSelectedForHamali([...selectedForHamali, transaction.id]);
                          }
                        }}
                      >
                        Select for Hamali
                      </Button>
                    )}
                    {showTodayCalculator && (
                      <Button
                        size="sm"
                        variant={selectedForToday.includes(transaction.id) ? "default" : "outline"}
                        onClick={() => {
                          if (selectedForToday.includes(transaction.id)) {
                            setSelectedForToday(selectedForToday.filter(id => id !== transaction.id));
                          } else {
                            setSelectedForToday([...selectedForToday, transaction.id]);
                          }
                        }}
                      >
                        Select for Total
                      </Button>
                    )}
                    {transaction.dueAmount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuePayment(transaction)}
                      >
                        <DollarSign size={16} className="mr-1" />
                        Pay Due
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTransaction(transaction.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                    <div className="font-bold">₹{transaction.totalAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Paid Amount</div>
                    <div className="font-bold text-green-600">₹{transaction.paidAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Due Amount</div>
                    <div className="font-bold text-red-600">₹{transaction.dueAmount.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item</th>
                        <th className="text-left p-2">Rate</th>
                        <th className="text-left p-2">Quantity</th>
                        <th className="text-left p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">₹{item.rate.toFixed(2)}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No transactions found</div>
          </div>
        )}

        {/* Due Payment Modal */}
        {showPaymentModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Process Due Payment</CardTitle>
                <div className="text-sm text-gray-600">
                  Customer: {selectedTransaction.name}<br/>
                  Due Amount: ₹{selectedTransaction.dueAmount.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Amount</label>
                    <Input
                      type="number"
                      min="0"
                      max={selectedTransaction.dueAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Enter payment amount"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={processDuePayment} className="flex-1">
                      Process Payment
                    </Button>
                    <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
