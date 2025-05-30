
import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { QueueCustomer, saveQueueCustomers, getQueueCustomers } from '@/utils/localStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

const QueueLine = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<QueueCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadFilter, setLoadFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    driverName: '',
    driverPhone: '',
    loadBrought: '',
    village: ''
  });

  useEffect(() => {
    setCustomers(getQueueCustomers());
  }, []);

  const handlePhoneInput = (value: string, field: 'phoneNumber' | 'driverPhone') => {
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setFormData({...formData, [field]: numericValue});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phoneNumber.length !== 10) {
      toast({
        title: "Error",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive"
      });
      return;
    }

    const newCustomer: QueueCustomer = {
      id: Date.now().toString(),
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      driverName: formData.driverName || undefined,
      driverPhone: formData.driverPhone || undefined,
      loadBrought: parseInt(formData.loadBrought),
      arrivalTime: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      village: formData.village
    };

    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    saveQueueCustomers(updatedCustomers);
    
    setFormData({
      name: '',
      phoneNumber: '',
      driverName: '',
      driverPhone: '',
      loadBrought: '',
      village: ''
    });
    
    toast({
      title: "Success",
      description: "Customer added to queue successfully"
    });
  };

  const removeCustomer = (id: string) => {
    const updatedCustomers = customers.filter(customer => customer.id !== id);
    setCustomers(updatedCustomers);
    saveQueueCustomers(updatedCustomers);
    
    toast({
      title: "Customer Removed",
      description: "Customer has been removed from the queue"
    });
  };

  const createBill = (customer: QueueCustomer) => {
    // Store customer data for billing page
    localStorage.setItem('billingCustomerData', JSON.stringify({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      village: customer.village || ''
    }));
    
    navigate('/billing');
    
    toast({
      title: "Billing Ready",
      description: "Customer data has been pre-filled in billing form"
    });
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
        </div>

        {/* Customer Form - Always Visible */}
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
                <Label htmlFor="phoneNumber">Phone Number * (10 digits)</Label>
                <Input
                  id="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneInput(e.target.value, 'phoneNumber')}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
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
                  onChange={(e) => handlePhoneInput(e.target.value, 'driverPhone')}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
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
              <div className="flex space-x-2 items-end md:col-span-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Save Customer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Line</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Driver Phone</TableHead>
                    <TableHead>Load (Bags)</TableHead>
                    <TableHead>Arrival Date & Time</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCustomers.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell>{customer.driverName || '-'}</TableCell>
                      <TableCell>{customer.driverPhone || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          customer.loadBrought <= 10 ? 'bg-yellow-100 text-yellow-800' :
                          customer.loadBrought <= 50 ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {customer.loadBrought} bags
                        </span>
                      </TableCell>
                      <TableCell>{customer.date} at {customer.arrivalTime}</TableCell>
                      <TableCell>{customer.village || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => createBill(customer)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Create Bill
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeCustomer(customer.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAndSortedCustomers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No customers found</div>
                <p className="text-sm text-gray-400 mt-2">Add customers using the form above</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueLine;
