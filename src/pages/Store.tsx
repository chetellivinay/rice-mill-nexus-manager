import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import InventoryMismatch from '@/components/InventoryMismatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, Archive, Eye, Trash2, History } from 'lucide-react';
import { 
  InventoryItem, 
  StockItem, 
  StockTransaction,
  getInventory, 
  saveInventory, 
  getStock, 
  saveStock,
  getStockTransactions,
  saveStockTransactions,
  getDefaultStockRates,
  saveStockRates,
  addToBin 
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

interface InventoryHistory {
  timestamp: string;
  action: string;
  itemName: string;
  previousCount: number;
  newCount: number;
}

interface StockHistory {
  timestamp: string;
  action: string;
  itemName: string;
  packageType: '25kg' | '50kg';
  previousCount: number;
  newCount: number;
}

const Store = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [stockRates, setStockRates] = useState<any>({});
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '', count: 0 });
  const [newStockItem, setNewStockItem] = useState({ name: '', kg25: 0, kg50: 0 });
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedViewTransaction, setSelectedViewTransaction] = useState<StockTransaction | null>(null);
  
  const [saleFormData, setSaleFormData] = useState({
    customerName: '',
    phoneNumber: '',
    village: '',
    stockBought: '',
    quantity: '',
    rate: '',
    paidAmount: '',
    packageType: '25kg'
  });

  useEffect(() => {
    setInventory(getInventory());
    setStock(getStock());
    setStockTransactions(getStockTransactions());
    setStockRates(getDefaultStockRates());
    
    // Load history from localStorage
    const savedInventoryHistory = JSON.parse(localStorage.getItem('inventory_history') || '[]');
    const savedStockHistory = JSON.parse(localStorage.getItem('stock_history') || '[]');
    setInventoryHistory(savedInventoryHistory);
    setStockHistory(savedStockHistory);
  }, []);

  const saveInventoryHistory = (newHistory: InventoryHistory[]) => {
    localStorage.setItem('inventory_history', JSON.stringify(newHistory));
    setInventoryHistory(newHistory);
  };

  const saveStockHistory = (newHistory: StockHistory[]) => {
    localStorage.setItem('stock_history', JSON.stringify(newHistory));
    setStockHistory(newHistory);
  };

  const updateInventoryItem = (index: number, count: number) => {
    const updatedInventory = [...inventory];
    const previousCount = updatedInventory[index].count;
    updatedInventory[index].count = Math.max(0, count);
    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    // Save history
    const historyEntry: InventoryHistory = {
      timestamp: new Date().toLocaleString(),
      action: 'Updated',
      itemName: updatedInventory[index].name,
      previousCount,
      newCount: count
    };
    const newHistory = [historyEntry, ...inventoryHistory].slice(0, 50); // Keep last 50 entries
    saveInventoryHistory(newHistory);
  };

  const addInventoryItem = () => {
    if (!newInventoryItem.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter item name",
        variant: "destructive"
      });
      return;
    }

    const updatedInventory = [...inventory, { ...newInventoryItem }];
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    
    // Save history
    const historyEntry: InventoryHistory = {
      timestamp: new Date().toLocaleString(),
      action: 'Added',
      itemName: newInventoryItem.name,
      previousCount: 0,
      newCount: newInventoryItem.count
    };
    const newHistory = [historyEntry, ...inventoryHistory].slice(0, 50);
    saveInventoryHistory(newHistory);
    
    setNewInventoryItem({ name: '', count: 0 });
    toast({
      title: "Success",
      description: "Inventory item added successfully"
    });
  };

  const updateStockItem = (index: number, field: 'kg25' | 'kg50', value: number) => {
    const updatedStock = [...stock];
    const previousCount = updatedStock[index][field];
    updatedStock[index][field] = Math.max(0, value);
    setStock(updatedStock);
    saveStock(updatedStock);

    // Save history with correct package type format
    const packageType = field === 'kg25' ? '25kg' : '50kg';
    const historyEntry: StockHistory = {
      timestamp: new Date().toLocaleString(),
      action: 'Updated',
      itemName: updatedStock[index].name,
      packageType,
      previousCount,
      newCount: value
    };
    const newHistory = [historyEntry, ...stockHistory].slice(0, 50); // Keep last 50 entries
    saveStockHistory(newHistory);
  };

  const addStockItem = () => {
    if (!newStockItem.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter stock item name",
        variant: "destructive"
      });
      return;
    }

    const updatedStock = [...stock, { ...newStockItem }];
    setStock(updatedStock);
    saveStock(updatedStock);
    setNewStockItem({ name: '', kg25: 0, kg50: 0 });
    
    toast({
      title: "Success",
      description: "Stock item added successfully"
    });
  };

  const handleStockSale = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!saleFormData.customerName || !saleFormData.phoneNumber || !saleFormData.stockBought) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseFloat(saleFormData.quantity) || 0;
    const rate = parseFloat(saleFormData.rate) || 0;
    const totalAmount = quantity * rate;
    const paidAmount = parseFloat(saleFormData.paidAmount) || 0;
    const dueAmount = totalAmount - paidAmount;

    // Deduct stock based on package type
    const updatedStock = [...stock];
    const stockItemIndex = updatedStock.findIndex(item => item.name === saleFormData.stockBought);
    
    if (stockItemIndex !== -1) {
      if (saleFormData.packageType === '25kg') {
        const packagesNeeded = Math.ceil(quantity / 25);
        if (updatedStock[stockItemIndex].kg25 >= packagesNeeded) {
          updatedStock[stockItemIndex].kg25 -= packagesNeeded;
        } else {
          toast({
            title: "Error",
            description: "Insufficient 25kg packages in stock",
            variant: "destructive"
          });
          return;
        }
      } else if (saleFormData.packageType === '50kg') {
        const packagesNeeded = Math.ceil(quantity / 50);
        if (updatedStock[stockItemIndex].kg50 >= packagesNeeded) {
          updatedStock[stockItemIndex].kg50 -= packagesNeeded;
        } else {
          toast({
            title: "Error",
            description: "Insufficient 50kg packages in stock",
            variant: "destructive"
          });
          return;
        }
      }
      // For 'other' package types, we don't deduct from packages but still record the sale
    }

    setStock(updatedStock);
    saveStock(updatedStock);

    const newTransaction: StockTransaction = {
      id: Date.now().toString(),
      customerName: saleFormData.customerName,
      phoneNumber: saleFormData.phoneNumber,
      village: saleFormData.village,
      stockBought: saleFormData.stockBought,
      quantity,
      rate,
      totalAmount,
      paidAmount,
      dueAmount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const updatedTransactions = [...stockTransactions, newTransaction];
    setStockTransactions(updatedTransactions);
    saveStockTransactions(updatedTransactions);

    setSaleFormData({
      customerName: '',
      phoneNumber: '',
      village: '',
      stockBought: '',
      quantity: '',
      rate: '',
      paidAmount: '',
      packageType: '25kg'
    });
    setShowSaleForm(false);

    toast({
      title: "Success",
      description: "Stock sale recorded successfully"
    });
  };

  const deleteStockTransaction = (id: string) => {
    const transactionToDelete = stockTransactions.find(t => t.id === id);
    if (transactionToDelete) {
      addToBin('transaction', transactionToDelete);
      const updatedTransactions = stockTransactions.filter(t => t.id !== id);
      setStockTransactions(updatedTransactions);
      saveStockTransactions(updatedTransactions);
      
      toast({
        title: "Transaction Deleted",
        description: "Transaction moved to bin"
      });
    }
  };

  const updateStockRate = (stockName: string, rate: number) => {
    const updatedRates = { ...stockRates, [stockName]: rate };
    setStockRates(updatedRates);
    saveStockRates(updatedRates);
  };

  const getTotalStockValuation = () => {
    return stock.reduce((total, item) => {
      const rate = stockRates[item.name] || 0;
      const weight = (item.kg25 * 25) + (item.kg50 * 50);
      return total + (weight * rate);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Store Management</h1>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package size={16} />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center space-x-2">
              <Archive size={16} />
              <span>Stock</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package size={20} />
                    <span>Inventory Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventory.map((item, index) => (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                            <div className="text-3xl font-bold text-blue-600 mb-4">
                              {item.count}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInventoryItem(index, item.count - 1)}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={item.count}
                                onChange={(e) => updateInventoryItem(index, parseInt(e.target.value) || 0)}
                                className="w-20 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInventoryItem(index, item.count + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Add New Inventory Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <Label htmlFor="newItemName">Item Name</Label>
                          <Input
                            id="newItemName"
                            value={newInventoryItem.name}
                            onChange={(e) => setNewInventoryItem({...newInventoryItem, name: e.target.value})}
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newItemCount">Initial Count</Label>
                          <Input
                            id="newItemCount"
                            type="number"
                            min="0"
                            value={newInventoryItem.count}
                            onChange={(e) => setNewInventoryItem({...newInventoryItem, count: parseInt(e.target.value) || 0})}
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addInventoryItem}>
                            <Plus size={16} className="mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Inventory Mismatch Component */}
              <InventoryMismatch />

              {/* Inventory History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History size={20} />
                    <span>Recent Inventory Changes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto">
                    {inventoryHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent changes</p>
                    ) : (
                      <div className="space-y-2">
                        {inventoryHistory.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{entry.action}</span> {entry.itemName}
                              <div className="text-sm text-gray-600">
                                {entry.previousCount} → {entry.newCount}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.timestamp}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stock">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center space-x-2">
                      <Archive size={20} />
                      <span>Stock Management</span>
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Valuation</div>
                      <div className="text-2xl font-bold text-green-600">₹{getTotalStockValuation().toFixed(2)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left">Stock Item</th>
                          <th className="border border-gray-300 p-3 text-center">25kg Packages</th>
                          <th className="border border-gray-300 p-3 text-center">50kg Packages</th>
                          <th className="border border-gray-300 p-3 text-center">Total Weight (kg)</th>
                          <th className="border border-gray-300 p-3 text-center">Rate per kg (₹)</th>
                          <th className="border border-gray-300 p-3 text-center">Total Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stock.map((item, index) => {
                          const totalWeight = (item.kg25 * 25) + (item.kg50 * 50);
                          const rate = stockRates[item.name] || 0;
                          const totalValue = totalWeight * rate;
                          
                          return (
                            <tr key={index}>
                              <td className="border border-gray-300 p-3 font-medium">{item.name}</td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStockItem(index, 'kg25', item.kg25 - 1)}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.kg25}
                                    onChange={(e) => updateStockItem(index, 'kg25', parseInt(e.target.value) || 0)}
                                    className="w-20 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStockItem(index, 'kg25', item.kg25 + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStockItem(index, 'kg50', item.kg50 - 1)}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.kg50}
                                    onChange={(e) => updateStockItem(index, 'kg50', parseInt(e.target.value) || 0)}
                                    className="w-20 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStockItem(index, 'kg50', item.kg50 + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3 text-center font-bold">
                                {totalWeight} kg
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={rate}
                                  onChange={(e) => updateStockRate(item.name, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="border border-gray-300 p-3 text-center font-bold text-green-600">
                                ₹{totalValue.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Add New Stock Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="newStockName">Stock Item Name</Label>
                          <Input
                            id="newStockName"
                            value={newStockItem.name}
                            onChange={(e) => setNewStockItem({...newStockItem, name: e.target.value})}
                            placeholder="Enter stock name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newStock25">25kg Packages</Label>
                          <Input
                            id="newStock25"
                            type="number"
                            min="0"
                            value={newStockItem.kg25}
                            onChange={(e) => setNewStockItem({...newStockItem, kg25: parseInt(e.target.value) || 0})}
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newStock50">50kg Packages</Label>
                          <Input
                            id="newStock50"
                            type="number"
                            min="0"
                            value={newStockItem.kg50}
                            onChange={(e) => setNewStockItem({...newStockItem, kg50: parseInt(e.target.value) || 0})}
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addStockItem} className="w-full">
                            <Plus size={16} className="mr-2" />
                            Add Stock
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Stock History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History size={20} />
                    <span>Recent Stock Changes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto">
                    {stockHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent changes</p>
                    ) : (
                      <div className="space-y-2">
                        {stockHistory.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{entry.action}</span> {entry.itemName} ({entry.packageType})
                              <div className="text-sm text-gray-600">
                                {entry.previousCount} → {entry.newCount} packages
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.timestamp}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Sales Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Stock Sales</CardTitle>
                    <Button onClick={() => setShowSaleForm(true)} className="bg-green-600 hover:bg-green-700">
                      <Plus size={20} className="mr-2" />
                      Record Sale
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Stock Sale Form */}
                  {showSaleForm && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Record Stock Sale</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleStockSale} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customerName">Customer Name *</Label>
                            <Input
                              id="customerName"
                              required
                              value={saleFormData.customerName}
                              onChange={(e) => setSaleFormData({...saleFormData, customerName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <Input
                              id="phoneNumber"
                              type="tel"
                              required
                              maxLength={10}
                              pattern="[0-9]{10}"
                              value={saleFormData.phoneNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setSaleFormData({...saleFormData, phoneNumber: value});
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="village">Village</Label>
                            <Input
                              id="village"
                              value={saleFormData.village}
                              onChange={(e) => setSaleFormData({...saleFormData, village: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="stockBought">Stock Item *</Label>
                            <select
                              id="stockBought"
                              required
                              value={saleFormData.stockBought}
                              onChange={(e) => {
                                const stockName = e.target.value;
                                const rate = stockRates[stockName] || 0;
                                setSaleFormData({...saleFormData, stockBought: stockName, rate: rate.toString()});
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Select Stock Item</option>
                              {stock.map((item, index) => (
                                <option key={index} value={item.name}>{item.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="packageType">Package Type *</Label>
                            <select
                              id="packageType"
                              required
                              value={saleFormData.packageType}
                              onChange={(e) => setSaleFormData({...saleFormData, packageType: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="25kg">25kg Bag</option>
                              <option value="50kg">50kg Bag</option>
                              <option value="other">Other (Custom)</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="quantity">Quantity (kg) *</Label>
                            <Input
                              id="quantity"
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={saleFormData.quantity}
                              onChange={(e) => setSaleFormData({...saleFormData, quantity: e.target.value})}
                              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rate">Rate per kg (₹) *</Label>
                            <Input
                              id="rate"
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={saleFormData.rate}
                              onChange={(e) => setSaleFormData({...saleFormData, rate: e.target.value})}
                              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
                            <Input
                              id="paidAmount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={saleFormData.paidAmount}
                              onChange={(e) => setSaleFormData({...saleFormData, paidAmount: e.target.value})}
                              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-lg font-semibold">
                              Total Amount: ₹{((parseFloat(saleFormData.quantity) || 0) * (parseFloat(saleFormData.rate) || 0)).toFixed(2)}
                            </div>
                            <div className="text-lg font-semibold text-red-600">
                              Due Amount: ₹{Math.max(0, ((parseFloat(saleFormData.quantity) || 0) * (parseFloat(saleFormData.rate) || 0)) - (parseFloat(saleFormData.paidAmount) || 0)).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex space-x-2 md:col-span-2">
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                              Record Sale
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowSaleForm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Stock Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left">Time</th>
                          <th className="border border-gray-300 p-3 text-left">Customer</th>
                          <th className="border border-gray-300 p-3 text-left">Village</th>
                          <th className="border border-gray-300 p-3 text-left">Stock</th>
                          <th className="border border-gray-300 p-3 text-center">Amount</th>
                          <th className="border border-gray-300 p-3 text-center">Due</th>
                          <th className="border border-gray-300 p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="border border-gray-300 p-3">
                              <div className="text-sm">
                                <div>{transaction.date}</div>
                                <div className="text-gray-600">{transaction.time}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <div>
                                <div className="font-medium">{transaction.customerName}</div>
                                <div className="text-sm text-gray-600">{transaction.phoneNumber}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3">{transaction.village}</td>
                            <td className="border border-gray-300 p-3">
                              <div>
                                <div className="font-medium">{transaction.stockBought}</div>
                                <div className="text-sm text-gray-600">{transaction.quantity}kg @ ₹{transaction.rate}/kg</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              ₹{transaction.totalAmount.toFixed(2)}
                            </td>
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
                                    <Button size="sm" variant="outline" onClick={() => setSelectedViewTransaction(transaction)}>
                                      <Eye size={16} />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Stock Transaction Details</DialogTitle>
                                    </DialogHeader>
                                    {selectedViewTransaction && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div><strong>Customer:</strong> {selectedViewTransaction.customerName}</div>
                                          <div><strong>Phone:</strong> {selectedViewTransaction.phoneNumber}</div>
                                          <div><strong>Village:</strong> {selectedViewTransaction.village}</div>
                                          <div><strong>Stock:</strong> {selectedViewTransaction.stockBought}</div>
                                          <div><strong>Quantity:</strong> {selectedViewTransaction.quantity}kg</div>
                                          <div><strong>Rate:</strong> ₹{selectedViewTransaction.rate}/kg</div>
                                          <div><strong>Total:</strong> ₹{selectedViewTransaction.totalAmount.toFixed(2)}</div>
                                          <div><strong>Paid:</strong> ₹{selectedViewTransaction.paidAmount.toFixed(2)}</div>
                                          <div><strong>Due:</strong> ₹{selectedViewTransaction.dueAmount.toFixed(2)}</div>
                                          <div><strong>Date:</strong> {selectedViewTransaction.date}</div>
                                          <div><strong>Time:</strong> {selectedViewTransaction.time}</div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteStockTransaction(transaction.id)}
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

                  {stockTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No stock sales recorded yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Store;
