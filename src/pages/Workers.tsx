
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, User, Edit, Check, X } from 'lucide-react';
import { getWorkers, saveWorkers, WorkerRecord } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Workers = () => {
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<WorkerRecord>>({});
  const [formData, setFormData] = useState({
    name: '',
    borrowedAmount: '',
    salary: ''
  });

  useEffect(() => {
    setWorkers(getWorkers());
  }, []);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newWorker: WorkerRecord = {
      id: Date.now().toString(),
      name: formData.name,
      borrowedAmount: parseFloat(formData.borrowedAmount) || 0,
      salary: parseFloat(formData.salary) || 0,
      totalDue: (parseFloat(formData.borrowedAmount) || 0) - (parseFloat(formData.salary) || 0),
      date: new Date().toLocaleDateString()
    };

    const updatedWorkers = [...workers, newWorker];
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    setFormData({
      name: '',
      borrowedAmount: '',
      salary: ''
    });
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Worker added successfully"
    });
  };

  const startEditWorker = (worker: WorkerRecord) => {
    setEditingWorker(worker.id);
    setEditFormData(worker);
  };

  const saveEditWorker = () => {
    if (!editingWorker || !editFormData.name) return;

    const updatedWorkers = workers.map(worker => {
      if (worker.id === editingWorker) {
        const updatedWorker = {
          ...worker,
          name: editFormData.name || worker.name,
          borrowedAmount: editFormData.borrowedAmount || worker.borrowedAmount,
          salary: editFormData.salary || worker.salary,
          totalDue: (editFormData.borrowedAmount || worker.borrowedAmount) - (editFormData.salary || worker.salary)
        };
        return updatedWorker;
      }
      return worker;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    setEditingWorker(null);
    setEditFormData({});
    
    toast({
      title: "Success",
      description: "Worker updated successfully"
    });
  };

  const cancelEditWorker = () => {
    setEditingWorker(null);
    setEditFormData({});
  };

  const makePayment = (id: string, paymentAmount: number) => {
    const updatedWorkers = workers.map(worker => {
      if (worker.id === id) {
        const newSalary = worker.salary + paymentAmount;
        const newTotalDue = worker.borrowedAmount - newSalary;
        return {
          ...worker,
          salary: newSalary,
          totalDue: newTotalDue
        };
      }
      return worker;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    toast({
      title: "Payment Recorded",
      description: `₹${paymentAmount} salary payment recorded`
    });
  };

  const markSalaryPaid = (id: string) => {
    const updatedWorkers = workers.map(worker => {
      if (worker.id === id) {
        return {
          ...worker,
          salary: worker.borrowedAmount,
          totalDue: 0
        };
      }
      return worker;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    toast({
      title: "Salary Marked as Paid",
      description: "Worker's salary has been fully paid"
    });
  };

  const deleteWorker = (id: string) => {
    const updatedWorkers = workers.filter(worker => worker.id !== id);
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    toast({
      title: "Worker Deleted",
      description: "Worker record has been removed"
    });
  };

  const getTotalBorrowed = () => workers.reduce((sum, w) => sum + w.borrowedAmount, 0);
  const getTotalPaid = () => workers.reduce((sum, w) => sum + w.salary, 0);
  const getTotalDue = () => workers.reduce((sum, w) => sum + w.totalDue, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Workers Management</h1>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={20} className="mr-2" />
            Add Worker
          </Button>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workers.length}</div>
                <div className="text-sm text-gray-600">Total Workers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{getTotalBorrowed().toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Borrowed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{getTotalPaid().toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">₹{getTotalDue().toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Due</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Worker Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Worker Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="borrowedAmount">Borrowed Amount</Label>
                  <Input
                    id="borrowedAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.borrowedAmount}
                    onChange={(e) => setFormData({...formData, borrowedAmount: e.target.value})}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Initial Salary Paid</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex space-x-2 md:col-span-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Add Worker
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Workers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <Card key={worker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  {editingWorker === worker.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="font-bold"
                      />
                      <div className="flex space-x-1">
                        <Button size="sm" onClick={saveEditWorker}>
                          <Check size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditWorker}>
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-lg flex items-center">
                        <User size={20} className="mr-2" />
                        {worker.name}
                      </CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => startEditWorker(worker)}>
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteWorker(worker.id)}>
                          <X size={16} />
                        </Button>
                      </div>
                    </>
                  )}
                  <Badge variant={worker.totalDue <= 0 ? "default" : "destructive"}>
                    {worker.totalDue <= 0 ? "Paid" : "Due"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Joined: {worker.date}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {editingWorker === worker.id ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Borrowed Amount:</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editFormData.borrowedAmount || 0}
                          onChange={(e) => setEditFormData({...editFormData, borrowedAmount: parseFloat(e.target.value) || 0})}
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Salary Paid:</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editFormData.salary || 0}
                          onChange={(e) => setEditFormData({...editFormData, salary: parseFloat(e.target.value) || 0})}
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Borrowed:</span>
                        <span className="font-bold text-orange-600">₹{worker.borrowedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Salary Paid:</span>
                        <span className="font-bold text-green-600">₹{worker.salary.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Due Amount:</span>
                        <span className={`font-bold ${worker.totalDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{worker.totalDue.toFixed(2)}
                        </span>
                      </div>
                      
                      {worker.totalDue > 0 && (
                        <div className="pt-3 border-t space-y-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                                <DollarSign size={16} className="mr-1" />
                                Make Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Make Payment to {worker.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Payment Amount</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={worker.totalDue}
                                    step="0.01"
                                    placeholder="Enter payment amount"
                                    id={`payment-${worker.id}`}
                                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => {
                                      const input = document.getElementById(`payment-${worker.id}`) as HTMLInputElement;
                                      const amount = parseFloat(input?.value || '0');
                                      if (amount > 0) {
                                        makePayment(worker.id, amount);
                                        input.value = '';
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Record Payment
                                  </Button>
                                  <Button
                                    onClick={() => markSalaryPaid(worker.id)}
                                    variant="outline"
                                  >
                                    Pay Full Amount
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No workers found</div>
            <Button onClick={() => setShowAddForm(true)} className="mt-4">
              Add First Worker
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;
