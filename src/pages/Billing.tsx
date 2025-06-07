
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Calculator, Save, Trash2, DollarSign } from 'lucide-react';
import { 
  getInventory, 
  saveInventory, 
  getTransactions, 
  saveTransactions, 
  getDefaultRates, 
  saveRates,
  Transaction,
  BillingItem 
} from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import CustomerDueAlert from '@/components/CustomerDueAlert';
import { checkDuesByPhone } from '@/utils/duesChecker';

interface BillingFormData {
  customerName: string;
  village: string;
  phoneNumber: string;
  loadBrought: number;
  items: BillingItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumber;
};

const Billing = () => {
  const [formData, setFormData] = useState<BillingFormData>({
    customerName: '',
    village: '',
    phoneNumber: '',
    loadBrought: 0,
    items: [],
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0
  });

  const [rates, setRates] = useState(getDefaultRates());
  const [showRatesCard, setShowRatesCard] = useState(false);
  const [inventory, setInventory] = useState(getInventory());
  const [customerDueAlert, setCustomerDueAlert] = useState<{
    isOpen: boolean;
    customerName: string;
    phoneNumber: string;
    dueAmount: number;
  }>({ isOpen: false, customerName: '', phoneNumber: '', dueAmount: 0 });

  useEffect(() => {
    calculateTotal();
  }, [formData.items, formData.paidAmount]);

  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => sum + item.total, 0);
    const due = total - formData.paidAmount;
    setFormData(prev => ({
      ...prev,
      totalAmount: total,
      dueAmount: Math.max(0, due)
    }));
  };

  const addItem = (name: string, rate: number) => {
    const existingItem = formData.items.find(item => item.name === name);
    if (existingItem) {
      updateItemQuantity(name, existingItem.quantity + 1);
    } else {
      const newItem: BillingItem = {
        name,
        rate,
        quantity: 1,
        total: rate
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const updateItemQuantity = (name: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(name);
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.name === name 
          ? { ...item, quantity: newQuantity, total: item.rate * newQuantity }
          : item
      )
    }));
  };

  const removeItem = (name: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.name !== name)
    }));
  };

  const updateItemRate = (name: string, newRate: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.name === name 
          ? { ...item, rate: newRate, total: newRate * item.quantity }
          : item
      )
    }));
  };

  const handleSaveTransaction = () => {
    if (!formData.customerName || !formData.phoneNumber || formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in customer details and add at least one item"
      });
      return;
    }

    // Update inventory
    const updatedInventory = inventory.map(invItem => {
      const billedItem = formData.items.find(item => item.name === invItem.name);
      if (billedItem) {
        return { ...invItem, count: Math.max(0, invItem.count - billedItem.quantity) };
      }
      return invItem;
    });
    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    // Create transaction
    const transaction: Transaction = {
      id: Date.now().toString(),
      name: formData.customerName,
      village: formData.village,
      phone: formData.phoneNumber,
      items: formData.items,
      totalAmount: formData.totalAmount,
      paidAmount: formData.paidAmount,
      dueAmount: formData.dueAmount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const transactions = getTransactions();
    saveTransactions([transaction, ...transactions]);

    // Reset form
    setFormData({
      customerName: '',
      village: '',
      phoneNumber: '',
      loadBrought: 0,
      items: [],
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0
    });

    toast({
      title: "Transaction Saved",
      description: "Billing completed successfully"
    });

    // Check for dues
    const duesInfo = checkDuesByPhone(formData.phoneNumber);
    if (duesInfo && duesInfo.totalDue > 0) {
      setCustomerDueAlert({
        isOpen: true,
        customerName: formData.customerName,
        phoneNumber: formatPhoneNumber(formData.phoneNumber),
        dueAmount: duesInfo.totalDue
      });
    }
  };

  const updateRate = (key: string, value: number) => {
    const newRates = { ...rates, [key]: value };
    setRates(newRates);
    saveRates(newRates);
  };

  const updateMillingRate = (value: number) => {
    const newRates = { ...rates, milling: [value, rates.milling[1]] };
    setRates(newRates);
    saveRates(newRates);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Billing</h1>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="village">Village</Label>
                <Input
                  id="village"
                  value={formData.village}
                  onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                  placeholder="Enter village"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number"
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Items */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quick Add Items</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRatesCard(!showRatesCard)}
              >
                {showRatesCard ? 'Hide' : 'Show'} Rates
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showRatesCard && (
              <div className="mb-4 p-4 border rounded bg-gray-50">
                <h3 className="font-semibold mb-3">Current Rates</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Milling (per quintal)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.milling[0]}
                      onChange={(e) => updateMillingRate(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Powder (per bag)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.powder}
                      onChange={(e) => updateRate('powder', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Big Bags</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.bigBags}
                      onChange={(e) => updateRate('bigBags', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Small Bags</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.smallBags}
                      onChange={(e) => updateRate('smallBags', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Bran Bags</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.branBags}
                      onChange={(e) => updateRate('branBags', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Unloading</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.unloading}
                      onChange={(e) => updateRate('unloading', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Loading</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.loading}
                      onChange={(e) => updateRate('loading', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Nukalu</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rates.nukalu}
                      onChange={(e) => updateRate('nukalu', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={() => addItem('Milling', rates.milling[0])} variant="outline">
                Add Milling (₹{rates.milling[0]})
              </Button>
              <Button onClick={() => addItem('Powder', rates.powder)} variant="outline">
                Add Powder (₹{rates.powder})
              </Button>
              <Button onClick={() => addItem('Big Bags', rates.bigBags)} variant="outline">
                Add Big Bags (₹{rates.bigBags})
              </Button>
              <Button onClick={() => addItem('Small Bags', rates.smallBags)} variant="outline">
                Add Small Bags (₹{rates.smallBags})
              </Button>
              <Button onClick={() => addItem('Bran Bags', rates.branBags)} variant="outline">
                Add Bran Bags (₹{rates.branBags})
              </Button>
              <Button onClick={() => addItem('Unloading', rates.unloading)} variant="outline">
                Add Unloading (₹{rates.unloading})
              </Button>
              <Button onClick={() => addItem('Loading', rates.loading)} variant="outline">
                Add Loading (₹{rates.loading})
              </Button>
              <Button onClick={() => addItem('Nukalu', rates.nukalu)} variant="outline">
                Add Nukalu (₹{rates.nukalu})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Billing Items</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items added yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">Item</th>
                      <th className="border border-gray-300 p-3 text-center">Quantity</th>
                      <th className="border border-gray-300 p-3 text-center">Rate</th>
                      <th className="border border-gray-300 p-3 text-center">Total</th>
                      <th className="border border-gray-300 p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-3">{item.name}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.name, item.quantity - 1)}
                            >
                              <Minus size={16} />
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.name, item.quantity + 1)}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItemRate(item.name, parseFloat(e.target.value) || 0)}
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-center">₹{item.total.toFixed(2)}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItem(item.name)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Label className="text-lg">Total Amount</Label>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  ₹{formData.totalAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <Label htmlFor="paidAmount">Paid Amount</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter paid amount"
                />
              </div>
              <div className="text-center">
                <Label className="text-lg">Due Amount</Label>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  ₹{formData.dueAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Transaction */}
        <Card>
          <CardContent className="p-6">
            <Button 
              onClick={handleSaveTransaction}
              className="w-full"
              size="lg"
              disabled={!formData.customerName || !formData.phoneNumber || formData.items.length === 0}
            >
              <Save className="mr-2" size={20} />
              Save Transaction
            </Button>
          </CardContent>
        </Card>

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

export default Billing;
