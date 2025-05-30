
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { QueueCustomer, saveQueueCustomers, getQueueCustomers } from '@/utils/localStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const QueueLine = () => {
  const [customers, setCustomers] = useState<QueueCustomer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadFilter, setLoadFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    driverName: '',
    driverPhone: '',
    loadBrought: ''
  });

  useEffect(() => {
    setCustomers(getQueueCustomers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: QueueCustomer = {
      id: Date.now().toString(),
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      driverName: formData.driverName || undefined,
      driverPhone: formData.driverPhone || undefined,
      loadBrought: parseInt(formData.loadBrought),
      arrivalTime: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };

    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    saveQueueCustomers(updatedCustomers);
    
    setFormData({
      name: '',
      phoneNumber: '',
      driverName: '',
      driverPhone: '',
      loadBrought: ''
    });
    setShowForm(false);
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phoneNumber.includes(searchTerm);
      
      if (loadFilter === 'all') return matchesSearch;
      if (loadFilter === 'low') return matchesSearch && customer.loadBrought <= 10;
      if (loadFilter === 'medium') return matchesSearch && customer.loadBrought > 10 && customer.loadBrought <= 50;
      if (loadFilter === 'high') return matchesSearch && customer.loadBrought > 50;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.loadBrought - a.loadBrought;
      } else {
        return a.loadBrought - b.loadBrought;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Queue Line Management</h1>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={20} className="mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Filter by Load</Label>
                <Select value={loadFilter} onValueChange={setLoadFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Loads</SelectItem>
                    <SelectItem value="low">Low (≤10 bags)</SelectItem>
                    <SelectItem value="medium">Medium (11-50 bags)</SelectItem>
                    <SelectItem value="high">High ({'>'}50 bags)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort by Load</Label>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full"
                >
                  <ArrowUpDown size={16} className="mr-2" />
                  {sortOrder === 'desc' ? 'High to Low' : 'Low to High'}
                </Button>
              </div>
              <div>
                <Label>Total Customers</Label>
                <div className="p-2 bg-blue-100 rounded text-center font-bold text-blue-800">
                  {filteredAndSortedCustomers.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="driverName">Driver's Name (Optional)</Label>
                  <Input
                    id="driverName"
                    value={formData.driverName}
                    onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="driverPhone">Driver's Phone (Optional)</Label>
                  <Input
                    id="driverPhone"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({...formData, driverPhone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="loadBrought">Load Brought (Bag Count) *</Label>
                  <Input
                    id="loadBrought"
                    type="number"
                    required
                    min="1"
                    value={formData.loadBrought}
                    onChange={(e) => setFormData({...formData, loadBrought: e.target.value})}
                  />
                </div>
                <div className="flex space-x-2 items-end">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Save Customer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Customer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{customer.name}</CardTitle>
                <div className="text-sm text-gray-600">
                  {customer.date} at {customer.arrivalTime}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Phone:</strong> {customer.phoneNumber}</div>
                  {customer.driverName && (
                    <div><strong>Driver:</strong> {customer.driverName}</div>
                  )}
                  {customer.driverPhone && (
                    <div><strong>Driver Phone:</strong> {customer.driverPhone}</div>
                  )}
                  <div className="flex justify-between items-center">
                    <span><strong>Load:</strong> {customer.loadBrought} bags</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      customer.loadBrought <= 10 ? 'bg-yellow-100 text-yellow-800' :
                      customer.loadBrought <= 50 ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {customer.loadBrought <= 10 ? 'Low' :
                       customer.loadBrought <= 50 ? 'Medium' : 'High'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No customers found</div>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Add First Customer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueLine;
