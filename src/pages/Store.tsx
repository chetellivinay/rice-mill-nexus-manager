
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Package, DollarSign, Eye, Trash2, ChevronDown, ChevronUp, Search, Bookmark } from 'lucide-react';
import { 
  getInventory, 
  saveInventory, 
  getStock, 
  saveStock, 
  getStockTransactions,
  saveStockTransactions,
  getDues,
  saveDues,
  InventoryItem, 
  StockItem,
  StockTransaction,
  DueRecord
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import CustomerDueAlert from '@/components/CustomerDueAlert';
import { checkDuesByPhone } from '@/utils/duesChecker';

interface StockCheckpoint {
  id: string;
  stockName: string;
  kg25Count: number;
  kg50Count: number;
  timestamp: string;
  date: string;
}

interface InventoryCheckpoint {
  id: string;
  itemName: string;
  count: number;
  timestamp: string;
  date: string;
}

const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumber;
};

const Store = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [stockCheckpoints, setStockCheckpoints] = useState<StockCheckpoint[]>([]);
  const [inventoryCheckpoints, setInventoryCheckpoints] = useState<InventoryCheckpoint[]>([]);
  const [showStockSaleForm, setShowStockSaleForm] = useState(false);
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [showAddInventoryForm, setShowAddInventoryForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerDueAlert, setCustomerDueAlert] = useState<{
    isOpen: boolean;
    customerName: string;
    phoneNumber: string;
    dueAmount: number;
  }>({ isOpen: false, customerName: '', phoneNumber: '', dueAmount: 0 });

  useEffect(() => {
    setInventory(getInventory());
    setStock(getStock());
    // Sort stock transactions by most recent first
    const sortedStockTransactions = getStockTransactions().sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
      return dateTimeB - dateTimeA;
    });
    setStockTransactions(sortedStockTransactions);
    
    // Load checkpoints from localStorage
    setStockCheckpoints(JSON.parse(localStorage.getItem('stock_checkpoints') || '[]'));
    setInventoryCheckpoints(JSON.parse(localStorage.getItem('inventory_checkpoints') || '[]'));
  }, []);

  const updateStock = (name: string, kg25Change: number, kg50Change: number) => {
    const updatedStock = stock.map(item => {
      if (item.name === name) {
        return {
          ...item,
          kg25: Math.max(0, item.kg25 + kg25Change),
          kg50: Math.max(0, item.kg50 + kg50Change)
        };
      }
      return item;
    });
    
    setStock(updatedStock);
    saveStock(updatedStock);
    
    toast({
      title: "Stock Updated",
      description: `${name}: 25kg ${kg25Change > 0 ? '+' : ''}${kg25Change}, 50kg ${kg50Change > 0 ? '+' : ''}${kg50Change}`
    });
  };

  const updateInventory = (name: string, changeAmount: number) => {
    const updatedInventory = inventory.map(item => {
      if (item.name === name) {
        const newCount = Math.max(0, item.count + changeAmount);
        return { ...item, count: newCount };
      }
      return item;
    });
    
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    
    toast({
      title: "Inventory Updated",
      description: `${name}: ${changeAmount > 0 ? '+' : ''}${changeAmount} items`
    });
  };

  const addStockCheckpoint = (stockName: string) => {
    const stockItem = stock.find(s => s.name === stockName);
    if (!stockItem) return;

    const checkpoint: StockCheckpoint = {
      id: Date.now().toString(),
      stockName,
      kg25Count: stockItem.kg25,
      kg50Count: stockItem.kg50,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };

    const updatedCheckpoints = [checkpoint, ...stockCheckpoints];
    setStockCheckpoints(updatedCheckpoints);
    localStorage.setItem('stock_checkpoints', JSON.stringify(updatedCheckpoints));

    toast({
      title: "Stock Checkpoint Added",
      description: `Checkpoint created for ${stockName}`
    });
  };

  const addInventoryCheckpoint = (itemName: string) => {
    const inventoryItem = inventory.find(i => i.name === itemName);
    if (!inventoryItem) return;

    const checkpoint: InventoryCheckpoint = {
      id: Date.now().toString(),
      itemName,
      count: inventoryItem.count,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };

    const updatedCheckpoints = [checkpoint, ...inventoryCheckpoints];
    setInventoryCheckpoints(updatedCheckpoints);
    localStorage.setItem('inventory_checkpoints', JSON.stringify(updatedCheckpoints));

    toast({
      title: "Inventory Checkpoint Added",
      description: `Checkpoint created for ${itemName}`
    });
  };

  const handleStockSale = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const customerName = (document.getElementById('customerName') as HTMLInputElement).value;
    const phoneNumber = (document.getElementById('phoneNumber') as HTMLInputElement).value;
    const village = (document.getElementById('village') as HTMLInputElement).value;
    const stockBought = (document.getElementById('stockBought') as HTMLSelectElement).value;
    const kg25Bags = parseInt((document.getElementById('kg25Bags') as HTMLInputElement).value) || 0;
    const kg50Bags = parseInt((document.getElementById('kg50Bags') as HTMLInputElement).value) || 0;
    const customWeight = parseFloat((document.getElementById('customWeight') as HTMLInputElement).value) || 0;
    const ratePerKg = parseFloat((document.getElementById('ratePerKg') as HTMLInputElement).value);
    const paidAmount = parseFloat((document.getElementById('paidAmount') as HTMLInputElement).value) || 0;

    if (!customerName || !phoneNumber || !stockBought || isNaN(ratePerKg)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    const totalWeight = (kg25Bags * 25) + (kg50Bags * 50) + customWeight;
    if (totalWeight <= 0) {
      toast({
        title: "Error",
        description: "Please specify quantity (bags or custom weight)"
      });
      return;
    }

    const totalAmount = totalWeight * ratePerKg;
    const dueAmount = totalAmount - paidAmount;

    const newTransaction: StockTransaction = {
      id: Date.now().toString(),
      customerName,
      phoneNumber,
      village,
      stockBought,
      quantity: totalWeight,
      rate: ratePerKg,
      totalAmount,
      paidAmount,
      dueAmount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    // Update stock counts
    updateStock(stockBought, -kg25Bags, -kg50Bags);

    // Add due to dues section if there's a due amount
    if (dueAmount > 0) {
      const dues = getDues();
      const newDue: DueRecord = {
        id: Date.now().toString(),
        customerName,
        type: 'rice',
        stockType: stockBought,
        amount: dueAmount,
        description: `Stock sale - ${totalWeight}kg ${stockBought}`,
        date: new Date().toLocaleDateString()
      };
      saveDues([newDue, ...dues]);
    }

    const updatedTransactions = [newTransaction, ...stockTransactions];
    setStockTransactions(updatedTransactions);
    saveStockTransactions(updatedTransactions);

    setShowStockSaleForm(false);
    form.reset();

    toast({
      title: "Stock Sale Recorded",
      description: `Sale of ${totalWeight}kg ${stockBought} recorded for ${customerName}`
    });

    // Check for existing dues
    const duesInfo = checkDuesByPhone(phoneNumber);
    if (duesInfo && duesInfo.totalDue > 0) {
      setCustomerDueAlert({
        isOpen: true,
        customerName,
        phoneNumber: formatPhoneNumber(phoneNumber),
        dueAmount: duesInfo.totalDue
      });
    }
  };

  const handleAddStock = (event: React.FormEvent) => {
    event.preventDefault();
    const stockName = (document.getElementById('newStockName') as HTMLInputElement).value;
    if (stockName.trim()) {
      const newStock: StockItem = { name: stockName.trim(), kg25: 0, kg50: 0 };
      const updatedStock = [...stock, newStock];
      setStock(updatedStock);
      saveStock(updatedStock);
      setShowAddStockForm(false);
      toast({
        title: "Stock Item Added",
        description: `${stockName} added to stock`
      });
    }
  };

  const handleAddInventory = (event: React.FormEvent) => {
    event.preventDefault();
    const itemName = (document.getElementById('newInventoryName') as HTMLInputElement).value;
    if (itemName.trim()) {
      const newItem: InventoryItem = { name: itemName.trim(), count: 0 };
      const updatedInventory = [...inventory, newItem];
      setInventory(updatedInventory);
      saveInventory(updatedInventory);
      setShowAddInventoryForm(false);
      toast({
        title: "Inventory Item Added",
        description: `${itemName} added to inventory`
      });
    }
  };

  const filteredStockTransactions = stockTransactions.filter(transaction =>
    transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.phoneNumber.includes(searchTerm) ||
    transaction.stockBought.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStockValue = (item: StockItem) => {
    // Default rate per kg for calculation (can be made configurable)
    const defaultRate = 45; // ₹45 per kg
    return ((item.kg25 * 25) + (item.kg50 * 50)) * defaultRate;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Store Management</h1>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock">Stock Management</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          </TabsList>

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-6">
            {/* Stock Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Stock Items</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowAddStockForm(true)} size="sm">
                      <Plus className="mr-2" size={16} />
                      Add New Stock
                    </Button>
                    <Button onClick={() => setShowStockSaleForm(true)}>
                      <DollarSign className="mr-2" size={20} />
                      Record Stock Sale
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stock.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addStockCheckpoint(item.name)}
                          >
                            <Bookmark size={14} />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>25kg Bags:</span>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => updateStock(item.name, -1, 0)}>
                                <Minus size={14} />
                              </Button>
                              <Input
                                type="number"
                                value={item.kg25}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  const change = newValue - item.kg25;
                                  updateStock(item.name, change, 0);
                                }}
                                className="w-16 text-center"
                              />
                              <Button size="sm" onClick={() => updateStock(item.name, 1, 0)}>
                                <Plus size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>50kg Bags:</span>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => updateStock(item.name, 0, -1)}>
                                <Minus size={14} />
                              </Button>
                              <Input
                                type="number"
                                value={item.kg50}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  const change = newValue - item.kg50;
                                  updateStock(item.name, 0, change);
                                }}
                                className="w-16 text-center"
                              />
                              <Button size="sm" onClick={() => updateStock(item.name, 0, 1)}>
                                <Plus size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between text-sm">
                              <span>Total Weight:</span>
                              <span className="font-semibold">{(item.kg25 * 25) + (item.kg50 * 50)} kg</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Rate/kg:</span>
                              <span>₹45</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                              <span>Total Value:</span>
                              <span className="text-green-600">₹{calculateStockValue(item).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stock Sales History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Stock Sales History</span>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search sales..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left">Date/Time</th>
                        <th className="border border-gray-300 p-3 text-left">Customer</th>
                        <th className="border border-gray-300 p-3 text-left">Stock</th>
                        <th className="border border-gray-300 p-3 text-center">Quantity</th>
                        <th className="border border-gray-300 p-3 text-center">Rate/kg</th>
                        <th className="border border-gray-300 p-3 text-center">Amount</th>
                        <th className="border border-gray-300 p-3 text-center">Due</th>
                        <th className="border border-gray-300 p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStockTransactions.map((transaction) => (
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
                              <div className="text-sm text-gray-500">{transaction.village}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">{transaction.stockBought}</td>
                          <td className="border border-gray-300 p-3 text-center">{transaction.quantity}kg</td>
                          <td className="border border-gray-300 p-3 text-center">₹{transaction.rate.toFixed(2)}</td>
                          <td className="border border-gray-300 p-3 text-center">₹{transaction.totalAmount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-3 text-center">
                            {transaction.dueAmount > 0 ? (
                              <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                            ) : (
                              <Badge variant="default">Paid</Badge>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3 text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedTransaction(transaction)}>
                                  <Eye size={16} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Transaction Details</DialogTitle>
                                </DialogHeader>
                                {selectedTransaction && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div><strong>Customer:</strong> {selectedTransaction.customerName}</div>
                                      <div><strong>Phone:</strong> {selectedTransaction.phoneNumber}</div>
                                      <div><strong>Village:</strong> {selectedTransaction.village}</div>
                                      <div><strong>Stock:</strong> {selectedTransaction.stockBought}</div>
                                      <div><strong>Quantity:</strong> {selectedTransaction.quantity}kg</div>
                                      <div><strong>Rate:</strong> ₹{selectedTransaction.rate.toFixed(2)}/kg</div>
                                      <div><strong>Total Amount:</strong> ₹{selectedTransaction.totalAmount.toFixed(2)}</div>
                                      <div><strong>Paid Amount:</strong> ₹{selectedTransaction.paidAmount.toFixed(2)}</div>
                                      <div><strong>Due Amount:</strong> ₹{selectedTransaction.dueAmount.toFixed(2)}</div>
                                      <div><strong>Date:</strong> {selectedTransaction.date}</div>
                                      <div><strong>Time:</strong> {selectedTransaction.time}</div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStockTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No stock sales found</div>
                )}
              </CardContent>
            </Card>

            {/* Stock Checkpoints */}
            {stockCheckpoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Stock Checkpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stockCheckpoints.slice(0, 5).map((checkpoint) => (
                      <div key={checkpoint.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{checkpoint.stockName}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            25kg: {checkpoint.kg25Count}, 50kg: {checkpoint.kg50Count}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkpoint.date} {checkpoint.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inventory Management Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Package className="mr-2" />
                    Inventory Items
                  </CardTitle>
                  <Button onClick={() => setShowAddInventoryForm(true)}>
                    <Plus size={20} className="mr-2" />
                    Add New Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {inventory.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addInventoryCheckpoint(item.name)}
                            >
                              <Bookmark size={14} />
                            </Button>
                          </div>
                          <div className="flex items-center justify-center space-x-2 mb-3">
                            <Button size="sm" variant="outline" onClick={() => updateInventory(item.name, -1)}>
                              <Minus size={16} />
                            </Button>
                            <Input
                              type="number"
                              value={item.count}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 0;
                                const change = newValue - item.count;
                                updateInventory(item.name, change);
                              }}
                              className="w-20 text-center text-2xl font-bold text-blue-600"
                            />
                            <Button size="sm" onClick={() => updateInventory(item.name, 1)}>
                              <Plus size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Checkpoints */}
            {inventoryCheckpoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Checkpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inventoryCheckpoints.slice(0, 5).map((checkpoint) => (
                      <div key={checkpoint.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{checkpoint.itemName}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            Count: {checkpoint.count}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkpoint.date} {checkpoint.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Stock Sale Form Dialog */}
        <Dialog open={showStockSaleForm} onOpenChange={setShowStockSaleForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Stock Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStockSale} className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input id="customerName" required />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" required maxLength={10} />
              </div>
              <div>
                <Label htmlFor="village">Village</Label>
                <Input id="village" />
              </div>
              <div>
                <Label htmlFor="stockBought">Stock Type *</Label>
                <select id="stockBought" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select stock type</option>
                  {stock.map((item) => (
                    <option key={item.name} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kg25Bags">25kg Bags</Label>
                  <Input id="kg25Bags" type="number" min="0" defaultValue="0" />
                </div>
                <div>
                  <Label htmlFor="kg50Bags">50kg Bags</Label>
                  <Input id="kg50Bags" type="number" min="0" defaultValue="0" />
                </div>
              </div>
              <div>
                <Label htmlFor="customWeight">Custom Weight (kg)</Label>
                <Input id="customWeight" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
              <div>
                <Label htmlFor="ratePerKg">Rate per Kg *</Label>
                <Input id="ratePerKg" type="number" min="0" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="paidAmount">Paid Amount</Label>
                <Input id="paidAmount" type="number" min="0" step="0.01" />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">Record Sale</Button>
                <Button type="button" variant="outline" onClick={() => setShowStockSaleForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Stock Form Dialog */}
        <Dialog open={showAddStockForm} onOpenChange={setShowAddStockForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <Label htmlFor="newStockName">Stock Name *</Label>
                <Input id="newStockName" required placeholder="Enter stock name" />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">Add Stock</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddStockForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Inventory Form Dialog */}
        <Dialog open={showAddInventoryForm} onOpenChange={setShowAddInventoryForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <div>
                <Label htmlFor="newInventoryName">Item Name *</Label>
                <Input id="newInventoryName" required placeholder="Enter item name" />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddInventoryForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Customer Due Alert */}
        <CustomerDueAlert
          isOpen={customerDueAlert.isOpen}
          onClose={() => setCustomerDueAlert({ ...customerDueAlert, isOpen: false })}
          customerName={customerDueAlert.customerName}
          phoneNumber={customerDueAlert.phoneNumber}
          dueAmount={customerDueAlert.dueAmount}
          onClearDue={() => {
            setCustomerDueAlert({ ...customerDueAlert, isOpen: false });
            toast({
              title: "Due Cleared",
              description: "Customer due has been cleared"
            });
          }}
        />
      </div>
    </div>
  );
};

export default Store;
