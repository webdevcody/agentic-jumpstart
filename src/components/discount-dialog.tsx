import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tag, CheckCircle } from "lucide-react";
import { validateAffiliateCodeFn } from "~/fn/affiliates";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyDiscount: (code: string) => void;
  initialCode?: string;
}

export function DiscountDialog({
  open,
  onOpenChange,
  onApplyDiscount,
  initialCode = "",
}: DiscountDialogProps) {
  const [discountCode, setDiscountCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleApply = async () => {
    if (!discountCode.trim()) {
      setError("Please enter a discount code");
      return;
    }
    
    setIsValidating(true);
    setError(null);
    
    try {
      const { data: { valid } } = await validateAffiliateCodeFn({ data: { code: discountCode.trim() } });

      if (valid) {
        setIsValid(true);
        onApplyDiscount(discountCode.trim());
        onOpenChange(false);
      } else {
        setError("Invalid discount code. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to validate discount code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    setDiscountCode("");
    setError(null);
    setIsValid(false);
    onApplyDiscount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-theme-500" />
            Have a Discount Code?
          </DialogTitle>
          <DialogDescription>
            Enter your affiliate discount code to get 10% off your purchase
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApply();
                }
              }}
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              className="flex-1"
              variant="default"
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : isValid ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Applied!
                </>
              ) : "Apply 10% Discount"}
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={isValidating}
            >
              Continue Without Discount
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Discount codes are provided by our affiliate partners
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}