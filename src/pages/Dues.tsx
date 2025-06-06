
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, Trash2, Search, TrendingUp, Users, Package, FileText } from 'lucide-react';
import { DueRecord, getDues, saveDues, getTransactions, getStockTransactions } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Dues = () => {
  const [dues, setDues] = useState<DueRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDueType, setSelectedDueType] = useState<'all' | 'transaction' | 'stock' | 'custom'>('all');
  const [formData, setFormData] = useState({
    customerName: '',
    type: 'bran' as 'bran' | 'rice' | 'custom',
    stockType: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    setDues(getDues());
  }, []);

  const getTransactionDues = () => {
    const transactions = getTransactions();
    return transactions.filter(t => t.dueAmount > 0);
  };

  const getStockDues = () => {
    const stockTransactions = getStockTransactions();
    return stockTransactions.filter(t => t.dueAmount > 0);
  };

  const getCustomDues = () => {
    return dues.filter(due => due.type === 'custom');
  };

  const filteredDues = dues.filter(due => {
    const matchesSearch = due.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (due.stockType && due.stockType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedDueType === 'all') return matchesSearch;
    return matchesSearch && due.type === selectedDueType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newDue: DueRecord = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      type: formData.type,
      stockType: formData.stockType,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: new Date().toLocaleDateString()
    };

    const updatedDues = [...dues, newDue];
    setDues(updatedDues);
    saveDues(updatedDues);

    setFormData({
      customerName: '',
      type: 'bran',
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

  const deleteDue = (id: string) => {
    const updatedDues = dues.filter(due => due.id !== id);
    setDues(updatedDues);
    saveDues(updatedDues);
    
    toast({
      title: "Due Deleted",
      description: "Due record has been deleted"
    });
  };

  const transactionDues = getTransactionDues();
  const stockDues = getStockDues();
  const customDues = getCustomDues();

  const totalTransactionDues = transactionDues.reduce((sum, t) => sum + t.dueAmount, 0);
  const totalStockDues = stockDues.reduce((sum, t) => sum + t.dueAmount, 0);
  const totalCustomDues = customDues.reduce((sum, d) => sum + d.amount, 0);
  const totalDues = totalTransactionDues + totalStockDues + totalCustomDues;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dues Management</h1>
          <Button onClick={() => setShowAddForm(true)} className="bg-red-600 hover:bg-red-700">
            <Plus size={20} className="mr-2" />
            Add Due
          </Button>
        </div>

        {/* Dues Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Dues</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalDues.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{transactionDues.length + stockDues.length + customDues.length} records</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transaction Dues</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalTransactionDues.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{transactionDues.length} records</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Dues</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalStockDues.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{stockDues.length} records</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Custom Dues</p>
                  <p className="text-2xl font-bold text-orange-600">₹{totalCustomDues.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{customDues.length} records</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, description, or stock type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedDueType === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedDueType('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedDueType === 'transaction' ? 'default' : 'outline'}
                  onClick={() => setSelectedDueType('transaction')}
                >
                  Transaction
                </Button>
                <Button
                  variant={selectedDueType === 'stock' ? 'default' : 'outline'}
                  onClick={() => setSelectedDueType('stock')}
                >
                  Stock
                </Button>
                <Button
                  variant={selectedDueType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSelectedDueType('custom')}
                >
                  Custom
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Due Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Due</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'bran' | 'rice' | 'custom'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bran">Bran</option>
                    <option value="rice">Rice</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {formData.type !== 'custom' && (
                  <div>
                    <Label htmlFor="stockType">Stock Type</Label>
                    <Input
                      id="stockType"
                      value={formData.stockType}
                      onChange={(e) => setFormData({...formData, stockType: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
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
                    placeholder="Additional details about the due"
                  />
                </div>
                <div className="flex space-x-2 md:col-span-2">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    Add Due
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Dues List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Outstanding Dues</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Date</th>
                    <th className="border border-gray-300 p-3 text-left">Customer</th>
                    <th className="border border-gray-300 p-3 text-left">Type</th>
                    <th className="border border-gray-300 p-3 text-left">Stock Type</th>
                    <th className="border border-gray-300 p-3 text-center">Amount</th>
                    <th className="border border-gray-300 p-3 text-left">Description</th>
                    <th className="border border-gray-300 p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDues.map((due) => (
                    <tr key={due.id}>
                      <td className="border border-gray-300 p-3">{due.date}</td>
                      <td className="border border-gray-300 p-3 font-medium">{due.customerName}</td>
                      <td className="border border-gray-300 p-3">
                        <Badge variant={due.type === 'bran' ? 'default' : due.type === 'rice' ? 'secondary' : 'outline'}>
                          {due.type}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 p-3">{due.stockType || '-'}</td>
                      <td className="border border-gray-300 p-3 text-center font-bold text-red-600">
                        ₹{due.amount.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-3">{due.description || '-'}</td>
                      <td className="border border-gray-300 p-3 text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteDue(due.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDues.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No dues found matching your search' : 'No dues recorded yet'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dues;
