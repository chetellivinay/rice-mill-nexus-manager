
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Save, X, DollarSign, User, Calendar, FileText } from 'lucide-react';
import { getWorkers, saveWorkers, WorkerRecord } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

interface LoanRecord {
  id: string;
  amount: number;
  date: string;
  reason: string;
  status: 'active' | 'paid';
}

interface PaymentRecord {
  id: string;
  type: 'salary' | 'loan_repayment';
  amount: number;
  date: string;
  description?: string;
  loanId?: string; // Reference to loan being repaid
}

interface ExtendedWorkerRecord extends WorkerRecord {
  loans: LoanRecord[];
  payments: PaymentRecord[];
  totalActiveLoanAmount: number;
}

const Workers = () => {
  const [workers, setWorkers] = useState<ExtendedWorkerRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState<string | null>(null);
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [paymentAmounts, setPaymentAmounts] = useState<{[key: string]: string}>({});
  const [loanData, setLoanData] = useState({
    amount: '',
    reason: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    description: ''
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = () => {
    const workerData = getWorkers();
    const extendedWorkers = workerData.map(worker => {
      const loans = worker.loans || [];
      const totalActiveLoanAmount = loans
        .filter(loan => loan.status === 'active')
        .reduce((sum, loan) => sum + loan.amount, 0);
      
      return {
        ...worker,
        loans,
        payments: worker.payments || [],
        totalActiveLoanAmount,
        totalDue: totalActiveLoanAmount
      };
    });
    setWorkers(extendedWorkers);
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newWorker: ExtendedWorkerRecord = {
      id: Date.now().toString(),
      name: formData.name,
      salary: parseFloat(formData.salary) || 0,
      borrowedAmount: 0,
      totalDue: 0,
      date: new Date().toLocaleDateString(),
      loans: [],
      payments: [],
      totalActiveLoanAmount: 0,
      paymentHistory: []
    };

    const updatedWorkers = [...workers, newWorker];
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    
    setFormData({ name: '', salary: '', description: '' });
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Worker added successfully"
    });
  };

  const addLoan = (workerId: string) => {
    const amount = parseFloat(loanData.amount);
    if (amount <= 0 || !loanData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter valid amount and reason",
        variant: "destructive"
      });
      return;
    }

    const newLoan: LoanRecord = {
      id: Date.now().toString(),
      amount,
      date: new Date().toLocaleDateString(),
      reason: loanData.reason,
      status: 'active'
    };

    const updatedWorkers = workers.map(w => {
      if (w.id === workerId) {
        const updatedLoans = [...w.loans, newLoan];
        const totalActiveLoanAmount = updatedLoans
          .filter(loan => loan.status === 'active')
          .reduce((sum, loan) => sum + loan.amount, 0);

        return {
          ...w,
          loans: updatedLoans,
          borrowedAmount: w.borrowedAmount + amount,
          totalDue: totalActiveLoanAmount,
          totalActiveLoanAmount
        };
      }
      return w;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    setLoanData({ amount: '', reason: '' });
    setShowLoanForm(null);
    
    toast({
      title: "Loan Added",
      description: `₹${amount} loan recorded for worker`
    });
  };

  const addPayment = (workerId: string, type: 'salary' | 'loan_repayment', amount: number) => {
    const updatedWorkers = workers.map(w => {
      if (w.id === workerId) {
        const newPayment: PaymentRecord = {
          id: Date.now().toString(),
          type,
          amount,
          date: new Date().toLocaleDateString()
        };

        let updatedLoans = w.loans;
        let totalActiveLoanAmount = w.totalActiveLoanAmount;

        if (type === 'loan_repayment') {
          // Deduct from active loans (FIFO - oldest loans first)
          let remainingAmount = amount;
          updatedLoans = w.loans.map(loan => {
            if (loan.status === 'active' && remainingAmount > 0) {
              if (loan.amount <= remainingAmount) {
                remainingAmount -= loan.amount;
                return { ...loan, status: 'paid' as const };
              } else {
                const updatedLoan = { ...loan, amount: loan.amount - remainingAmount };
                remainingAmount = 0;
                return updatedLoan;
              }
            }
            return loan;
          });

          totalActiveLoanAmount = Math.max(0, totalActiveLoanAmount - amount);
        }

        return {
          ...w,
          loans: updatedLoans,
          payments: [...w.payments, newPayment],
          totalActiveLoanAmount,
          totalDue: totalActiveLoanAmount
        };
      }
      return w;
    });
    
    setWorkers(updatedWorkers);
    saveWorkers(updatedWorkers);
    setPaymentAmounts({...paymentAmounts, [workerId]: ''});
    
    toast({
      title: "Payment Recorded",
      description: `${type === 'salary' ? 'Salary' : 'Loan repayment'} of ₹${amount} recorded successfully`
    });
  };

  const startEditing = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      setEditData({
        name: worker.name,
        salary: worker.salary.toString()
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
          salary: parseFloat(editData.salary) || 0
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

  const getTotalSalaryPaid = () => {
    return workers.reduce((sum, w) => {
      const salaryPayments = w.payments?.filter(p => p.type === 'salary').reduce((s, p) => s + p.amount, 0) || 0;
      return sum + salaryPayments;
    }, 0);
  };

  const getTotalActiveLoan = () => {
    return workers.reduce((sum, w) => sum + w.totalActiveLoanAmount, 0);
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
              <div className="text-2xl font-bold text-red-600">₹{getTotalActiveLoan().toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Active Loans</div>
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
                          Active Loans: ₹{worker.totalActiveLoanAmount.toFixed(2)} • 
                          Joined: {worker.date}
                        </div>
                      </>
                    )}
                  </div>
                  {editingWorker !== worker.id && (
                    <div className="flex items-center space-x-2">
                      <Badge variant={worker.totalActiveLoanAmount > 0 ? "destructive" : "secondary"}>
                        Loan: ₹{worker.totalActiveLoanAmount.toFixed(2)}
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
                {/* Payment Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

                  {/* Add Loan */}
                  <div className="space-y-2">
                    <Label>Add Loan</Label>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowLoanForm(worker.id)}
                      className="w-full"
                    >
                      <DollarSign size={16} className="mr-1" />
                      Add Loan
                    </Button>
                  </div>

                  {/* Loan Repayment */}
                  <div className="space-y-2">
                    <Label>Loan Repayment</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="0"
                        max={worker.totalActiveLoanAmount}
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
                          if (amount > 0 && amount <= worker.totalActiveLoanAmount) {
                            addPayment(worker.id, 'loan_repayment', amount);
                          }
                        }}
                        disabled={worker.totalActiveLoanAmount === 0}
                      >
                        Repay
                      </Button>
                    </div>
                  </div>

                  {/* Loan History */}
                  <div className="space-y-2">
                    <Label>Active Loans ({worker.loans.filter(l => l.status === 'active').length})</Label>
                    <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                      {worker.loans.filter(loan => loan.status === 'active').map((loan) => (
                        <div key={loan.id} className="flex justify-between">
                          <span>₹{loan.amount}</span>
                          <span>{loan.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loan Form */}
                {showLoanForm === worker.id && (
                  <Card className="mt-4 border-red-200">
                    <CardHeader>
                      <CardTitle className="text-sm">Add New Loan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={loanData.amount}
                            onChange={(e) => setLoanData({...loanData, amount: e.target.value})}
                            placeholder="Loan amount"
                          />
                        </div>
                        <div>
                          <Label>Reason</Label>
                          <Textarea
                            value={loanData.reason}
                            onChange={(e) => setLoanData({...loanData, reason: e.target.value})}
                            placeholder="Reason for loan"
                            className="min-h-[40px]"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <Button
                            size="sm"
                            onClick={() => addLoan(worker.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Add Loan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowLoanForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment History */}
                {worker.payments && worker.payments.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Recent Transactions</Label>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {worker.payments.slice(-5).reverse().map((payment) => (
                        <div key={payment.id} className="text-xs text-gray-600 flex justify-between">
                          <span>
                            {payment.type === 'salary' ? 'Salary' : 'Loan Repayment'} - ₹{payment.amount.toFixed(2)}
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
            <p className="text-sm text-gray-400 mt-2">Add workers to manage their salary and loan records</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;
