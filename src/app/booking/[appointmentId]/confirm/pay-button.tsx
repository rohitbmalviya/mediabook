"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmMockPayment } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PayButtonProps {
  appointmentId: string;
  fee: string;
}

export function PayButton({ appointmentId, fee }: PayButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // Small UX delay to simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = await confirmMockPayment(appointmentId);

      if (!result.success) {
        toast.error(result.error ?? "Payment failed. Please try again.");
        return;
      }

      toast.success("Payment successful! Your appointment is confirmed.", {
        description: `Transaction ID: ${result.data.transactionId}`,
        duration: 6000,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      className="w-full h-11 text-base"
      onClick={handlePay}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Processing payment...
        </>
      ) : (
        <>
          <CreditCard size={16} />
          Pay {fee} (Demo)
        </>
      )}
    </Button>
  );
}
