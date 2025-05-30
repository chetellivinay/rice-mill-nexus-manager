
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, History, Package, BarChart3, UserCheck, DollarSign, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';

const Index = () => {
  const sections = [
    {
      title: 'Queue Line',
      description: 'Manage customer queue and load information',
      icon: Users,
      path: '/queue',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Billing',
      description: 'Create bills and manage transactions',
      icon: FileText,
      path: '/billing',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Transactions',
      description: 'View and manage transaction records',
      icon: History,
      path: '/transactions',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Store',
      description: 'Manage inventory and stock levels',
      icon: Package,
      path: '/store',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Analytics',
      description: 'View reports and analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Dues',
      description: 'Manage customer dues and payments',
      icon: DollarSign,
      path: '/dues',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Workers',
      description: 'Manage worker records and salaries',
      icon: UserCheck,
      path: '/workers',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      title: 'Bin',
      description: 'Manage deleted items and restore data',
      icon: Trash2,
      path: '/bin',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Rice Mill Management System
          </h1>
          <p className="text-xl text-gray-600">
            Complete solution for managing your rice mill operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.path}
                to={section.path}
                className={`${section.color} text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 block`}
              >
                <div className="text-center">
                  <Icon size={40} className="mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-2">{section.title}</h3>
                  <p className="text-white/90 text-sm">{section.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">Local Storage</div>
              <div className="text-gray-600">All data stored on device</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Real-time Updates</div>
              <div className="text-gray-600">Instant data synchronization</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Complete Solution</div>
              <div className="text-gray-600">End-to-end mill management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
