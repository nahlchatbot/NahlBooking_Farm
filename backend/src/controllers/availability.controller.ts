import { Request, Response, NextFunction } from 'express';
import { checkAvailability } from '../services/availability.service.js';
import { availabilityResponse, errorResponse } from '../utils/response.js';
import { AvailabilityInput } from '../types/validation.js';

export async function checkAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date, visitType } = (req as any).validatedQuery as AvailabilityInput;

    const result = await checkAvailability(date, visitType);

    if (result.available) {
      availabilityResponse(res, true, '✅ متوفر — يمكنك إكمال الحجز.');
    } else {
      // Provide appropriate message based on reason
      let message = '❌ عذراً، هذا التاريخ غير متوفر.';

      switch (result.reason) {
        case 'past_date':
          message = '❌ لا يمكن الحجز في تاريخ سابق.';
          break;
        case 'blackout_date':
          message = '❌ عذراً، هذا التاريخ غير متاح للحجز.';
          break;
        case 'already_booked':
          message = '❌ عذراً، هذا التاريخ محجوز بالفعل.';
          break;
      }

      availabilityResponse(res, false, message);
    }
  } catch (error) {
    next(error);
  }
}
