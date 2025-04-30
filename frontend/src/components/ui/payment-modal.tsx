"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { CreditCard, Calendar, Lock, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  amount: number;
  speakerName: string;
  sessionDate: string;
  sessionTime: string;
  onCancel: () => void;
  onComplete: () => void;
}

export function PaymentModal({
  amount,
  speakerName,
  sessionDate,
  sessionTime,
  onCancel,
  onComplete
}: PaymentModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStep('processing');

    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setIsSubmitting(false);
    }, 2000);
  };

  const handleComplete = () => {
    onComplete();
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');

    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }

    return digits;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full"
      >
        {step === 'details' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Payment Details</h3>
              <div className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                Demo Mode
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">Session with {speakerName}</span>
                <span className="font-semibold text-neutral-900 dark:text-white">${amount}</span>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-500">
                {sessionDate} at {sessionTime}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    required
                    maxLength={19}
                    className="pl-10"
                    autoComplete="cc-number"
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  autoComplete="cc-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <div className="relative">
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      required
                      maxLength={5}
                      className="pl-10"
                      autoComplete="cc-exp"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      required
                      maxLength={3}
                      className="pl-10"
                      autoComplete="cc-csc"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="saveCard" checked={saveCard} onCheckedChange={(checked) => setSaveCard(!!checked)} />
                <Label htmlFor="saveCard" className="text-sm font-normal">Save card for future payments</Label>
              </div>

              <div className="pt-2 text-xs text-neutral-500 dark:text-neutral-400">
                <p className="mb-1">This is a demo payment form. No real payment will be processed.</p>
                <p>Any card details entered are not stored or transmitted.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Pay ${amount}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">Processing Payment</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Please wait while we process your payment...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">Payment Successful!</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Your session with {speakerName} has been booked successfully.
            </p>
            <Button
              onClick={handleComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              View Booking Details
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
