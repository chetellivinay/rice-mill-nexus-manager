
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw } from 'lucide-react';
import { BinItem, getBinItems, removeFromBin, cleanupExpiredBinItems, saveTransactions, getTransactions, saveInventory, getInventory } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Bin = () => {
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [showInventoryRemovalDialog, setShowInventoryRemovalDialog] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<BinItem | null>(null);

  useEffect(() => {
    cleanupExpiredBinItems();
    setBinItems(getBinItems());
  }, []);

  const removeFromInventory = (transaction: any) => {
    const inventory = getInventory();
    let removedItems = 0;
    
    if (transaction.items) {
      transaction.items.forEach((item: any) => {
        const inventoryItem = inventory.find(inv => inv.name === item.name);
        
        if (inventoryItem && item.quantity > 0) {
          inventoryItem.count = Math.max(0, inventoryItem.count - item.quantity);
          removedItems++;
          console.log(`Successfully removed ${item.quantity} ${item.name} from inventory`);
        }
      });
    }
    
    if (removedItems > 0) {
      saveInventory(inventory);
      toast({
        title: "Inventory Updated",
        description: `${removedItems} inventory items have been removed`
      });
    }
  };

  const handleRestoreClick = (item: BinItem) => {
    if (item.type === 'transaction' && item.data.items && item.data.items.length > 0) {
      setItemToRestore(item);
      setShowInventoryRemovalDialog(true);
    } else {
      completeRestore(item, false);
    }
  };

  const completeRestore = (item: BinItem, shouldRemoveFromInventory: boolean = false) => {
    if (item.type === 'transaction') {
      if (shouldRemoveFromInventory) {
        removeFromInventory(item.data);
      }
      
      const transactions = getTransactions();
      
      // Insert transaction back in chronological order
      const transactionToRestore = item.data;
      const insertIndex = transactions.findIndex(t => {
        const restoredDate = new Date(`${transactionToRestore.date} ${transactionToRestore.time}`);
        const existingDate = new Date(`${t.date} ${t.time}`);
        return restoredDate > existingDate;
      });
      
      if (insertIndex === -1) {
        transactions.push(transactionToRestore);
      } else {
        transactions.splice(insertIndex, 0, transactionToRestore);
      }
      
      saveTransactions(transactions);
      
      toast({
        title: "Transaction Restored",
        description: "Transaction has been restored to its original position"
      });
    }
    
    removeFromBin(item.id);
    setBinItems(getBinItems());
    setShowInventoryRemovalDialog(false);
    setItemToRestore(null);
  };

  const permanentlyDelete = (id: string) => {
    removeFromBin(id);
    setBinItems(getBinItems());
    
    toast({
      title: "Permanently Deleted",
      description: "Item has been permanently deleted"
    });
  };

  const getDaysRemaining = (restoreDeadline: string) => {
    const deadline = new Date(restoreDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Recycle Bin</h1>
        
        <div className="mb-4">
          <Badge variant="outline" className="text-sm">
            Items are automatically deleted after 7 days
          </Badge>
        </div>

        <div className="space-y-4">
          {binItems.map((item) => (
            <Card key={item.id} className="border-red-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {item.type === 'transaction' ? 'Transaction' : 'Inventory Item'}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      {item.type === 'transaction' && (
                        <>
                          Customer: {item.data.name} • Village: {item.data.village} • Amount: ₹{item.data.totalAmount?.toFixed(2)}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Deleted: {new Date(item.deletedDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getDaysRemaining(item.restoreDeadline) <= 1 ? "destructive" : "secondary"}>
                      {getDaysRemaining(item.restoreDeadline)} days left
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreClick(item)}
                    >
                      <RotateCcw size={16} className="mr-1" />
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => permanentlyDelete(item.id)}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {item.type === 'transaction' && (
                <CardContent>
                  <div className="text-sm">
                    <div>Phone: {item.data.phone}</div>
                    <div>Date: {item.data.date} at {item.data.time}</div>
                    <div>Items: {item.data.items?.length || 0} items</div>
                    <div>Due Amount: ₹{item.data.dueAmount?.toFixed(2)}</div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {binItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Bin is empty</div>
            <p className="text-sm text-gray-400 mt-2">Deleted items will appear here</p>
          </div>
        )}

        {/* Inventory Removal Dialog */}
        <AlertDialog open={showInventoryRemovalDialog} onOpenChange={setShowInventoryRemovalDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Inventory</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to remove the inventory items used in this transaction from the current inventory? This is recommended since these items were already billed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => itemToRestore && completeRestore(itemToRestore, false)}>
                Don't Remove
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => itemToRestore && completeRestore(itemToRestore, true)}>
                Remove from Inventory
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Bin;
