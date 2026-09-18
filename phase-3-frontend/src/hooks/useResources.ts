"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";

import {
  getParking,
  getParkingDetail,
  getParkingNearby,
  getAvailability,
  getParkingServices,
  getParkingReviews,
  createParkingReview,
} from "@/lib/parking";

import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/lib/vehicles";

import {
  listBookings,
  getBooking,
  createBooking,
  cancelBooking,
  mockPayBooking,
  getBookingQr,
  verifyBookingQr,
} from "@/lib/bookings";

import {
  listFavorites,
  addFavorite,
  removeFavorite,
} from "@/lib/favorites";

import { listServices } from "@/lib/services";
import { queryKeys } from "@/lib/queryKeys";

import type { ParkingSearchParams } from "@/lib/parking";

import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
} from "@/lib/vehicles";

import type {
  CreateBookingPayload,
  CancelBookingPayload,
} from "@/types/booking";

import type { MockPayPayload } from "@/types/payment";
import type { SlotType } from "@/types/parking";
import type { CreateReviewPayload } from "@/types/review";

// ─────────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────────

export const useParking = (
  params: ParkingSearchParams = {},
) =>
  useQuery({
    queryKey: queryKeys.parking.search(
      params as Record<string, unknown>,
    ),
    queryFn: () => getParking(params),
  });

export const useParkingNearby = (
  params: {
    lat: number;
    lng: number;
    radius_km?: number;
    limit?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.parking.nearby(
      params as Record<string, unknown>,
    ),
    queryFn: () => getParkingNearby(params),
    enabled,
  });

export const useParkingRecommendations = (
  params: {
    lat: number;
    lng: number;
    radius_km?: number;
    limit?: number;
    slot_type?: SlotType;
    max_price?: number;
    start_time?: string;
    end_time?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.parking.recommendations(
      params as Record<string, unknown>,
    ),
    queryFn: async () => {
      const response = await api.get(
        "/parking/recommendations",
        {
          params,
        },
      );

      return response.data;
    },
    enabled,
  });

export const useParkingDetail = (id: string) =>
  useQuery({
    queryKey: queryKeys.parking.detail(id),
    queryFn: () => getParkingDetail(id),
    enabled: !!id,
  });

export const useAvailability = (
  id: string,
  params: {
    start_time: string;
    end_time: string;
    slot_type?: SlotType;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.parking.availability(
      id,
      params,
    ),
    queryFn: () => getAvailability(id, params),
    enabled: enabled && !!id,
  });

export const useParkingServices = (id: string) =>
  useQuery({
    queryKey: queryKeys.parking.services(id),
    queryFn: () => getParkingServices(id),
    enabled: !!id,
  });

export const useParkingReviews = (
  id: string,
  params: { page?: number; limit?: number } = {},
) =>
  useQuery({
    queryKey: queryKeys.parking.reviews(id, params),
    queryFn: () => getParkingReviews(id, params),
    enabled: !!id,
  });

export const useCreateReview = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      createParkingReview(id, payload),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.parking.reviews(id),
      }),
  });
};

// ─────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────

export const useVehicles = () =>
  useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: listVehicles,
  });

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) =>
      createVehicle(payload),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all(),
      }),
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateVehiclePayload;
    }) => updateVehicle(id, payload),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all(),
      }),
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all(),
      }),
  });
};

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────

export const useBookings = (
  params: { page?: number; limit?: number } = {},
) =>
  useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => listBookings(params),
  });

export const useBooking = (id: string) =>
  useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => getBooking(id),
    enabled: !!id,
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      createBooking(payload),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.all(),
      }),
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelBookingPayload;
    }) => cancelBooking(id, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(
          variables.id,
        ),
      });
    },
  });
};

export const useMockPay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: MockPayPayload;
    }) => mockPayBooking(id, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(
          variables.id,
        ),
      });
    },
  });
};

// ─────────────────────────────────────────────
// RAZORPAY PAYMENTS
// ─────────────────────────────────────────────

export async function createRazorpayOrder(
  bookingId: string,
) {
  const response = await api.post(
    `/bookings/${bookingId}/pay`,
  );

  return response.data.data;
}

export async function verifyRazorpayPayment(
  bookingId: string,
  payment: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
) {
  const response = await api.post(
    `/bookings/${bookingId}/pay/verify`,
    payment,
  );

  return response.data.data;
}

// ─────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────

export const useFavorites = (
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.favorites.list(),
    queryFn: listFavorites,
    enabled,
  });

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      addFavorite(id),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.favorites.all(),
      }),
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      removeFavorite(id),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.favorites.all(),
      }),
  });
};

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────

export const useServices = () =>
  useQuery({
    queryKey: queryKeys.services.list(),
    queryFn: listServices,
  });

export const useBookingQr = (id: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.bookings.qr(id),
    queryFn: () => getBookingQr(id),
    enabled: !!id && enabled,
  });

export const useVerifyBookingQr = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyBookingQr,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.all(),
      });

      const bookingId = result.data?.booking?.id;

      if (bookingId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(bookingId),
        });
      }
    },
  });
};
