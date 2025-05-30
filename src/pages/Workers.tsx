
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, DollarSign, User } from 'lucide-react';
import { getWorkers, saveWorkers, WorkerRecord } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Workers = () => {
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
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

  const updateWorkerPayment = (id: string, paymentAmount: number) => {
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
      title: "Payment Updated",
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
                  <CardTitle className="text-lg flex items-center">
                    <User size={20} className="mr-2" />
                    {worker.name}
                  </CardTitle>
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
                      <Button
                        size="sm"
                        onClick={() => markSalaryPaid(worker.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign size={16} className="mr-1" />
                        Mark as Fully Paid
                      </Button>
                    </div>
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
