"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  CarFront,
  CreditCard,
  Receipt,
  Sparkles,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import {
  useBooking,
  useCancelBooking,
  useMockPay,
  useBookingQr,
} from "@/hooks/useResources";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/hooks/useResources";

import { openRazorpayCheckout } from "@/lib/razorpay";
import { getApiError } from "@/lib/errors";
import { dateTime, money, statusTone } from "@/lib/format";

export default function BookingDetailPage() {
  return (
    <ProtectedRoute>
      <BookingDetail />
    </ProtectedRoute>
  );
}

function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const bookingId = String(id);
  const paid = searchParams.get("paid");

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useBooking(bookingId);

  const cancel = useCancelBooking();
  const mockPay = useMockPay();

  const { data: qrData, isLoading: qrLoading } = useBookingQr(bookingId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (isLoading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-6 py-12">
          Loading…
        </main>
      </AppShell>
    );
  }

  if (error || !data?.data) {
    return (
      <AppShell>
        <main className="mx-auto max-w-2xl px-6 py-20">
          <Alert
            message={getApiError(
              error,
              "Booking not available",
            ).message}
          />
        </main>
      </AppShell>
    );
  }

  const booking = data.data;

  const canCancel = [
    "PENDING",
    "CONFIRMED",
    "ACTIVE",
  ].includes(booking.status);

  const isPaid =
    booking.latest_payment_status === "PAID";

  const handleCancel = async () => {
    setErrorText("");

    try {
      await cancel.mutateAsync({
        id: bookingId,
        payload: {
          reason: reason.trim() || undefined,
        },
      });

      setCancelOpen(false);
      setReason("");
    } catch (err) {
      setErrorText(getApiError(err).message);
    }
  };

  const handleMockPayment = async () => {
    setErrorText("");

    try {
      await mockPay.mutateAsync({
        id: bookingId,
        payload: {
          method: "UPI",
        },
      });
    } catch (err) {
      setErrorText(getApiError(err).message);
    }
  };

  const handleRazorpayPayment = async () => {
    setErrorText("");
    setPaymentSuccess(false);
    setPaymentLoading(true);

    try {
      /*
       * Step 1:
       * Ask our backend to create the Razorpay order.
       *
       * IMPORTANT:
       * The backend calculates the amount from the booking.
       * We never send the amount from the frontend.
       */
      const orderData = await createRazorpayOrder(bookingId);

      /*
       * Step 2:
       * Open Razorpay Checkout.
       */
      openRazorpayCheckout({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Parkkar",
        description: `Parking booking #${booking.id}`,
        order_id: orderData.order.id,

        /*
         * Step 3:
         * Razorpay gives us these values after successful payment.
         */
        handler: async (response) => {
          try {
            setErrorText("");

            /*
             * Step 4:
             * Send the Razorpay response to our backend.
             *
             * Backend verifies the signature using the secret key.
             */
            await verifyRazorpayPayment(
              bookingId,
              {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              },
            );

            setPaymentSuccess(true);

            /*
             * Refresh booking data so the UI shows PAID.
             */
            await refetch();
          } catch (err) {
            setErrorText(
              getApiError(
                err,
                "Payment verification failed.",
              ).message,
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        theme: {
          color: "#0891b2",
        },
      });
    } catch (err) {
      setErrorText(
        getApiError(
          err,
          "Unable to start Razorpay payment.",
        ).message,
      );

      setPaymentLoading(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>

        {paid && (
          <div className="mt-5">
            <Alert
              tone="success"
              message="Mock payment recorded successfully. Your booking is now paid in the development flow."
            />
          </div>
        )}

        {paymentSuccess && (
          <div className="mt-5">
            <Alert
              tone="success"
              message="Payment successful! Your Razorpay payment has been verified."
            />
          </div>
        )}

        {isPaid && booking.status === "PENDING" && (
          <div className="mt-5">
            <Alert
              tone="info"
              message="Payment has been received. This booking is still pending confirmation in the current development flow."
            />
          </div>
        )}

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                BOOKING #{booking.id}
              </div>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                {booking.location_name}
              </h1>

              <p className="mt-2 text-slate-500">
                {booking.location_city} ·{" "}
                {booking.slot_code}
              </p>
            </div>

            <Badge tone={statusTone(booking.status)}>
              {booking.status}
            </Badge>
          </div>
        </div>

        {errorText && (
          <div className="mt-5">
            <Alert message={errorText} />
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Info
                icon={<CalendarClock />}
                label="Time"
                value={`${dateTime(
                  booking.start_time,
                )} — ${dateTime(
                  booking.end_time,
                )}`}
              />

              <Info
                icon={<CarFront />}
                label="Vehicle"
                value={
                  booking.plate_number ||
                  "No vehicle"
                }
              />

              <Info
                icon={<Receipt />}
                label="Slot"
                value={`${booking.slot_code} · ${booking.slot_type}`}
              />

              <Info
                icon={<CreditCard />}
                label="Payment"
                value={
                  booking.latest_payment_status ||
                  "Not paid"
                }
              />
            </div>

            {booking.services?.length ? (
              <div className="mt-7 border-t border-slate-100 pt-6">
                <h2 className="font-bold">
                  Services
                </h2>

                <div className="mt-3 space-y-2">
                  {booking.services.map(
                    (service) => (
                      <div
                        key={service.id}
                        className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"
                      >
                        <span>
                          {service.service_name} ×{" "}
                          {service.quantity}
                        </span>

                        <span className="font-semibold">
                          {money(
                            service.price_at_booking,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {(booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
              <div className="mt-7 rounded-3xl border border-cyan-100 bg-cyan-50/60 p-5">
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    {qrLoading ? (
                      <div className="flex h-36 w-36 items-center justify-center text-xs text-slate-400">
                        Loading QR…
                      </div>
                    ) : qrData?.data?.token && origin ? (
                      <QRCodeSVG
                        value={`${origin}/qr/verify?token=${encodeURIComponent(qrData.data.token)}`}
                        size={144}
                        level="M"
                      />
                    ) : (
                      <div className="flex h-36 w-36 items-center justify-center text-xs text-slate-400">
                        QR unavailable
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                      Booking QR
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">
                      Entry &amp; exit verification
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                      Show this QR at the parking location. A partner or admin can verify entry and exit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setErrorText("");
                    setReason("");
                    setCancelOpen(true);
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Cancel booking
                </Button>
              )}

              {booking.status === "PENDING" &&
                !isPaid && (
                  <>
                    <Button
                      onClick={handleRazorpayPayment}
                      loading={paymentLoading}
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay ₹{booking.total_amount}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleMockPayment}
                      loading={mockPay.isPending}
                    >
                      Mock pay
                    </Button>
                  </>
                )}
            </div>
          </Card>

          <Card dark className="h-fit p-6">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Total
            </div>

            <div className="mt-2 text-4xl font-bold">
              {money(booking.total_amount)}
            </div>

            <div className="mt-5 border-t border-white/10 pt-5 text-sm text-slate-400">
              Price snapshot

              <span className="float-right text-white">
                {money(
                  booking.price_per_hour_snapshot,
                )}
                /h
              </span>
            </div>

            <div className="mt-2 text-sm text-slate-400">
              Booking reference

              <span className="float-right text-white">
                #{booking.id}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs text-slate-400">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Backend remains the source of truth for the final amount.
            </div>
          </Card>
        </div>

        <ConfirmDialog
          open={cancelOpen}
          onClose={() => {
            if (!cancel.isPending) {
              setCancelOpen(false);
            }
          }}
          title="Cancel this booking?"
          description="This action changes the booking status to CANCELLED. A booking that has already started cannot be cancelled."
          confirmLabel="Cancel booking"
          danger
          loading={cancel.isPending}
          onConfirm={handleCancel}
        />

        {cancelOpen && (
          <div className="mx-auto mt-4 max-w-2xl">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Cancellation reason
              </span>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Why are you cancelling?"
                disabled={cancel.isPending}
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </label>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {icon}
        {label}
      </div>

      <div className="mt-2 text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}