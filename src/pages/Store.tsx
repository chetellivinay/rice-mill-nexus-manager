
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Package, Eye, Trash2 } from 'lucide-react';
import { 
  getInventory, 
  saveInventory, 
  getStock, 
  saveStock, 
  getStockTransactions, 
  saveStockTransactions, 
  getDefaultStockRates, 
  saveStockRates,
  InventoryItem,
  StockItem,
  StockTransaction 
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import InventoryMismatch from '@/components/InventoryMismatch';

const Store = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [stockRates, setStockRates] = useState<any>({});
  const [showRecordSaleForm, setShowRecordSaleForm] = useState(false);
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '', count: 0 });
  const [newStockItem, setNewStockItem] = useState({ name: '', kg25: 0, kg50: 0 });
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    village: '',
    phoneNumber: '',
    stockItem: '',
    quantity: '',
    rate: '',
    paidAmount: ''
  });

  useEffect(() => {
    setInventory(getInventory());
    setStock(getStock());
    setStockTransactions(getStockTransactions());
    setStockRates(getDefaultStockRates());
  }, []);

  // Calculate total amount and due amount when form changes
  const totalAmount = saleForm.quantity && saleForm.rate ? 
    parseFloat(saleForm.quantity) * parseFloat(saleForm.rate) : 0;
  const paidAmount = parseFloat(saleForm.paidAmount) || 0;
  const dueAmount = totalAmount - paidAmount;

  const updateInventoryCount = (itemName: string, newCount: number) => {
    const updatedInventory = inventory.map(item =>
      item.name === itemName
        ? { ...item, count: Math.max(0, newCount) }
        : item
    );
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  };

  const updateStockCount = (itemName: string, type: 'kg25' | 'kg50', newCount: number) => {
    const updatedStock = stock.map(item =>
      item.name === itemName
        ? { ...item, [type]: Math.max(0, newCount) }
        : item
    );
    setStock(updatedStock);
    saveStock(updatedStock);
  };

  const addInventoryItem = () => {
    if (newInventoryItem.name.trim()) {
      const updatedInventory = [...inventory, newInventoryItem];
      setInventory(updatedInventory);
      saveInventory(updatedInventory);
      setNewInventoryItem({ name: '', count: 0 });
      toast({
        title: "Success",
        description: "Inventory item added successfully"
      });
    }
  };

  const addStockItem = () => {
    if (newStockItem.name.trim()) {
      const updatedStock = [...stock, newStockItem];
      setStock(updatedStock);
      saveStock(updatedStock);
      setNewStockItem({ name: '', kg25: 0, kg50: 0 });
      toast({
        title: "Success",
        description: "Stock item added successfully"
      });
    }
  };

  const recordSale = () => {
    if (saleForm.customerName && saleForm.stockItem && saleForm.quantity && saleForm.rate) {
      const newTransaction: StockTransaction = {
        id: Date.now().toString(),
        customerName: saleForm.customerName,
        phoneNumber: saleForm.phoneNumber,
        village: saleForm.village,
        stockBought: saleForm.stockItem,
        quantity: parseFloat(saleForm.quantity),
        rate: parseFloat(saleForm.rate),
        totalAmount,
        paidAmount,
        dueAmount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };

      const updatedTransactions = [...stockTransactions, newTransaction];
      setStockTransactions(updatedTransactions);
      saveStockTransactions(updatedTransactions);

      // Update stock count
      const quantity = parseFloat(saleForm.quantity);
      const updatedStock = stock.map(item => {
        if (item.name === saleForm.stockItem) {
          if (quantity === 25) {
            return { ...item, kg25: Math.max(0, item.kg25 - 1) };
          } else if (quantity === 50) {
            return { ...item, kg50: Math.max(0, item.kg50 - 1) };
          }
        }
        return item;
      });
      setStock(updatedStock);
      saveStock(updatedStock);

      setSaleForm({
        customerName: '',
        village: '',
        phoneNumber: '',
        stockItem: '',
        quantity: '',
        rate: '',
        paidAmount: ''
      });
      setShowRecordSaleForm(false);

      toast({
        title: "Success",
        description: "Stock sale recorded successfully"
      });
    }
  };

  const updateStockRate = (itemName: string, newRate: number) => {
    const updatedRates = { ...stockRates, [itemName]: newRate };
    setStockRates(updatedRates);
    saveStockRates(updatedRates);
  };

  const calculateTotalValue = () => {
    return stock.reduce((total, item) => {
      const rate = stockRates[item.name] || 0;
      const totalWeight = (item.kg25 * 25) + (item.kg50 * 50);
      return total + (totalWeight * rate);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Store Management</h1>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <CardTitle>Inventory Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  {inventory.map((item) => (
                    <div key={item.name} className="text-center">
                      <h3 className="font-medium text-lg mb-2">{item.name}</h3>
                      <div className="text-3xl font-bold text-blue-600 mb-4">{item.count}</div>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.count}
                          onChange={(e) => updateInventoryCount(item.name, parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInventoryCount(item.name, item.count - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInventoryCount(item.name, item.count + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Inventory Item</h3>
                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="itemName">Item Name</Label>
                      <Input
                        id="itemName"
                        placeholder="Enter item name"
                        value={newInventoryItem.name}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, name: e.target.value })}
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor="initialCount">Initial Count</Label>
                      <Input
                        id="initialCount"
                        type="number"
                        min="0"
                        value={newInventoryItem.count}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={addInventoryItem} className="bg-slate-900 hover:bg-slate-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <InventoryMismatch />
            </div>
          </TabsContent>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-500" />
                    <CardTitle>Stock Management</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Valuation</div>
                    <div className="text-2xl font-bold text-green-600">₹{calculateTotalValue().toFixed(2)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium">Stock Item</th>
                        <th className="text-center p-3 font-medium">25kg Packages</th>
                        <th className="text-center p-3 font-medium">50kg Packages</th>
                        <th className="text-center p-3 font-medium">Total Weight (kg)</th>
                        <th className="text-center p-3 font-medium">Rate per kg (₹)</th>
                        <th className="text-center p-3 font-medium">Total Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map((item) => {
                        const totalWeight = (item.kg25 * 25) + (item.kg50 * 50);
                        const rate = stockRates[item.name] || 0;
                        const totalValue = totalWeight * rate;
                        
                        return (
                          <tr key={item.name} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockCount(item.name, 'kg25', item.kg25 - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.kg25}
                                  onChange={(e) => updateStockCount(item.name, 'kg25', parseInt(e.target.value) || 0)}
                                  className="w-16 text-center"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockCount(item.name, 'kg25', item.kg25 + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockCount(item.name, 'kg50', item.kg50 - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.kg50}
                                  onChange={(e) => updateStockCount(item.name, 'kg50', parseInt(e.target.value) || 0)}
                                  className="w-16 text-center"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockCount(item.name, 'kg50', item.kg50 + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 text-center font-medium">{totalWeight} kg</td>
                            <td className="p-3 text-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={rate}
                                onChange={(e) => updateStockRate(item.name, parseFloat(e.target.value) || 0)}
                                className="w-16 text-center"
                              />
                            </td>
                            <td className="p-3 text-center font-bold text-green-600">₹{totalValue.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Stock Item</h3>
                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="stockName">Stock Item Name</Label>
                      <Input
                        id="stockName"
                        placeholder="Enter stock name"
                        value={newStockItem.name}
                        onChange={(e) => setNewStockItem({ ...newStockItem, name: e.target.value })}
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor="kg25Packages">25kg Packages</Label>
                      <Input
                        id="kg25Packages"
                        type="number"
                        min="0"
                        value={newStockItem.kg25}
                        onChange={(e) => setNewStockItem({ ...newStockItem, kg25: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor="kg50Packages">50kg Packages</Label>
                      <Input
                        id="kg50Packages"
                        type="number"
                        min="0"
                        value={newStockItem.kg50}
                        onChange={(e) => setNewStockItem({ ...newStockItem, kg50: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={addStockItem} className="bg-slate-900 hover:bg-slate-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stock
                    </Button>
                  </div>
                </div>

                <div className="mt-8 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Stock Sales</h3>
                    <Button 
                      onClick={() => setShowRecordSaleForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Record Sale
                    </Button>
                  </div>

                  {showRecordSaleForm && (
                    <Card className="mb-6">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Record Stock Sale</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customerName">Customer Name *</Label>
                            <Input
                              id="customerName"
                              value={saleForm.customerName}
                              onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <Input
                              id="phoneNumber"
                              value={saleForm.phoneNumber}
                              onChange={(e) => setSaleForm({ ...saleForm, phoneNumber: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="village">Village</Label>
                            <Input
                              id="village"
                              value={saleForm.village}
                              onChange={(e) => setSaleForm({ ...saleForm, village: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="stockItem">Stock Item *</Label>
                            <Select value={saleForm.stockItem} onValueChange={(value) => setSaleForm({ ...saleForm, stockItem: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Stock Item" />
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
                              value={saleForm.quantity}
                              onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="rate">Rate per kg (₹) *</Label>
                            <Input
                              id="rate"
                              type="number"
                              step="0.01"
                              value={saleForm.rate}
                              onChange={(e) => setSaleForm({ ...saleForm, rate: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
                            <Input
                              id="paidAmount"
                              type="number"
                              step="0.01"
                              value={saleForm.paidAmount}
                              onChange={(e) => setSaleForm({ ...saleForm, paidAmount: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="font-medium">Total Amount:</Label>
                              <p className="text-lg font-bold">₹{totalAmount.toFixed(2)}</p>
                            </div>
                            <div>
                              <Label className="font-medium text-green-600">Paid Amount:</Label>
                              <p className="text-lg font-bold text-green-600">₹{paidAmount.toFixed(2)}</p>
                            </div>
                            <div>
                              <Label className="font-medium text-red-600">Due Amount:</Label>
                              <p className="text-lg font-bold text-red-600">₹{dueAmount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <Button onClick={recordSale} className="bg-green-600 hover:bg-green-700">
                            Record Sale
                          </Button>
                          <Button variant="outline" onClick={() => setShowRecordSaleForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">Time</th>
                          <th className="text-left p-3 font-medium">Customer</th>
                          <th className="text-left p-3 font-medium">Village</th>
                          <th className="text-left p-3 font-medium">Stock</th>
                          <th className="text-center p-3 font-medium">Amount</th>
                          <th className="text-center p-3 font-medium">Due</th>
                          <th className="text-center p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-gray-500">
                              No stock sales recorded yet
                            </td>
                          </tr>
                        ) : (
                          stockTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">{transaction.time}</td>
                              <td className="p-3">{transaction.customerName}</td>
                              <td className="p-3">{transaction.village}</td>
                              <td className="p-3">{transaction.stockBought} ({transaction.quantity}kg)</td>
                              <td className="p-3 text-center">₹{transaction.totalAmount.toFixed(2)}</td>
                              <td className="p-3 text-center">
                                {transaction.dueAmount > 0 ? (
                                  <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                                ) : (
                                  <Badge variant="default">Paid</Badge>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Store;
