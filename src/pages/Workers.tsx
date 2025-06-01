
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Save, X, DollarSign, User } from 'lucide-react';
import { getWorkers, saveWorkers, WorkerRecord } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

interface ExtendedWorkerRecord extends WorkerRecord {
  paymentHistory: Array<{
    id: string;
    type: 'salary' | 'borrow' | 'repay';
    amount: number;
    date: string;
    description?: string;
  }>;
}

const Workers = () => {
  const [workers, setWorkers] = useState<ExtendedWorkerRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [paymentAmounts, setPaymentAmounts] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    borrowedAmount: '',
    description: ''
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = () => {
    const workerData = getWorkers();
    const extendedWorkers = workerData.map(worker => ({
      ...worker,
      paymentHistory: worker.paymentHistory || []
    }));
    setWorkers(extendedWorkers);
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newWorker: ExtendedWorkerRecord = {
      id: Date.now().toString(),
      name: formData.name,
      salary: parseFloat(formData.salary) || 0,
      borrowedAmount: parseFloat(formData.borrowedAmount) || 0,
      totalDue: parseFloat(formData.borrowedAmount) || 0,
      date: new Date().toLocaleDateString(),
      paymentHistory: formData.borrowedAmount ? [{
        id: Date.now().toString(),
        type: 'borrow',
        amount: parseFloat(formData.borrowedAmount),
        date: new Date().toLocaleDateString(),
        description: formData.description
      }] : []
    };

    const updatedWorkers = [...workers, newWorker];
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    setFormData({ name: '', salary: '', borrowedAmount: '', description: '' });
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Worker added successfully"
    });
  };

  const startEditing = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      setEditData({
        name: worker.name,
        salary: worker.salary.toString(),
        borrowedAmount: worker.borrowedAmount.toString()
      });
      setEditingWorker(workerId);
    }
  };

  const saveEdit = (workerId: string) => {
    const updatedWorkers = workers.map(w => {
      if (w.id === workerId) {
        return {
          ...w,
          name: editData.name,
          salary: parseFloat(editData.salary) || 0,
          borrowedAmount: parseFloat(editData.borrowedAmount) || 0,
          totalDue: parseFloat(editData.borrowedAmount) || 0
        };
      }
      return w;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    setEditingWorker(null);
    setEditData({});
    
    toast({
      title: "Updated",
      description: "Worker information updated successfully"
    });
  };

  const addPayment = (workerId: string, type: 'salary' | 'borrow' | 'repay', amount: number) => {
    const updatedWorkers = workers.map(w => {
      if (w.id === workerId) {
        const newPayment = {
          id: Date.now().toString(),
          type,
          amount,
          date: new Date().toLocaleDateString()
        };

        let newTotalDue = w.totalDue;
        if (type === 'borrow') {
          newTotalDue += amount;
        } else if (type === 'repay') {
          newTotalDue = Math.max(0, newTotalDue - amount);
        }

        return {
          ...w,
          borrowedAmount: type === 'borrow' ? w.borrowedAmount + amount : w.borrowedAmount,
          totalDue: newTotalDue,
          paymentHistory: [...(w.paymentHistory || []), newPayment]
        };
      }
      return w;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    setPaymentAmounts({...paymentAmounts, [workerId]: ''});
    
    toast({
      title: "Payment Recorded",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} of ₹${amount} recorded successfully`
    });
  };

  const getTotalSalaryPaid = () => {
    return workers.reduce((sum, w) => {
      const salaryPayments = w.paymentHistory?.filter(p => p.type === 'salary').reduce((s, p) => s + p.amount, 0) || 0;
      return sum + salaryPayments;
    }, 0);
  };

  const getTotalBorrowed = () => {
    return workers.reduce((sum, w) => sum + w.totalDue, 0);
  };

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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{workers.length}</div>
              <div className="text-sm text-gray-600">Total Workers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">₹{getTotalSalaryPaid().toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Salary Paid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">₹{getTotalBorrowed().toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Amount Due</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Worker Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="salary">Monthly Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="borrowedAmount">Initial Borrowed Amount</Label>
                  <Input
                    id="borrowedAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.borrowedAmount}
                    onChange={(e) => setFormData({...formData, borrowedAmount: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex space-x-2 md:col-span-2">
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
        <div className="space-y-4">
          {workers.map((worker) => (
            <Card key={worker.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editingWorker === worker.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          placeholder="Worker name"
                        />
                        <Input
                          type="number"
                          value={editData.salary}
                          onChange={(e) => setEditData({...editData, salary: e.target.value})}
                          placeholder="Monthly salary"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => saveEdit(worker.id)}>
                            <Save size={16} className="mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingWorker(null)}>
                            <X size={16} className="mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {worker.name}
                        </CardTitle>
                        <div className="text-sm text-gray-600 mt-1">
                          Monthly Salary: ₹{worker.salary.toFixed(2)} • 
                          Total Due: ₹{worker.totalDue.toFixed(2)} • 
                          Joined: {worker.date}
                        </div>
                      </>
                    )}
                  </div>
                  {editingWorker !== worker.id && (
                    <div className="flex items-center space-x-2">
                      <Badge variant={worker.totalDue > 0 ? "destructive" : "secondary"}>
                        Due: ₹{worker.totalDue.toFixed(2)}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => startEditing(worker.id)}>
                        <Edit size={16} className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Salary Payment */}
                  <div className="space-y-2">
                    <Label>Pay Salary</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={paymentAmounts[`${worker.id}_salary`] || ''}
                        onChange={(e) => setPaymentAmounts({
                          ...paymentAmounts,
                          [`${worker.id}_salary`]: e.target.value
                        })}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const amount = parseFloat(paymentAmounts[`${worker.id}_salary`] || '0');
                          if (amount > 0) {
                            addPayment(worker.id, 'salary', amount);
                          }
                        }}
                      >
                        Pay
                      </Button>
                    </div>
                  </div>

                  {/* Borrow Money */}
                  <div className="space-y-2">
                    <Label>Borrow Money</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={paymentAmounts[`${worker.id}_borrow`] || ''}
                        onChange={(e) => setPaymentAmounts({
                          ...paymentAmounts,
                          [`${worker.id}_borrow`]: e.target.value
                        })}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const amount = parseFloat(paymentAmounts[`${worker.id}_borrow`] || '0');
                          if (amount > 0) {
                            addPayment(worker.id, 'borrow', amount);
                          }
                        }}
                      >
                        Lend
                      </Button>
                    </div>
                  </div>

                  {/* Repay Money */}
                  <div className="space-y-2">
                    <Label>Repay Money</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="0"
                        max={worker.totalDue}
                        step="0.01"
                        placeholder="Amount"
                        value={paymentAmounts[`${worker.id}_repay`] || ''}
                        onChange={(e) => setPaymentAmounts({
                          ...paymentAmounts,
                          [`${worker.id}_repay`]: e.target.value
                        })}
                      />
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const amount = parseFloat(paymentAmounts[`${worker.id}_repay`] || '0');
                          if (amount > 0 && amount <= worker.totalDue) {
                            addPayment(worker.id, 'repay', amount);
                          }
                        }}
                      >
                        Repay
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {worker.paymentHistory && worker.paymentHistory.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Recent Transactions</Label>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {worker.paymentHistory.slice(-5).reverse().map((payment) => (
                        <div key={payment.id} className="text-xs text-gray-600 flex justify-between">
                          <span>
                            {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} - ₹{payment.amount.toFixed(2)}
                          </span>
                          <span>{payment.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {workers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No workers added yet</div>
            <p className="text-sm text-gray-400 mt-2">Add workers to manage their salary and borrowed amounts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;
