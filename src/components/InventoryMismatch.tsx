
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCcw, Package } from 'lucide-react';
import { getInventory, saveInventory, getTransactions } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

interface MismatchItem {
  name: string;
  expected: number;
  actual: number;
  difference: number;
  transactionCount: number;
}

const InventoryMismatch = () => {
  const [mismatches, setMismatches] = useState<MismatchItem[]>([]);
  const [showMismatches, setShowMismatches] = useState(false);

  const calculateInventoryMismatch = () => {
    const transactions = getTransactions();
    const inventory = getInventory();
    
    // Calculate how much inventory should have been used based on transactions
    const usedInventory: Record<string, number> = {};
    const transactionCounts: Record<string, number> = {};

    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (item.name in usedInventory) {
          usedInventory[item.name] += item.quantity;
          transactionCounts[item.name]++;
        } else {
          usedInventory[item.name] = item.quantity;
          transactionCounts[item.name] = 1;
        }
      });
    });

    const mismatched: MismatchItem[] = [];
    
    // Check each inventory item
    inventory.forEach(item => {
      const used = usedInventory[item.name] || 0;
      const current = item.count;
      
      // If we have transactions but negative inventory, there's a mismatch
      if (used > 0 && current < 0) {
        mismatched.push({
          name: item.name,
          expected: Math.abs(current),
          actual: current,
          difference: current + used,
          transactionCount: transactionCounts[item.name] || 0
        });
      }
      
      // If inventory count seems inconsistent with usage
      if (used > 0 && current > used * 2) {
        mismatched.push({
          name: item.name,
          expected: current - used,
          actual: current,
          difference: used,
          transactionCount: transactionCounts[item.name] || 0
        });
      }
    });

    setMismatches(mismatched);
  };

  const fixMismatch = (itemName: string, correctCount: number) => {
    const inventory = getInventory();
    const item = inventory.find(inv => inv.name === itemName);
    if (item) {
      item.count = correctCount;
      saveInventory(inventory);
      calculateInventoryMismatch();
      toast({
        title: "Inventory Fixed",
        description: `${itemName} count updated to ${correctCount}`
      });
    }
  };

  const resetInventoryItem = (itemName: string) => {
    const inventory = getInventory();
    const item = inventory.find(inv => inv.name === itemName);
    if (item) {
      item.count = 0;
      saveInventory(inventory);
      calculateInventoryMismatch();
      toast({
        title: "Inventory Reset",
        description: `${itemName} count reset to 0`
      });
    }
  };

  useEffect(() => {
    if (showMismatches) {
      calculateInventoryMismatch();
    }
  }, [showMismatches]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Inventory Management
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => {
              setShowMismatches(!showMismatches);
              if (!showMismatches) calculateInventoryMismatch();
            }}
          >
            {showMismatches ? 'Hide' : 'Check'} Inventory Issues
          </Button>
        </div>
      </CardHeader>
      {showMismatches && (
        <CardContent>
          {mismatches.length === 0 ? (
            <div className="text-center py-4 text-green-600">
              <Package className="h-8 w-8 mx-auto mb-2" />
              All inventory items are properly managed!
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Found {mismatches.length} potential inventory issues. Review and fix as needed.
              </div>
              {mismatches.map((mismatch) => (
                <div key={mismatch.name} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      {mismatch.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Current Count: {mismatch.actual} | Transactions: {mismatch.transactionCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      Suggested fix: Adjust inventory to match transaction history
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mismatch.difference > 0 ? "default" : "destructive"}>
                      {mismatch.difference > 0 ? '+' : ''}{mismatch.difference}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fixMismatch(mismatch.name, mismatch.expected)}
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resetInventoryItem(mismatch.name)}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default InventoryMismatch;
