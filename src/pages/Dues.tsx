
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign } from 'lucide-react';
import { 
  getTransactions, 
  saveTransactions, 
  getDues, 
  saveDues, 
  getStockTransactions,
  saveStockTransactions,
  DueRecord,
  StockTransaction 
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Dues = () => {
  const [transactionDues, setTransactionDues] = useState<any[]>([]);
  const [stockDues, setStockDues] = useState<StockTransaction[]>([]);
  const [customDues, setCustomDues] = useState<DueRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    customerName: '',
    type: 'custom' as 'bran' | 'rice' | 'custom',
    stockType: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    // Load transaction dues
    const transactions = getTransactions();
    const dueTransactions = transactions.filter(t => t.dueAmount > 0);
    setTransactionDues(dueTransactions);
    
    // Load stock dues
    const stockTransactions = getStockTransactions();
    const stockDueTransactions = stockTransactions.filter(t => t.dueAmount > 0);
    setStockDues(stockDueTransactions);
    
    // Load custom dues
    setCustomDues(getDues());
  }, []);

  const handleAddDue = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDue: DueRecord = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      type: formData.type,
      stockType: formData.stockType || undefined,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: new Date().toLocaleDateString()
    };

    const updatedDues = [...customDues, newDue];
    setCustomDues(updatedDues);
    saveDues(updatedDues);
    
    setFormData({
      customerName: '',
      type: 'custom',
      stockType: '',
      amount: '',
      description: ''
    });
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Due record added successfully"
    });
  };

  const handlePayTransactionDue = (transactionId: string, paymentAmount: number) => {
    const transactions = getTransactions();
    const updatedTransactions = transactions.map(t => {
      if (t.id === transactionId) {
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
    
    saveTransactions(updatedTransactions);
    setTransactionDues(updatedTransactions.filter(t => t.dueAmount > 0));
    
    toast({
      title: "Payment Processed",
      description: `₹${paymentAmount} payment recorded successfully`
    });
  };

  const handlePayStockDue = (transactionId: string, paymentAmount: number) => {
    const stockTransactions = getStockTransactions();
    const updatedTransactions = stockTransactions.map(t => {
      if (t.id === transactionId) {
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
    
    saveStockTransactions(updatedTransactions);
    setStockDues(updatedTransactions.filter(t => t.dueAmount > 0));
    
    toast({
      title: "Payment Processed",
      description: `₹${paymentAmount} payment recorded for stock transaction`
    });
  };

  const clearCustomDue = (dueId: string) => {
    const updatedDues = customDues.filter(d => d.id !== dueId);
    setCustomDues(updatedDues);
    saveDues(updatedDues);
    
    toast({
      title: "Due Cleared",
      description: "Due has been removed successfully"
    });
  };

  const getTotalDues = () => {
    const transactionTotal = transactionDues.reduce((sum, t) => sum + t.dueAmount, 0);
    const stockTotal = stockDues.reduce((sum, t) => sum + t.dueAmount, 0);
    const customTotal = customDues.reduce((sum, d) => sum + d.amount, 0);
    return transactionTotal + stockTotal + customTotal;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dues Management</h1>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={20} className="mr-2" />
            Add Due Record
          </Button>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">₹{getTotalDues().toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Dues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{transactionDues.length}</div>
                <div className="text-sm text-gray-600">Transaction Dues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stockDues.length}</div>
                <div className="text-sm text-gray-600">Stock Dues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{customDues.length}</div>
                <div className="text-sm text-gray-600">Custom Dues</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Due Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Due Record</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDue} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Due Type *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bran">Bran Stock</SelectItem>
                      <SelectItem value="rice">Rice Stock</SelectItem>
                      <SelectItem value="custom">Custom Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData.type === 'bran' || formData.type === 'rice') && (
                  <div>
                    <Label htmlFor="stockType">Stock Type</Label>
                    <Input
                      id="stockType"
                      value={formData.stockType}
                      onChange={(e) => setFormData({...formData, stockType: e.target.value})}
                      placeholder="e.g., HMT Rice, JSR Rice, Bran"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional details about this due"
                  />
                </div>
                <div className="flex space-x-2 md:col-span-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Add Due Record
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="transaction" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transaction">Transaction Dues</TabsTrigger>
            <TabsTrigger value="stock">Stock Dues</TabsTrigger>
            <TabsTrigger value="custom">Custom Dues</TabsTrigger>
          </TabsList>

          <TabsContent value="transaction">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Dues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionDues.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{transaction.name}</div>
                        <div className="text-sm text-gray-600">
                          {transaction.village} • {transaction.phone} • {transaction.date}
                        </div>
                        <div className="text-sm">
                          Total: ₹{transaction.totalAmount.toFixed(2)} • 
                          Paid: ₹{transaction.paidAmount.toFixed(2)} • 
                          Due: ₹{transaction.dueAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max={transaction.dueAmount}
                          step="0.01"
                          placeholder="Payment amount"
                          value={paymentAmounts[transaction.id] || ''}
                          onChange={(e) => setPaymentAmounts({
                            ...paymentAmounts,
                            [transaction.id]: e.target.value
                          })}
                          className="w-32 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const amount = parseFloat(paymentAmounts[transaction.id] || '0');
                            if (amount > 0) {
                              handlePayTransactionDue(transaction.id, amount);
                              setPaymentAmounts({...paymentAmounts, [transaction.id]: ''});
                            }
                          }}
                        >
                          Pay
                        </Button>
                        <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                      </div>
                    </div>
                  ))}
                  {transactionDues.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No transaction dues</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Stock Dues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockDues.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{transaction.customerName}</div>
                        <div className="text-sm text-gray-600">
                          {transaction.village} • {transaction.phoneNumber} • {transaction.date}
                        </div>
                        <div className="text-sm">
                          Stock: {transaction.stockBought} ({transaction.quantity}kg) • 
                          Total: ₹{transaction.totalAmount.toFixed(2)} • 
                          Paid: ₹{transaction.paidAmount.toFixed(2)} • 
                          Due: ₹{transaction.dueAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max={transaction.dueAmount}
                          step="0.01"
                          placeholder="Payment amount"
                          value={paymentAmounts[transaction.id] || ''}
                          onChange={(e) => setPaymentAmounts({
                            ...paymentAmounts,
                            [transaction.id]: e.target.value
                          })}
                          className="w-32 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const amount = parseFloat(paymentAmounts[transaction.id] || '0');
                            if (amount > 0) {
                              handlePayStockDue(transaction.id, amount);
                              setPaymentAmounts({...paymentAmounts, [transaction.id]: ''});
                            }
                          }}
                        >
                          Pay
                        </Button>
                        <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                      </div>
                    </div>
                  ))}
                  {stockDues.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No stock dues</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Custom Dues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customDues.map((due) => (
                    <div key={due.id} className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{due.customerName}</div>
                        <div className="text-sm text-gray-600">
                          {due.type === 'bran' ? 'Bran Stock' : due.type === 'rice' ? 'Rice Stock' : 'Custom Due'}
                          {due.stockType && ` - ${due.stockType}`}
                        </div>
                        <div className="text-sm text-gray-600">{due.description}</div>
                        <div className="text-xs text-gray-500">{due.date}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => clearCustomDue(due.id)}
                        >
                          Clear Due
                        </Button>
                        <Badge variant="secondary">₹{due.amount.toFixed(2)}</Badge>
                      </div>
                    </div>
                  ))}
                  {customDues.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No custom dues</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dues;
