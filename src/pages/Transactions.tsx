
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Calendar, Eye, Trash2 } from 'lucide-react';
import { getTransactions, Transaction } from '@/utils/localStorage';
import InventoryMismatch from '@/components/InventoryMismatch';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showTodayTotal, setShowTodayTotal] = useState(false);
  const [showHamali, setShowHamali] = useState(false);

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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.phone.includes(searchTerm);

    const matchesDue = !showDueOnly || transaction.dueAmount > 0;

    return matchesSearch && matchesDue;
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

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Monday'; // or get actual day name
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Monday'; // or get actual day name
    } else {
      return date.toLocaleDateString('en-GB', { weekday: 'long' });
    }
  };

  const getTransactionCountForDate = (date: string) => {
    return groupedTransactions[date]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>

        {/* Inventory Management Section */}
        <InventoryMismatch />

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant={showDueOnly ? "default" : "outline"}
                onClick={() => setShowDueOnly(!showDueOnly)}
              >
                Show Due Only
              </Button>
              
              <Button
                variant={showTodayTotal ? "default" : "outline"}
                onClick={() => setShowTodayTotal(!showTodayTotal)}
              >
                Calculate Today's Total
              </Button>
              
              <Button
                variant={showHamali ? "default" : "outline"}
                onClick={() => setShowHamali(!showHamali)}
                className="whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calculate Hamali
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-6">
          {Object.keys(groupedTransactions)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort dates descending
            .map((date) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {date} <span className="text-gray-500">{formatDateHeader(date)}</span>
                </h2>
                <Badge variant="outline">
                  {getTransactionCountForDate(date)} transaction{getTransactionCountForDate(date) !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">Customer Name</th>
                      <th className="text-left p-3 font-medium">Village</th>
                      <th className="text-center p-3 font-medium">Amount</th>
                      <th className="text-center p-3 font-medium">Due</th>
                      <th className="text-center p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedTransactions[date].map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{transaction.time}</td>
                        <td className="p-3 font-medium">{transaction.name}</td>
                        <td className="p-3">{transaction.village}</td>
                        <td className="p-3 text-center font-bold">₹{transaction.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          {transaction.dueAmount > 0 ? (
                            <Badge variant="destructive">₹{transaction.dueAmount.toFixed(2)}</Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
