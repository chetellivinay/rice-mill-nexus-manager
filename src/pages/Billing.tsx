
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, saveTransactions, getTransactions, getInventory, saveInventory, getDefaultRates, saveRates } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Billing = () => {
  const [rates, setRates] = useState(getDefaultRates());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    phone: '',
    millingRate: rates.milling[0],
    millingQuantity: 0,
    powderQuantity: 0,
    bigBagsQuantity: 0,
    smallBagsQuantity: 0,
    branBagsQuantity: 0,
    unloadingQuantity: 0,
    loadingQuantity: 0,
    nukaluQuantity: 0,
    extraQuantity: 0,
    paidAmount: 0
  });

  const calculateItemTotal = (rate: number, quantity: number) => {
    return rate * quantity;
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
    return millingTotal + powderTotal + bigBagsTotal + smallBagsTotal + 
           branBagsTotal + unloadingTotal + loadingTotal + extraTotal - nukaluTotal;
  };

  const totalAmount = calculateTotalAmount();
  const dueAmount = totalAmount - formData.paidAmount;

  const handleSave = () => {
    if (!formData.name || !formData.village) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      name: formData.name,
      village: formData.village,
      phone: formData.phone,
      items: [
        { name: 'Milling', rate: formData.millingRate, quantity: formData.millingQuantity, total: calculateItemTotal(formData.millingRate, formData.millingQuantity) },
        { name: 'Powder', rate: rates.powder, quantity: formData.powderQuantity, total: calculateItemTotal(rates.powder, formData.powderQuantity) },
        { name: 'Big Bags', rate: rates.bigBags, quantity: formData.bigBagsQuantity, total: calculateItemTotal(rates.bigBags, formData.bigBagsQuantity) },
        { name: 'Small Bags', rate: rates.smallBags, quantity: formData.smallBagsQuantity, total: calculateItemTotal(rates.smallBags, formData.smallBagsQuantity) },
        { name: 'Bran Bags', rate: rates.branBags, quantity: formData.branBagsQuantity, total: calculateItemTotal(rates.branBags, formData.branBagsQuantity) },
        { name: 'Unloading', rate: rates.unloading, quantity: formData.unloadingQuantity, total: calculateItemTotal(rates.unloading, formData.unloadingQuantity) },
        { name: 'Loading', rate: rates.loading, quantity: formData.loadingQuantity, total: calculateItemTotal(rates.loading, formData.loadingQuantity) },
        { name: 'Nukalu', rate: rates.nukalu, quantity: formData.nukaluQuantity, total: calculateItemTotal(rates.nukalu, formData.nukaluQuantity) },
        { name: 'Extra Charges', rate: rates.extra, quantity: formData.extraQuantity, total: calculateItemTotal(rates.extra, formData.extraQuantity) }
      ].filter(item => item.quantity > 0),
      totalAmount,
      paidAmount: formData.paidAmount,
      dueAmount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const transactions = getTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);

    // Update inventory
    const inventory = getInventory();
    const updatedInventory = inventory.map(item => {
      if (item.name === 'Powders') {
        return { ...item, count: Math.max(0, item.count - formData.powderQuantity) };
      }
      if (item.name === 'Small Bags') {
        return { ...item, count: Math.max(0, item.count - formData.smallBagsQuantity) };
      }
      if (item.name === 'Big Bags') {
        return { ...item, count: Math.max(0, item.count - formData.bigBagsQuantity) };
      }
      if (item.name === 'Bran Bags') {
        return { ...item, count: Math.max(0, item.count - formData.branBagsQuantity) };
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
      millingQuantity: 0,
      powderQuantity: 0,
      bigBagsQuantity: 0,
      smallBagsQuantity: 0,
      branBagsQuantity: 0,
      unloadingQuantity: 0,
      loadingQuantity: 0,
      nukaluQuantity: 0,
      extraQuantity: 0,
      paidAmount: 0
    });

    setShowConfirmDialog(false);
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
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

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
                          {rates.milling.map((rate) => (
                            <SelectItem key={rate} value={rate.toString()}>{rate.toFixed(2)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <Input
                        type="number"
                        min="0"
                        max="99999"
                        value={formData.millingQuantity}
                        onChange={(e) => setFormData({...formData, millingQuantity: parseInt(e.target.value) || 0})}
                      />
                    </td>
                    <td className="border border-gray-300 p-3">
                      {calculateItemTotal(formData.millingRate, formData.millingQuantity).toFixed(2)}
                    </td>
                  </tr>
                  
                  {/* Similar rows for other items */}
                  {[
                    { name: 'Powder', rate: rates.powder, quantity: 'powderQuantity' },
                    { name: 'Big Bags', rate: rates.bigBags, quantity: 'bigBagsQuantity' },
                    { name: 'Small Bags', rate: rates.smallBags, quantity: 'smallBagsQuantity' },
                    { name: 'Bran Bags', rate: rates.branBags, quantity: 'branBagsQuantity' },
                    { name: 'Unloading', rate: rates.unloading, quantity: 'unloadingQuantity' },
                    { name: 'Loading', rate: rates.loading, quantity: 'loadingQuantity' },
                    { name: 'Nukalu', rate: rates.nukalu, quantity: 'nukaluQuantity' },
                    { name: 'Extra Charges', rate: rates.extra, quantity: 'extraQuantity' }
                  ].map((item) => (
                    <tr key={item.name}>
                      <td className="border border-gray-300 p-3">{item.name}</td>
                      <td className="border border-gray-300 p-3">{item.rate.toFixed(2)}</td>
                      <td className="border border-gray-300 p-3">
                        <Input
                          type="number"
                          min="0"
                          max="99999"
                          value={formData[item.quantity as keyof typeof formData] as number}
                          onChange={(e) => setFormData({
                            ...formData,
                            [item.quantity]: parseInt(e.target.value) || 0
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-3">
                        {calculateItemTotal(item.rate, formData[item.quantity as keyof typeof formData] as number).toFixed(2)}
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
                </div>
                <div>
                  <Label htmlFor="paidAmount">Paid Amount:</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
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

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Save</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to save this transaction? This action cannot be undone.
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
