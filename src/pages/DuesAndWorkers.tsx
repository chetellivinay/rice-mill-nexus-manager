
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, FileText, Trash2 } from 'lucide-react';
import { DueRecord, WorkerRecord, getDues, saveDues, getWorkers, saveWorkers } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const DuesAndWorkers = () => {
  const [dues, setDues] = useState<DueRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [showDueForm, setShowDueForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  
  const [dueForm, setDueForm] = useState({
    customerName: '',
    type: 'custom' as 'bran' | 'rice' | 'custom',
    stockType: '',
    amount: 0,
    description: ''
  });

  const [workerForm, setWorkerForm] = useState({
    name: '',
    borrowedAmount: 0,
    salary: 0
  });

  useEffect(() => {
    setDues(getDues());
    setWorkers(getWorkers());
  }, []);

  const addDueRecord = () => {
    if (!dueForm.customerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter customer name",
        variant: "destructive"
      });
      return;
    }

    const newDue: DueRecord = {
      id: Date.now().toString(),
      customerName: dueForm.customerName,
      type: dueForm.type,
      stockType: dueForm.stockType || undefined,
      amount: dueForm.amount,
      description: dueForm.description,
      date: new Date().toLocaleDateString()
    };

    const updatedDues = [...dues, newDue];
    setDues(updatedDues);
    saveDues(updatedDues);
    
    setDueForm({
      customerName: '',
      type: 'custom',
      stockType: '',
      amount: 0,
      description: ''
    });
    setShowDueForm(false);
    
    toast({
      title: "Success",
      description: "Due record added successfully"
    });
  };

  const deleteDueRecord = (id: string) => {
    const updatedDues = dues.filter(due => due.id !== id);
    setDues(updatedDues);
    saveDues(updatedDues);
    
    toast({
      title: "Success",
      description: "Due record deleted successfully"
    });
  };

  const addWorkerRecord = () => {
    if (!workerForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter worker name",
        variant: "destructive"
      });
      return;
    }

    const newWorker: WorkerRecord = {
      id: Date.now().toString(),
      name: workerForm.name,
      borrowedAmount: workerForm.borrowedAmount,
      salary: workerForm.salary,
      totalDue: workerForm.borrowedAmount - workerForm.salary,
      date: new Date().toLocaleDateString()
    };

    const updatedWorkers = [...workers, newWorker];
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    setWorkerForm({
      name: '',
      borrowedAmount: 0,
      salary: 0
    });
    setShowWorkerForm(false);
    
    toast({
      title: "Success",
      description: "Worker record added successfully"
    });
  };

  const updateWorkerPayment = (id: string, newBorrowedAmount: number, newSalary: number) => {
    const updatedWorkers = workers.map(worker => {
      if (worker.id === id) {
        return {
          ...worker,
          borrowedAmount: newBorrowedAmount,
          salary: newSalary,
          totalDue: newBorrowedAmount - newSalary
        };
      }
      return worker;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    toast({
      title: "Success",
      description: "Worker record updated successfully"
    });
  };

  const deleteWorkerRecord = (id: string) => {
    const updatedWorkers = workers.filter(worker => worker.id !== id);
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    toast({
      title: "Success",
      description: "Worker record deleted successfully"
    });
  };

  const stockTypes = ['Bran Stock', 'Dhana Stock', 'Nukalu Stock', 'HMT Rice', 'JSR Rice', 'BPT Rice'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dues & Workers Management</h1>

        <Tabs defaultValue="dues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dues" className="flex items-center space-x-2">
              <FileText size={16} />
              <span>Customer Dues</span>
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center space-x-2">
              <Users size={16} />
              <span>Workers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dues">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Customer Dues Management</h2>
                <Button onClick={() => setShowDueForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus size={20} className="mr-2" />
                  Add Due Record
                </Button>
              </div>

              {showDueForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Due Record</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={dueForm.customerName}
                          onChange={(e) => setDueForm({...dueForm, customerName: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label>Due Type</Label>
                        <Select value={dueForm.type} onValueChange={(value: any) => setDueForm({...dueForm, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bran">Bran Stock</SelectItem>
                            <SelectItem value="rice">Rice Stock</SelectItem>
                            <SelectItem value="custom">Custom Due</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(dueForm.type === 'bran' || dueForm.type === 'rice') && (
                        <div>
                          <Label>Stock Type</Label>
                          <Select value={dueForm.stockType} onValueChange={(value) => setDueForm({...dueForm, stockType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stock type" />
                            </SelectTrigger>
                            <SelectContent>
                              {stockTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          value={dueForm.amount}
                          onChange={(e) => setDueForm({...dueForm, amount: parseFloat(e.target.value) || 0})}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={dueForm.description}
                          onChange={(e) => setDueForm({...dueForm, description: e.target.value})}
                          placeholder="Enter description (optional)"
                        />
                      </div>
                      <div className="md:col-span-2 flex space-x-2">
                        <Button onClick={addDueRecord} className="bg-green-600 hover:bg-green-700">
                          Add Due Record
                        </Button>
                        <Button variant="outline" onClick={() => setShowDueForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dues.map((due) => (
                  <Card key={due.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{due.customerName}</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDueRecord(due.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">{due.date}</div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Type:</span>
                          <span className="capitalize">{due.type}</span>
                        </div>
                        {due.stockType && (
                          <div className="flex justify-between">
                            <span className="font-medium">Stock:</span>
                            <span>{due.stockType}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium">Amount:</span>
                          <span className="font-bold text-red-600">₹{due.amount.toFixed(2)}</span>
                        </div>
                        {due.description && (
                          <div className="mt-2">
                            <span className="font-medium">Description:</span>
                            <p className="text-sm text-gray-600 mt-1">{due.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {dues.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">No due records found</div>
                  <Button onClick={() => setShowDueForm(true)} className="mt-4">
                    Add First Due Record
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="workers">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Workers Management</h2>
                <Button onClick={() => setShowWorkerForm(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus size={20} className="mr-2" />
                  Add Worker
                </Button>
              </div>

              {showWorkerForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Worker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="workerName">Worker Name *</Label>
                        <Input
                          id="workerName"
                          value={workerForm.name}
                          onChange={(e) => setWorkerForm({...workerForm, name: e.target.value})}
                          placeholder="Enter worker name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="borrowedAmount">Borrowed Amount</Label>
                        <Input
                          id="borrowedAmount"
                          type="number"
                          min="0"
                          value={workerForm.borrowedAmount}
                          onChange={(e) => setWorkerForm({...workerForm, borrowedAmount: parseFloat(e.target.value) || 0})}
                          placeholder="Amount borrowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salary">Salary Paid</Label>
                        <Input
                          id="salary"
                          type="number"
                          min="0"
                          value={workerForm.salary}
                          onChange={(e) => setWorkerForm({...workerForm, salary: parseFloat(e.target.value) || 0})}
                          placeholder="Salary paid"
                        />
                      </div>
                      <div className="md:col-span-3 flex space-x-2">
                        <Button onClick={addWorkerRecord} className="bg-green-600 hover:bg-green-700">
                          Add Worker
                        </Button>
                        <Button variant="outline" onClick={() => setShowWorkerForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">Worker Name</th>
                      <th className="border border-gray-300 p-3 text-center">Borrowed Amount</th>
                      <th className="border border-gray-300 p-3 text-center">Salary Paid</th>
                      <th className="border border-gray-300 p-3 text-center">Total Due</th>
                      <th className="border border-gray-300 p-3 text-center">Date</th>
                      <th className="border border-gray-300 p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((worker) => (
                      <tr key={worker.id}>
                        <td className="border border-gray-300 p-3 font-medium">{worker.name}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={worker.borrowedAmount}
                            onChange={(e) => updateWorkerPayment(worker.id, parseFloat(e.target.value) || 0, worker.salary)}
                            className="w-24 mx-auto"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={worker.salary}
                            onChange={(e) => updateWorkerPayment(worker.id, worker.borrowedAmount, parseFloat(e.target.value) || 0)}
                            className="w-24 mx-auto"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <span className={`font-bold ${worker.totalDue > 0 ? 'text-red-600' : worker.totalDue < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            ₹{Math.abs(worker.totalDue).toFixed(2)}
                            {worker.totalDue > 0 ? ' (Due)' : worker.totalDue < 0 ? ' (Advance)' : ''}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">{worker.date}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteWorkerRecord(worker.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {workers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">No worker records found</div>
                  <Button onClick={() => setShowWorkerForm(true)} className="mt-4">
                    Add First Worker
                  </Button>
                </div>
              )}

              {/* Summary */}
              {workers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Workers Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          ₹{workers.reduce((sum, w) => sum + w.borrowedAmount, 0).toFixed(2)}
                        </div>
                        <div className="text-gray-600">Total Borrowed</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{workers.reduce((sum, w) => sum + w.salary, 0).toFixed(2)}
                        </div>
                        <div className="text-gray-600">Total Salary Paid</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded">
                        <div className="text-2xl font-bold text-red-600">
                          ₹{workers.reduce((sum, w) => sum + Math.max(0, w.totalDue), 0).toFixed(2)}
                        </div>
                        <div className="text-gray-600">Total Outstanding</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DuesAndWorkers;
