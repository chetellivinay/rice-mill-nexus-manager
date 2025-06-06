
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface CustomerDueAlertProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phoneNumber: string;
  dueAmount: number;
  onClearDue: () => void;
}

const CustomerDueAlert: React.FC<CustomerDueAlertProps> = ({
  isOpen,
  onClose,
  customerName,
  phoneNumber,
  dueAmount,
  onClearDue
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Customer Has Outstanding Dues</span>
          </DialogTitle>
          <DialogDescription>
            This customer has pending payments from previous transactions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Customer:</strong> {customerName}</div>
                <div><strong>Phone:</strong> {phoneNumber}</div>
                <div className="flex items-center space-x-2">
                  <strong>Total Due:</strong>
                  <Badge variant="destructive" className="text-sm">
                    ₹{dueAmount.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-2">
            <Button onClick={onClearDue} className="flex-1">
              Clear Dues
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDueAlert;
