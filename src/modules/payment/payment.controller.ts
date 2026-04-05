import { Request, Response } from "express";
import { PaymentService } from "./payment.service.js";

export const PaymentController = {
  async createSSLCommerzSession(req: Request, res: Response) {
    try {
      if (req.user!.role !== "STUDENT" || !req.user!.studentId) {
        return res
          .status(403)
          .json({ message: "Only students can make bookings" });
      }

      const {
        tutorId,
        pricingId,
        availabilityId,
        amount,
        currency,
        product_name,
        product_category,
        customer_name,
        customer_email,
        customer_phone,
      } = req.body;

      if (
        !tutorId ||
        !pricingId ||
        !availabilityId ||
        !amount ||
        !product_name
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required tutor booking or payment details.",
        });
      }

      const result = await PaymentService.createSSLCommerzSession({
        studentId: req.user!.studentId!,
        studentUserId: req.user!.id,
        tutorId,
        pricingId,
        availabilityId,
        amount: Number(amount),
        currency,
        product_name,
        product_category,
        customer_name,
        customer_email,
        customer_phone,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async sslCommerzSuccess(req: Request, res: Response) {
    try {
      console.log(
        "SSLCommerz success callback received with query:",
        req.query,
      );

      // Check if this is a mock payment
      const isMock =
        req.query.mock === "true" || process.env.MOCK_PAYMENTS === "true";

      if (isMock) {
        console.log("Mock payment detected, skipping validation");
        const bookingId = Array.isArray(req.query.value_a)
          ? (req.query.value_a[0] as string)
          : (req.query.value_a as string) || "mock-booking";

        // Auto-confirm the booking
        const { BookingService } =
          await import("../booking/booking.service.js");
        await BookingService.confirmBooking(bookingId);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const status = "VALID";
        const tranId = Array.isArray(req.query.tran_id)
          ? (req.query.tran_id[0] as string) || ""
          : (req.query.tran_id as string) || "";
        return res.redirect(
          `${frontendUrl}/ssl-commerce/success?bookingId=${bookingId}&tran_id=${tranId}&status=${status}`,
        );
      }

      const result = await PaymentService.validateSSLCommerzTransaction({
        ...req.query,
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const status = encodeURIComponent(result.validation.status || "VALID");
      const tranId = encodeURIComponent(
        Array.isArray(req.query.tran_id)
          ? (req.query.tran_id[0] as string) || ""
          : (req.query.tran_id as string) || "",
      );
      return res.redirect(
        `${frontendUrl}/ssl-commerce/success?bookingId=${result.bookingId}&tran_id=${tranId}&status=${status}`,
      );
    } catch (err: any) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const message = encodeURIComponent(
        err.message || "Payment validation failed.",
      );
      return res.redirect(`${frontendUrl}/ssl-commerce/fail?error=${message}`);
    }
  },

  async sslCommerzFail(req: Request, res: Response) {
    try {
      console.log("SSLCommerz fail callback received with query:", req.query);

      const bookingId = Array.isArray(req.query.value_a)
        ? (req.query.value_a[0] as string)
        : (req.query.value_a as string);

      if (bookingId) {
        const { BookingService } =
          await import("../booking/booking.service.js");
        await BookingService.updateBookingStatus(bookingId, "CANCELLED");
      }
    } catch (err) {
      // Ignore failures here; we still want to redirect to the frontend failure page.
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/ssl-commerce/fail`);
  },
};
