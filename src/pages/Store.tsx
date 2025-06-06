import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Minus, Package, DollarSign, Eye, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
import CustomerDueAlert from '@/components/CustomerDueAlert';
import { checkDuesByPhone } from '@/utils/duesChecker';

interface StockSaleForm {
  customerName: string;
  phoneNumber: string;
  village: string;
  stockBought: string;
  packageType: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  time: string;
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
  const [stockRates, setStockRates] = useState<any>({});
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showStockSaleForm, setShowStockSaleForm] = useState(false);
  const [showInventoryHistory, setShowInventoryHistory] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [recentInventoryChange, setRecentInventoryChange] = useState<any>(null);
  const [recentStockChange, setRecentStockChange] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);
  const [customerDueAlert, setCustomerDueAlert] = useState<{
    isOpen: boolean;
    customerName: string;
    phoneNumber: string;
    dueAmount: number;
  }>({ isOpen: false, customerName: '', phoneNumber: '', dueAmount: 0 });

  useEffect(() => {
    setInventory(getInventory());
    setStock(getStock());
    setStockTransactions(getStockTransactions());
    setStockRates(getDefaultStockRates());
  }, []);

  const handleAddInventoryItem = () => {
    const nameInput = document.getElementById('new-inventory-name') as HTMLInputElement;
    const countInput = document.getElementById('new-inventory-count') as HTMLInputElement;
    const name = nameInput.value.trim();
    const count = parseInt(countInput.value, 10);

    if (name && !isNaN(count)) {
      const newItem: InventoryItem = { name, count };
      setInventory([...inventory, newItem]);
      saveInventory([...inventory, newItem]);
      nameInput.value = '';
      countInput.value = '';
      setShowInventoryForm(false);
      toast({
        title: "Inventory Item Added",
        description: `${name} added to inventory`
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid item name and count"
      });
    }
  };

  const handleStockSale = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const customerName = (document.getElementById('customerName') as HTMLInputElement).value;
    const phoneNumber = (document.getElementById('phoneNumber') as HTMLInputElement).value;
    const village = (document.getElementById('village') as HTMLInputElement).value;
    const stockBought = (document.getElementById('stockBought') as HTMLSelectElement).value;
    const packageType = (document.getElementById('packageType') as HTMLSelectElement).value;
    const quantity = parseFloat((document.getElementById('quantity') as HTMLInputElement).value);
    const totalAmount = parseFloat((document.getElementById('totalAmount') as HTMLInputElement).value);
    const paidAmount = parseFloat((document.getElementById('paidAmount') as HTMLInputElement).value) || 0;

    if (!customerName || !phoneNumber || !stockBought || isNaN(quantity) || isNaN(totalAmount)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    const dueAmount = totalAmount - paidAmount;
    const newTransaction: StockTransaction = {
      id: Date.now().toString(),
      customerName,
      phoneNumber,
      village,
      stockBought,
      quantity,
      rate: totalAmount / quantity,
      totalAmount,
      paidAmount,
      dueAmount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    setStockTransactions([newTransaction, ...stockTransactions]);
    saveStockTransactions([newTransaction, ...stockTransactions]);

    // Update stock count
    if (packageType === '25kg') {
      updateStock(stockBought, -quantity, 0);
    } else if (packageType === '50kg') {
      updateStock(stockBought, 0, -quantity);
    } else {
      // Handle mixed or other package types as needed
      toast({
        title: "Warning",
        description: "Mixed package types are not fully supported for stock updates"
      });
    }

    setShowStockSaleForm(false);
    form.reset();

    toast({
      title: "Stock Sale Recorded",
      description: `Sale of ${quantity}kg ${stockBought} recorded for ${customerName}`
    });

    // Check for dues
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
    
    // Store only the most recent change
    setRecentInventoryChange({
      item: name,
      change: changeAmount,
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    });
    
    toast({
      title: "Inventory Updated",
      description: `${name}: ${changeAmount > 0 ? '+' : ''}${changeAmount} items`
    });
  };

  const deleteRecentInventoryChange = () => {
    setRecentInventoryChange(null);
    toast({
      title: "Recent Change Cleared",
      description: "Recent inventory change has been removed"
    });
  };

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
    
    // Store only the most recent change
    setRecentStockChange({
      item: name,
      kg25Change,
      kg50Change,
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    });
    
    toast({
      title: "Stock Updated",
      description: `${name}: 25kg ${kg25Change > 0 ? '+' : ''}${kg25Change}, 50kg ${kg50Change > 0 ? '+' : ''}${kg50Change}`
    });
  };

  const deleteRecentStockChange = () => {
    setRecentStockChange(null);
    toast({
      title: "Recent Change Cleared",
      description: "Recent stock change has been removed"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Store Management</h1>

        {/* Inventory Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Package className="mr-2" />
                Inventory Items
              </CardTitle>
              <Button onClick={() => setShowInventoryForm(!showInventoryForm)}>
                <Plus size={20} className="mr-2" />
                Add New Inventory Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showInventoryForm && (
              <div className="mb-4 p-4 border rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Item Name</Label>
                    <Input placeholder="Enter item name" id="new-inventory-name" />
                  </div>
                  <div>
                    <Label>Initial Count</Label>
                    <Input type="number" min="0" placeholder="0" id="new-inventory-count" />
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button onClick={handleAddInventoryItem}>Add Item</Button>
                  <Button variant="outline" onClick={() => setShowInventoryForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">{item.name}</h3>
                      <div className="text-2xl font-bold text-blue-600 mb-3">{item.count}</div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => updateInventory(item.name, 1)}>
                          <Plus size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateInventory(item.name, -1)}>
                          <Minus size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Inventory Changes */}
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowInventoryHistory(!showInventoryHistory)}
                className="mb-4"
              >
                {showInventoryHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="ml-2">Recent Inventory Changes</span>
              </Button>
              
              {showInventoryHistory && recentInventoryChange && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{recentInventoryChange.item}</div>
                        <div className="text-sm text-gray-600">
                          Change: {recentInventoryChange.change > 0 ? '+' : ''}{recentInventoryChange.change}
                        </div>
                        <div className="text-sm text-gray-500">
                          {recentInventoryChange.date} at {recentInventoryChange.time}
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={deleteRecentInventoryChange}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {showInventoryHistory && !recentInventoryChange && (
                <div className="text-center py-4 text-gray-500">No recent changes</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Stock Items</CardTitle>
              <Button onClick={() => setShowStockSaleForm(true)}>
                <DollarSign className="mr-2" size={20} />
                Record Stock Sale
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {stock.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">{item.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>25kg Bags:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-blue-600">{item.kg25}</span>
                          <Button size="sm" onClick={() => updateStock(item.name, 1, 0)}>
                            <Plus size={14} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStock(item.name, -1, 0)}>
                            <Minus size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>50kg Bags:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-green-600">{item.kg50}</span>
                          <Button size="sm" onClick={() => updateStock(item.name, 0, 1)}>
                            <Plus size={14} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStock(item.name, 0, -1)}>
                            <Minus size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Stock Changes */}
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowStockHistory(!showStockHistory)}
                className="mb-4"
              >
                {showStockHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="ml-2">Recent Stock Changes</span>
              </Button>
              
              {showStockHistory && recentStockChange && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{recentStockChange.item}</div>
                        <div className="text-sm text-gray-600">
                          25kg: {recentStockChange.kg25Change > 0 ? '+' : ''}{recentStockChange.kg25Change}, 
                          50kg: {recentStockChange.kg50Change > 0 ? '+' : ''}{recentStockChange.kg50Change}
                        </div>
                        <div className="text-sm text-gray-500">
                          {recentStockChange.date} at {recentStockChange.time}
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={deleteRecentStockChange}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {showStockHistory && !recentStockChange && (
                <div className="text-center py-4 text-gray-500">No recent changes</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Sales History */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Sales History</CardTitle>
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
                    <th className="border border-gray-300 p-3 text-center">Rate</th>
                    <th className="border border-gray-300 p-3 text-center">Amount</th>
                    <th className="border border-gray-300 p-3 text-center">Due</th>
                    <th className="border border-gray-300 p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockTransactions
                    .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())
                    .map((transaction) => (
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
                      <td className="border border-gray-300 p-3 text-center">{transaction.quantity}</td>
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
                                  <div><strong>Quantity:</strong> {selectedTransaction.quantity}</div>
                                  <div><strong>Rate:</strong> ₹{selectedTransaction.rate.toFixed(2)}</div>
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
            {stockTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">No stock sales recorded yet</div>
            )}
          </CardContent>
        </Card>

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
              <div>
                <Label htmlFor="packageType">Package Type *</Label>
                <select id="packageType" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select package type</option>
                  <option value="25kg">25kg Bag</option>
                  <option value="50kg">50kg Bag</option>
                  <option value="mixed">Mixed (25kg + 50kg)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div id="quantityInputs">
                <div>
                  <Label htmlFor="quantity">Total Weight (kg) *</Label>
                  <Input id="quantity" type="number" min="0" step="0.01" required />
                </div>
              </div>
              <div>
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input id="totalAmount" type="number" min="0" step="0.01" required />
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

        {/* Customer Due Alert */}
        <CustomerDueAlert
          isOpen={customerDueAlert.isOpen}
          onClose={() => setCustomerDueAlert({ ...customerDueAlert, isOpen: false })}
          customerName={customerDueAlert.customerName}
          phoneNumber={customerDueAlert.phoneNumber}
          dueAmount={customerDueAlert.dueAmount}
          onClearDue={() => {
            // Handle due clearing logic here
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
