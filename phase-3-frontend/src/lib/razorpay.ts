export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;

  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  theme?: {
    color?: string;
  };
};

type RazorpayCheckout = {
  open: () => void;
};

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayCheckout;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): RazorpayCheckout {
  if (!window.Razorpay) {
    throw new Error(
      "Razorpay Checkout is not loaded. Please refresh the page and try again.",
    );
  }

  const razorpay = new window.Razorpay(options);

  razorpay.open();

  return razorpay;
}