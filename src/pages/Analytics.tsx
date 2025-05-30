
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { getTransactions, getQueueCustomers, getWorkers, getStockTransactions } from '@/utils/localStorage';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateRange, setSelectedDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stockTransactions, setStockTransactions] = useState<any[]>([]);
  const [queueCustomers, setQueueCustomers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
    setStockTransactions(getStockTransactions());
    setQueueCustomers(getQueueCustomers());
    setWorkers(getWorkers());
  }, []);

  const filterDataByDate = (data: any[], date: Date) => {
    const dateStr = date.toLocaleDateString();
    return data.filter(item => item.date === dateStr);
  };

  const filterDataByDateRange = (data: any[], from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= from && itemDate <= to;
    });
  };

  const getFilteredData = () => {
    if (selectedDateRange.from && selectedDateRange.to) {
      return {
        transactions: filterDataByDateRange(transactions, selectedDateRange.from, selectedDateRange.to),
        stockTransactions: filterDataByDateRange(stockTransactions, selectedDateRange.from, selectedDateRange.to),
        queueCustomers: filterDataByDateRange(queueCustomers, selectedDateRange.from, selectedDateRange.to)
      };
    } else {
      return {
        transactions: filterDataByDate(transactions, selectedDate),
        stockTransactions: filterDataByDate(stockTransactions, selectedDate),
        queueCustomers: filterDataByDate(queueCustomers, selectedDate)
      };
    }
  };

  const filteredData = getFilteredData();

  const getTotalRevenue = () => {
    const transactionRevenue = filteredData.transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const stockRevenue = filteredData.stockTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    return transactionRevenue + stockRevenue;
  };

  const getTotalDues = () => {
    const transactionDues = filteredData.transactions.reduce((sum, t) => sum + t.dueAmount, 0);
    const stockDues = filteredData.stockTransactions.reduce((sum, t) => sum + t.dueAmount, 0);
    return transactionDues + stockDues;
  };

  const getMonthlyData = () => {
    const months = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, revenue: 0, transactions: 0 };
      }
      
      months[monthKey].revenue += transaction.totalAmount;
      months[monthKey].transactions += 1;
    });

    stockTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, revenue: 0, transactions: 0 };
      }
      
      months[monthKey].revenue += transaction.totalAmount;
      months[monthKey].transactions += 1;
    });

    return Object.values(months).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const getServiceDistribution = () => {
    const services = {};
    
    filteredData.transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!services[item.name]) {
          services[item.name] = { name: item.name, value: 0, count: 0 };
        }
        services[item.name].value += item.total;
        services[item.name].count += item.quantity;
      });
    });

    return Object.values(services);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const monthlyData = getMonthlyData();
  const serviceData = getServiceDistribution();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date || new Date());
                    setSelectedDateRange({from: undefined, to: undefined});
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={selectedDateRange}
                  onSelect={(range) => {
                    if (range) {
                      setSelectedDateRange({
                        from: range.from,
                        to: range.to
                      });
                    } else {
                      setSelectedDateRange({from: undefined, to: undefined});
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{getTotalRevenue().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {selectedDateRange.from && selectedDateRange.to ? 'Selected period' : 'Today'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.transactions.length + filteredData.stockTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredData.transactions.length} billing + {filteredData.stockTransactions.length} stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{getTotalDues().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Outstanding amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queue Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.queueCustomers.length}</div>
              <p className="text-xs text-muted-foreground">
                {selectedDateRange.from && selectedDateRange.to ? 'In period' : 'Today'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Transaction Count</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="transactions" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
