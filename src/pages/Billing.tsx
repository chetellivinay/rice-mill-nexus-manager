
import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Transaction, saveTransactions, getTransactions, getInventory, saveInventory, getDefaultRates, saveRates } from '@/utils/localStorage';
import { checkDuesByPhone, getUniqueVillages } from '@/utils/duesChecker';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Billing = () => {
  const [rates, setRates] = useState(getDefaultRates());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDueDialog, setShowDueDialog] = useState(false);
  const [dueInfo, setDueInfo] = useState<any>(null);
  const [includeOldDue, setIncludeOldDue] = useState(false);
  const [villages] = useState(getUniqueVillages());
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    phone: '',
    millingRate: rates.milling[0] as number,
    millingQuantity: '',
    powderQuantity: '',
    bigBagsQuantity: '',
    smallBagsQuantity: '',
    branBagsQuantity: '',
    unloadingQuantity: '',
    loadingQuantity: '',
    nukaluQuantity: '',
    extraQuantity: '',
    paidAmount: ''
  });

  useEffect(() => {
    // Check if customer data was passed from queue
    const billingCustomerData = localStorage.getItem('billingCustomerData');
    if (billingCustomerData) {
      const customerData = JSON.parse(billingCustomerData);
      setFormData(prev => ({
        ...prev,
        name: customerData.name,
        village: customerData.village,
        phone: customerData.phoneNumber
      }));
      
      // Check for dues if phone number exists
      if (customerData.phoneNumber) {
        const dues = checkDuesByPhone(customerData.phoneNumber);
        setDueInfo(dues);
      }
      
      localStorage.removeItem('billingCustomerData');
    }
  }, []);

  const handlePhoneInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setFormData({...formData, phone: numericValue});
    
    // Check for dues when phone number is complete
    if (numericValue.length === 10) {
      const dues = checkDuesByPhone(numericValue);
      setDueInfo(dues);
    } else {
      setDueInfo(null);
    }
  };

  const handleRateChange = (item: string, value: number) => {
    const updatedRates = { ...rates, [item]: value };
    setRates(updatedRates);
    saveRates(updatedRates);
  };

  const handleQuantityChange = (field: string, value: string) => {
    setFormData({...formData, [field]: value});
  };

  const calculateItemTotal = (rate: number, quantity: string) => {
    const qty = parseFloat(quantity) || 0;
    return rate * qty;
  };

  const calculateTotalAmount = () => {
    const millingTotal = calculateItemTotal(formData.millingRate, formData.millingQuantity);
    const powderTotal = calculateItemTotal(rates.powder, formData.powderQuantity);
    const bigBagsTotal = calculateItemTotal(rates.bigBags, formData.bigBagsQuantity);
    const smallBagsTotal = calculateItemTotal(rates.smallBags, formData.smallBagsQuantity);
    const branBagsTotal = calculateItemTotal(rates.branBags, formData.branBagsQuantity);
    const unloadingTotal = calculateItemTotal(rates.unloading, formData.unloadingQuantity);
    const loadingTotal = calculateItemTotal(rates.loading, formData.loadingQuantity);
    const nukaluTotal = calculateItemTotal(rates.nukalu, formData.nukaluQuantity);
    const extraTotal = calculateItemTotal(rates.extra, formData.extraQuantity);

    // Nukalu is subtracted from total as per requirement
    const currentBillTotal = millingTotal + powderTotal + bigBagsTotal + smallBagsTotal + 
           branBagsTotal + unloadingTotal + loadingTotal + extraTotal - nukaluTotal;
    
    // Add previous due if selected
    return currentBillTotal + (includeOldDue && dueInfo ? dueInfo.totalDue : 0);
  };

  const totalAmount = calculateTotalAmount();
  const paidAmount = parseFloat(formData.paidAmount) || 0;
  const dueAmount = totalAmount - paidAmount;

  const handleSave = () => {
    if (!formData.name || !formData.village) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.phone && formData.phone.length !== 10) {
      toast({
        title: "Error",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive"
      });
      return;
    }

    // If there are dues and user hasn't decided, show due dialog
    if (dueInfo && !showDueDialog) {
      setShowDueDialog(true);
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const clearCustomerDues = (phoneNumber: string) => {
    if (!phoneNumber) return;
    
    const transactions = getTransactions();
    const updatedTransactions = transactions.map(transaction => {
      if (transaction.phone === phoneNumber && transaction.dueAmount > 0) {
        return { ...transaction, dueAmount: 0 };
      }
      return transaction;
    });
    
    saveTransactions(updatedTransactions);
  };

  const confirmSave = () => {
    const currentBillTotal = calculateTotalAmount() - (includeOldDue && dueInfo ? dueInfo.totalDue : 0);
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      name: formData.name,
      village: formData.village,
      phone: formData.phone,
      items: [
        { name: 'Milling', rate: formData.millingRate, quantity: parseFloat(formData.millingQuantity) || 0, total: calculateItemTotal(formData.millingRate, formData.millingQuantity) },
        { name: 'Powder', rate: rates.powder, quantity: parseFloat(formData.powderQuantity) || 0, total: calculateItemTotal(rates.powder, formData.powderQuantity) },
        { name: 'Big Bags', rate: rates.bigBags, quantity: parseFloat(formData.bigBagsQuantity) || 0, total: calculateItemTotal(rates.bigBags, formData.bigBagsQuantity) },
        { name: 'Small Bags', rate: rates.smallBags, quantity: parseFloat(formData.smallBagsQuantity) || 0, total: calculateItemTotal(rates.smallBags, formData.smallBagsQuantity) },
        { name: 'Bran Bags', rate: rates.branBags, quantity: parseFloat(formData.branBagsQuantity) || 0, total: calculateItemTotal(rates.branBags, formData.branBagsQuantity) },
        { name: 'Unloading', rate: rates.unloading, quantity: parseFloat(formData.unloadingQuantity) || 0, total: calculateItemTotal(rates.unloading, formData.unloadingQuantity) },
        { name: 'Loading', rate: rates.loading, quantity: parseFloat(formData.loadingQuantity) || 0, total: calculateItemTotal(rates.loading, formData.loadingQuantity) },
        { name: 'Nukalu', rate: rates.nukalu, quantity: parseFloat(formData.nukaluQuantity) || 0, total: calculateItemTotal(rates.nukalu, formData.nukaluQuantity) },
        { name: 'Extra Charges', rate: rates.extra, quantity: parseFloat(formData.extraQuantity) || 0, total: calculateItemTotal(rates.extra, formData.extraQuantity) }
      ].filter(item => item.quantity > 0),
      totalAmount: includeOldDue ? totalAmount : currentBillTotal,
      paidAmount,
      dueAmount: includeOldDue ? dueAmount : (currentBillTotal - paidAmount),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const transactions = getTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);

    // If old dues were included and fully paid, clear customer dues
    if (includeOldDue && dueInfo && paidAmount >= totalAmount) {
      clearCustomerDues(formData.phone);
      toast({
        title: "Dues Cleared",
        description: "Customer's previous dues have been cleared"
      });
    }

    // Update inventory
    const inventory = getInventory();
    const updatedInventory = inventory.map(item => {
      if (item.name === 'Powders') {
        return { ...item, count: Math.max(0, item.count - (parseFloat(formData.powderQuantity) || 0)) };
      }
      if (item.name === 'Small Bags') {
        return { ...item, count: Math.max(0, item.count - (parseFloat(formData.smallBagsQuantity) || 0)) };
      }
      if (item.name === 'Big Bags') {
        return { ...item, count: Math.max(0, item.count - (parseFloat(formData.bigBagsQuantity) || 0)) };
      }
      if (item.name === 'Bran Bags') {
        return { ...item, count: Math.max(0, item.count - (parseFloat(formData.branBagsQuantity) || 0)) };
      }
      return item;
    });
    saveInventory(updatedInventory);

    // Reset form
    setFormData({
      name: '',
      village: '',
      phone: '',
      millingRate: rates.milling[0],
      millingQuantity: '',
      powderQuantity: '',
      bigBagsQuantity: '',
      smallBagsQuantity: '',
      branBagsQuantity: '',
      unloadingQuantity: '',
      loadingQuantity: '',
      nukaluQuantity: '',
      extraQuantity: '',
      paidAmount: ''
    });

    setDueInfo(null);
    setIncludeOldDue(false);
    setShowConfirmDialog(false);
    setShowDueDialog(false);
    
    toast({
      title: "Success",
      description: "Transaction saved successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Billing Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>Customer Data Entry</CardTitle>
          </CardHeader>
          <CardContent>
            {dueInfo && (
              <Alert className="mb-4 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Previous Dues Found:</strong> This phone number has ₹{dueInfo.totalDue.toFixed(2)} 
                  in outstanding dues from {dueInfo.transactionCount} transaction(s). 
                  Last transaction: {dueInfo.lastTransactionDate}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="village">Village *</Label>
                <Input
                  id="village"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({...formData, village: e.target.value})}
                  list="villages"
                />
                <datalist id="villages">
                  {villages.map((village) => (
                    <option key={village} value={village} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (10 digits)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Previous Due Inclusion Option */}
            {dueInfo && includeOldDue && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  Previous due of ₹{dueInfo.totalDue.toFixed(2)} is included in the total amount.
                </AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Item</th>
                    <th className="border border-gray-300 p-3 text-left">Rate</th>
                    <th className="border border-gray-300 p-3 text-left">Quantity</th>
                    <th className="border border-gray-300 p-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Milling</td>
                    <td className="border border-gray-300 p-3">
                      <Select 
                        value={formData.millingRate.toString()} 
                        onValueChange={(value) => setFormData({...formData, millingRate: parseFloat(value)})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(rates.milling as number[]).map((rate) => (
                            <SelectItem key={rate} value={rate.toString()}>{rate.toFixed(2)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.millingQuantity}
                        onChange={(e) => handleQuantityChange('millingQuantity', e.target.value)}
                        placeholder="0"
                        className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                      />
                    </td>
                    <td className="border border-gray-300 p-3">
                      {calculateItemTotal(formData.millingRate, formData.millingQuantity).toFixed(2)}
                    </td>
                  </tr>
                  
                  {[
                    { name: 'Powder', rateKey: 'powder', quantityKey: 'powderQuantity' },
                    { name: 'Big Bags', rateKey: 'bigBags', quantityKey: 'bigBagsQuantity' },
                    { name: 'Small Bags', rateKey: 'smallBags', quantityKey: 'smallBagsQuantity' },
                    { name: 'Bran Bags', rateKey: 'branBags', quantityKey: 'branBagsQuantity' },
                    { name: 'Unloading', rateKey: 'unloading', quantityKey: 'unloadingQuantity' },
                    { name: 'Loading', rateKey: 'loading', quantityKey: 'loadingQuantity' },
                    { name: 'Nukalu', rateKey: 'nukalu', quantityKey: 'nukaluQuantity' },
                    { name: 'Extra Charges', rateKey: 'extra', quantityKey: 'extraQuantity' }
                  ].map((item) => (
                    <tr key={item.name}>
                      <td className="border border-gray-300 p-3">{item.name}</td>
                      <td className="border border-gray-300 p-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rates[item.rateKey as keyof typeof rates] as number}
                          onChange={(e) => handleRateChange(item.rateKey, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="border border-gray-300 p-3">
                        <Input
                          type="number"
                          min="0"
                          step={item.name === 'Loading' ? "0.01" : "1"}
                          value={formData[item.quantityKey as keyof typeof formData] as string}
                          onChange={(e) => handleQuantityChange(item.quantityKey, e.target.value)}
                          placeholder="0"
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ MozAppearance: 'textfield' }}
                        />
                      </td>
                      <td className="border border-gray-300 p-3">
                        {calculateItemTotal(rates[item.rateKey as keyof typeof rates] as number, formData[item.quantityKey as keyof typeof formData] as string).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <strong>Total Amount: ₹{totalAmount.toFixed(2)}</strong>
                  {includeOldDue && dueInfo && (
                    <div className="text-sm text-gray-600">
                      (Includes ₹{dueInfo.totalDue.toFixed(2)} previous due)
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="paidAmount">Paid Amount:</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <strong>Due Amount: ₹{dueAmount.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save Transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Due Payment Dialog */}
        <AlertDialog open={showDueDialog} onOpenChange={setShowDueDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Previous Due Found</AlertDialogTitle>
              <AlertDialogDescription>
                This customer has a previous due of ₹{dueInfo?.totalDue.toFixed(2)}. 
                Would you like to include this in the current bill?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIncludeOldDue(false);
                setShowDueDialog(false);
                setShowConfirmDialog(true);
              }}>
                No, Bill Separately
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setIncludeOldDue(true);
                setShowDueDialog(false);
                setShowConfirmDialog(true);
              }}>
                Yes, Include Previous Due
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Save</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to save this transaction? 
                {includeOldDue && dueInfo && paidAmount >= totalAmount && (
                  <div className="mt-2 p-2 bg-green-100 rounded">
                    <strong>Note:</strong> Customer's previous dues will be cleared as they have paid the full amount.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSave}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Billing;
