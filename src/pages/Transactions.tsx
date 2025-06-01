
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, DollarSign, Clock } from 'lucide-react';
import { getTransactions, Transaction } from '@/utils/localStorage';
import { getCustomerDueInfo } from '@/utils/dueUtils';
import DueDisplay from '@/components/DueDisplay';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDayCalculation, setShowDayCalculation] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    const allTransactions = getTransactions();
    // Sort transactions by date (most recent first), then by time (most recent first)
    const sortedTransactions = allTransactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // Most recent date first
      }
      
      // If dates are the same, sort by time (most recent first)
      const timeA = new Date(`1970-01-01 ${a.time}`);
      const timeB = new Date(`1970-01-01 ${b.time}`);
      return timeB.getTime() - timeA.getTime();
    });
    
    setTransactions(sortedTransactions);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.phone.includes(searchTerm);

    const matchesDate = selectedDate === '' || transaction.date === selectedDate;

    return matchesSearch && matchesDate;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  // Calculate totals for selected date or today
  const calculateDayTotals = (date: string) => {
    const dayTransactions = transactions.filter(t => t.date === date);
    const totalIncome = dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalHamali = dayTransactions.reduce((sum, t) => {
      const millingItem = t.items.find(item => item.name === 'Milling');
      return sum + (millingItem ? millingItem.total : 0);
    }, 0);
    return { totalIncome, totalHamali, transactionCount: dayTransactions.length };
  };

  const todayDate = new Date().toLocaleDateString();
  const todayTotals = calculateDayTotals(todayDate);
  const selectedDateTotals = selectedDate ? calculateDayTotals(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>

        {/* Today's Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">₹{todayTotals.totalIncome.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Today's Total Income</div>
              <div className="text-xs text-gray-500">{todayTotals.transactionCount} transactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">₹{todayTotals.totalHamali.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Today's Total Hamali</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowDayCalculation(!showDayCalculation)}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calculate Day Totals
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Totals */}
        {selectedDateTotals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">₹{selectedDateTotals.totalIncome.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Selected Day Income</div>
                <div className="text-xs text-gray-500">{selectedDateTotals.transactionCount} transactions</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-blue-600">₹{selectedDateTotals.totalHamali.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Selected Day Hamali</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, village, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {showDayCalculation && (
                <div>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="Select date"
                  />
                </div>
              )}
              
              <div className="text-sm text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Total Transactions: {filteredTransactions.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-6">
          {Object.keys(groupedTransactions)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort dates descending
            .map((date) => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatDate(date)}
                <Badge variant="outline" className="ml-2">
                  {groupedTransactions[date].length} transactions
                </Badge>
              </h2>
              
              <div className="grid gap-4">
                {groupedTransactions[date].map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-lg">{transaction.name}</h3>
                          <p className="text-sm text-gray-600">{transaction.village}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {transaction.phone && (
                              <>
                                <span className="text-sm text-gray-500">{transaction.phone}</span>
                                <DueDisplay phone={transaction.phone} variant="outline" className="text-xs" />
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                            <Clock className="h-3 w-3" />
                            {transaction.time}
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            ₹{transaction.totalAmount.toFixed(2)}
                          </div>
                          {transaction.dueAmount > 0 && (
                            <div className="text-sm text-red-600">
                              Due: ₹{transaction.dueAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-gray-600">{item.name}:</span>
                              <span className="font-medium">{item.quantity} × ₹{item.rate}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                          <span>Paid: ₹{transaction.paidAmount.toFixed(2)}</span>
                          <span>Due: ₹{transaction.dueAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No transactions found</div>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
