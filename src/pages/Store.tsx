
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Archive } from 'lucide-react';
import { InventoryItem, StockItem, getInventory, saveInventory, getStock, saveStock } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Store = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '', count: 0 });
  const [newStockItem, setNewStockItem] = useState({ name: '', kg25: 0, kg50: 0 });

  useEffect(() => {
    setInventory(getInventory());
    setStock(getStock());
  }, []);

  const updateInventoryItem = (index: number, count: number) => {
    const updatedInventory = [...inventory];
    updatedInventory[index].count = Math.max(0, count);
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  };

  const addInventoryItem = () => {
    if (!newInventoryItem.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter item name",
        variant: "destructive"
      });
      return;
    }

    const updatedInventory = [...inventory, { ...newInventoryItem }];
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    setNewInventoryItem({ name: '', count: 0 });
    
    toast({
      title: "Success",
      description: "Inventory item added successfully"
    });
  };

  const updateStockItem = (index: number, field: 'kg25' | 'kg50', value: number) => {
    const updatedStock = [...stock];
    updatedStock[index][field] = Math.max(0, value);
    setStock(updatedStock);
    saveStock(updatedStock);
  };

  const addStockItem = () => {
    if (!newStockItem.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter stock item name",
        variant: "destructive"
      });
      return;
    }

    const updatedStock = [...stock, { ...newStockItem }];
    setStock(updatedStock);
    saveStock(updatedStock);
    setNewStockItem({ name: '', kg25: 0, kg50: 0 });
    
    toast({
      title: "Success",
      description: "Stock item added successfully"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Store Management</h1>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package size={16} />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center space-x-2">
              <Archive size={16} />
              <span>Stock</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package size={20} />
                    <span>Inventory Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventory.map((item, index) => (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                            <div className="text-3xl font-bold text-blue-600 mb-4">
                              {item.count}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInventoryItem(index, item.count - 1)}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={item.count}
                                onChange={(e) => updateInventoryItem(index, parseInt(e.target.value) || 0)}
                                className="w-20 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInventoryItem(index, item.count + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Add New Inventory Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <Label htmlFor="newItemName">Item Name</Label>
                          <Input
                            id="newItemName"
                            value={newInventoryItem.name}
                            onChange={(e) => setNewInventoryItem({...newInventoryItem, name: e.target.value})}
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newItemCount">Initial Count</Label>
                          <Input
                            id="newItemCount"
                            type="number"
                            min="0"
                            value={newInventoryItem.count}
                            onChange={(e) => setNewInventoryItem({...newInventoryItem, count: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addInventoryItem}>
                            <Plus size={16} className="mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stock">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Archive size={20} />
                    <span>Stock Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left">Stock Item</th>
                          <th className="border border-gray-300 p-3 text-center">25kg Packages</th>
                          <th className="border border-gray-300 p-3 text-center">50kg Packages</th>
                          <th className="border border-gray-300 p-3 text-center">Total Weight (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stock.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-3 font-medium">{item.name}</td>
                            <td className="border border-gray-300 p-3">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockItem(index, 'kg25', item.kg25 - 1)}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.kg25}
                                  onChange={(e) => updateStockItem(index, 'kg25', parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockItem(index, 'kg25', item.kg25 + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockItem(index, 'kg50', item.kg50 - 1)}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.kg50}
                                  onChange={(e) => updateStockItem(index, 'kg50', parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStockItem(index, 'kg50', item.kg50 + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3 text-center font-bold">
                              {(item.kg25 * 25) + (item.kg50 * 50)} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Add New Stock Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="newStockName">Stock Item Name</Label>
                          <Input
                            id="newStockName"
                            value={newStockItem.name}
                            onChange={(e) => setNewStockItem({...newStockItem, name: e.target.value})}
                            placeholder="Enter stock name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newStock25">25kg Packages</Label>
                          <Input
                            id="newStock25"
                            type="number"
                            min="0"
                            value={newStockItem.kg25}
                            onChange={(e) => setNewStockItem({...newStockItem, kg25: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newStock50">50kg Packages</Label>
                          <Input
                            id="newStock50"
                            type="number"
                            min="0"
                            value={newStockItem.kg50}
                            onChange={(e) => setNewStockItem({...newStockItem, kg50: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addStockItem} className="w-full">
                            <Plus size={16} className="mr-2" />
                            Add Stock
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Store;
