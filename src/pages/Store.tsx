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
  getStock, 
  saveStock, 
  getStockTransactions, 
  saveStockTransactions, 
  getDefaultStockRates, 
  saveStockRates,
  StockItem,
  StockTransaction 
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import InventoryMismatch from '@/components/InventoryMismatch';

const Store = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [rates, setRates] = useState<any>({});
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    village: '',
    stockBought: '',
    quantity: '',
    rate: '',
    paidAmount: ''
  });

  useEffect(() => {
    setStock(getStock());
    setTransactions(getStockTransactions());
    setRates(getDefaultStockRates());
  }, []);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    const newTransaction: StockTransaction = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      phoneNumber: formData.phoneNumber,
      village: formData.village,
      stockBought: formData.stockBought,
      quantity: parseFloat(formData.quantity),
      rate: parseFloat(formData.rate),
      totalAmount: parseFloat(formData.quantity) * parseFloat(formData.rate),
      paidAmount: parseFloat(formData.paidAmount),
      dueAmount: (parseFloat(formData.quantity) * parseFloat(formData.rate)) - parseFloat(formData.paidAmount),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveStockTransactions(updatedTransactions);

    // Update stock
    const updatedStock = stock.map(item => {
      if (item.name === formData.stockBought) {
        if (formData.quantity && !isNaN(parseFloat(formData.quantity))) {
          const quantity = parseFloat(formData.quantity);
          if (quantity === 25) {
            return { ...item, kg25: item.kg25 + 1 };
          } else if (quantity === 50) {
            return { ...item, kg50: item.kg50 + 1 };
          }
        }
      }
      return item;
    });
    setStock(updatedStock);
    saveStock(updatedStock);

    setFormData({
      customerName: '',
      phoneNumber: '',
      village: '',
      stockBought: '',
      quantity: '',
      rate: '',
      paidAmount: ''
    });
    setShowAddForm(false);

    toast({
      title: "Success",
      description: "Stock transaction added successfully"
    });
  };

  const handleRateChange = (stockName: string, newRate: number) => {
    const updatedRates = { ...rates, [stockName]: newRate };
    setRates(updatedRates);
    saveStockRates(updatedRates);

    toast({
      title: "Rate Updated",
      description: `${stockName} rate updated to ₹${newRate.toFixed(2)}`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={20} className="mr-2" />
            Add Stock Transaction
          </Button>
        </div>

        {/* Add Inventory Mismatch Component */}
        <InventoryMismatch />

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stock">Current Stock</TabsTrigger>
            <TabsTrigger value="transactions">Stock Transactions</TabsTrigger>
            <TabsTrigger value="rates">Stock Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Current Stock Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stock.map((item) => (
                    <div key={item.name} className="p-4 border rounded-lg">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        25kg Bags: {item.kg25}
                      </div>
                      <div className="text-sm text-gray-600">
                        50kg Bags: {item.kg50}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: {item.kg25 + item.kg50} Bags
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Stock Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="font-medium">{transaction.customerName}</div>
                      <div className="text-sm text-gray-600">
                        {transaction.village} • {transaction.phoneNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaction.stockBought} - {transaction.quantity}kg
                      </div>
                      <div className="text-sm">
                        ₹{transaction.totalAmount.toFixed(2)} (Paid: ₹{transaction.paidAmount.toFixed(2)}, Due: ₹{transaction.dueAmount.toFixed(2)})
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No stock transactions</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <CardTitle>Stock Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stock.map((item) => (
                    <div key={item.name} className="p-4 border rounded-lg">
                      <div className="font-medium">{item.name}</div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Rate"
                          value={rates[item.name] || ''}
                          onChange={(e) => {
                            const newRate = parseFloat(e.target.value);
                            if (!isNaN(newRate)) {
                              handleRateChange(item.name, newRate);
                            }
                          }}
                          className="w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <DollarSign className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Stock Transaction Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Stock Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stockBought">Stock Bought *</Label>
                  <Select value={formData.stockBought} onValueChange={(value) => setFormData({ ...formData, stockBought: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {stock.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity (kg) *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="25"
                    step="25"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Rate per kg *</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <Label htmlFor="paidAmount">Paid Amount *</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex space-x-2 md:col-span-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Add Transaction
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Store;
