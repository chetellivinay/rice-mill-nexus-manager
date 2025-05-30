
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, History, Package, BarChart3, UserCheck, DollarSign, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/queue', icon: Users, label: 'Queue Line' },
    { path: '/billing', icon: FileText, label: 'Billing' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/store', icon: Package, label: 'Store' },
    { path: '/analytics', icon: BarChart3, label: 'Data Analysis' },
    { path: '/dues', icon: DollarSign, label: 'Dues' },
    { path: '/workers', icon: UserCheck, label: 'Workers' },
    { path: '/bin', icon: Trash2, label: 'Bin' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Rice Mill Management</h1>
          </div>
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    location.pathname === item.path
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
