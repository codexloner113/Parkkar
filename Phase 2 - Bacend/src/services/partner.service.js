import * as paymentRepo from '../repositories/payment.repository.js';
import { Errors } from '../utils/errors.js';

export async function getRevenue(partnerId, { rangeStart, rangeEnd }) {
  const start = rangeStart ? new Date(rangeStart) : new Date(0);
  const end = rangeEnd ? new Date(rangeEnd) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw Errors.badRequest('Invalid date range.', 'INVALID_DATE_RANGE');
  }
  return paymentRepo.partnerRevenue(partnerId, {
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
  });
}
