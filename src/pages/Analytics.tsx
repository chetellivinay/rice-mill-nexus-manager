
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getTransactions } from '@/utils/localStorage';

const Analytics = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('daily');

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const getFilteredData = () => {
    const now = new Date();
    let filteredTransactions = transactions;

    if (timeRange === 'daily') {
      const today = now.toLocaleDateString();
      filteredTransactions = transactions.filter(t => t.date === today);
    } else if (timeRange === 'monthly') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      });
    } else if (timeRange === 'yearly') {
      const currentYear = now.getFullYear();
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear;
      });
    }

    return filteredTransactions;
  };

  const getRevenueData = () => {
    const filteredData = getFilteredData();
    const revenueByDate: { [key: string]: number } = {};

    filteredData.forEach(transaction => {
      const date = transaction.date;
      revenueByDate[date] = (revenueByDate[date] || 0) + transaction.totalAmount;
    });

    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Show last 10 entries
  };

  const getItemAnalysis = () => {
    const filteredData = getFilteredData();
    const itemData: { [key: string]: { quantity: number, revenue: number } } = {};

    filteredData.forEach(transaction => {
      transaction.items.forEach((item: any) => {
        if (!itemData[item.name]) {
          itemData[item.name] = { quantity: 0, revenue: 0 };
        }
        itemData[item.name].quantity += item.quantity;
        itemData[item.name].revenue += item.total;
      });
    });

    return Object.entries(itemData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8); // Top 8 items
  };

  const getCustomerAnalysis = () => {
    const filteredData = getFilteredData();
    const customerData: { [key: string]: number } = {};

    filteredData.forEach(transaction => {
      customerData[transaction.name] = (customerData[transaction.name] || 0) + transaction.totalAmount;
    });

    return Object.entries(customerData)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 customers
  };

  const getPaymentAnalysis = () => {
    const filteredData = getFilteredData();
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalDue = 0;

    filteredData.forEach(transaction => {
      totalRevenue += transaction.totalAmount;
      totalPaid += transaction.paidAmount;
      totalDue += transaction.dueAmount;
    });

    return [
      { name: 'Paid', value: totalPaid, color: '#10B981' },
      { name: 'Due', value: totalDue, color: '#EF4444' }
    ];
  };

  const revenueData = getRevenueData();
  const itemData = getItemAnalysis();
  const customerData = getCustomerAnalysis();
  const paymentData = getPaymentAnalysis();

  const filteredTransactions = getFilteredData();
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Data Analysis</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{totalRevenue.toFixed(2)}</div>
                <div className="text-gray-600">Total Revenue</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalTransactions}</div>
                <div className="text-gray-600">Total Transactions</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{averageTransaction.toFixed(2)}</div>
                <div className="text-gray-600">Average Transaction</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Items by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#82CA9D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerData.slice(0, 8).map((customer, index) => (
                  <div key={customer.name} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">₹{customer.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item Quantity Analysis */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Item Quantity Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#FFBB28" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
