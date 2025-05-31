
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { getInventory, saveInventory, getTransactions } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

interface MismatchItem {
  name: string;
  expected: number;
  actual: number;
  difference: number;
}

const InventoryMismatch = () => {
  const [mismatches, setMismatches] = useState<MismatchItem[]>([]);
  const [showMismatches, setShowMismatches] = useState(false);

  const calculateExpectedInventory = () => {
    const transactions = getTransactions();
    const inventory = getInventory();
    const expectedCounts: Record<string, number> = {};

    // Initialize with current inventory
    inventory.forEach(item => {
      expectedCounts[item.name] = item.count;
    });

    // Calculate what should be the inventory based on transactions
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (expectedCounts.hasOwnProperty(item.name)) {
          expectedCounts[item.name] += item.quantity;
        }
      });
    });

    const mismatched: MismatchItem[] = [];
    inventory.forEach(item => {
      const expected = expectedCounts[item.name] || 0;
      if (expected !== item.count) {
        mismatched.push({
          name: item.name,
          expected,
          actual: item.count,
          difference: item.count - expected
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
      calculateExpectedInventory();
      toast({
        title: "Inventory Fixed",
        description: `${itemName} count updated to ${correctCount}`
      });
    }
  };

  useEffect(() => {
    if (showMismatches) {
      calculateExpectedInventory();
    }
  }, [showMismatches]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Inventory Management
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => {
              setShowMismatches(!showMismatches);
              if (!showMismatches) calculateExpectedInventory();
            }}
          >
            {showMismatches ? 'Hide' : 'Check'} Mismatches
          </Button>
        </div>
      </CardHeader>
      {showMismatches && (
        <CardContent>
          {mismatches.length === 0 ? (
            <div className="text-center py-4 text-green-600">
              All inventory items are properly matched!
            </div>
          ) : (
            <div className="space-y-3">
              {mismatches.map((mismatch) => (
                <div key={mismatch.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{mismatch.name}</div>
                    <div className="text-sm text-gray-600">
                      Expected: {mismatch.expected} | Actual: {mismatch.actual}
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
