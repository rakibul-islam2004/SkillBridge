import axios from "axios";
import { BookingService } from "../booking/booking.service.js";

const storeId = process.env.SSLCOMMERZ_STORE_ID;
const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
const sandboxApiUrl =
  process.env.SSLCOMMERZ_SANDBOX_API ||
  "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const validationApiUrl =
  process.env.SSLCOMMERZ_VALIDATION_API ||
  "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
function getBackendUrl() {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT || 4000}`;
}

const backendUrl = getBackendUrl();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

function buildBackendUrl(path: string) {
  return `${backendUrl}${path}`;
}

export const PaymentService = {
  async createSSLCommerzSession(payload: {
    studentId: string;
    studentUserId: string;
    tutorId: string;
    pricingId: string;
    availabilityId: string;
    amount: number;
    currency?: string;
    product_name: string;
    product_category: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  }) {
    // Check if mock payments are enabled
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.MOCK_PAYMENTS === "true";

    if (isDevelopment) {
      console.log("Development mode: Creating mock payment session");

      const booking = await BookingService.createBooking({
        studentId: payload.studentId,
        studentUserId: payload.studentUserId,
        tutorId: payload.tutorId,
        pricingId: payload.pricingId,
        availabilityId: payload.availabilityId,
        status: "PENDING",
      });

      const tranId = `MOCK-${booking.id.slice(0, 8)}-${Date.now()}`;

      // Return mock gateway URL that redirects directly to success
      const mockGatewayUrl = `${frontendUrl}/ssl-commerce/success?bookingId=${booking.id}&tran_id=${tranId}&status=VALID&val_id=MOCK_VAL_${Date.now()}&value_a=${booking.id}&mock=true`;

      return {
        bookingId: booking.id,
        tranId,
        gatewayUrl: mockGatewayUrl,
        rawResponse: {
          status: "SUCCESS",
          mock: true,
          message: "Development mode: Mock payment session created",
        },
      };
    }

    if (!storeId || !storePassword) {
      throw new Error("SSLCommerz credentials are not configured.");
    }

    const booking = await BookingService.createBooking({
      studentId: payload.studentId,
      studentUserId: payload.studentUserId,
      tutorId: payload.tutorId,
      pricingId: payload.pricingId,
      availabilityId: payload.availabilityId,
      status: "PENDING",
    });

    const tranId = `SB-${booking.id.slice(0, 8)}-${Date.now()}`;
    const form = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: payload.amount.toString(),
      currency: payload.currency || "BDT",
      tran_id: tranId,
      success_url: buildBackendUrl("/api/v1/payment/ssl-commerce/success"),
      fail_url: buildBackendUrl("/api/v1/payment/ssl-commerce/fail"),
      cancel_url: buildBackendUrl("/api/v1/payment/ssl-commerce/fail"),
      cus_name: payload.customer_name,
      cus_email: payload.customer_email,
      cus_phone: payload.customer_phone,
      product_name: payload.product_name,
      product_category: payload.product_category,
      value_a: booking.id,
      value_b: payload.pricingId,
      value_c: payload.availabilityId,
      value_d: payload.tutorId,
    });

    try {
      const response = await axios.post(sandboxApiUrl, form.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = response.data;
      if (!data || data.status !== "SUCCESS" || !data.GatewayPageURL) {
        throw new Error(
          data?.failedreason ||
            data?.message ||
            "SSLCommerz session creation failed.",
        );
      }

      return {
        bookingId: booking.id,
        tranId,
        gatewayUrl: data.GatewayPageURL,
        rawResponse: data,
      };
    } catch (err: any) {
      if (booking?.id) {
        try {
          await BookingService.updateBookingStatus(booking.id, "CANCELLED");
        } catch (rollbackErr) {
          console.error(
            "Failed to cancel pending booking after SSL session error:",
            rollbackErr,
          );
        }
      }
      throw err;
    }
  },

  async validateSSLCommerzTransaction(params: {
    val_id?: string | string[];
    tran_id?: string | string[];
    amount?: string | string[];
    currency?: string | string[];
    value_a?: string | string[];
  }) {
    console.log("SSLCommerz validation params received:", params);

    if (!storeId || !storePassword) {
      throw new Error("SSLCommerz credentials are not configured.");
    }

    const val_id = Array.isArray(params.val_id)
      ? params.val_id[0]
      : params.val_id;
    const tran_id = Array.isArray(params.tran_id)
      ? params.tran_id[0]
      : params.tran_id;
    const amount = Array.isArray(params.amount)
      ? params.amount[0]
      : params.amount;
    const currency = Array.isArray(params.currency)
      ? params.currency[0]
      : params.currency;
    const bookingId = Array.isArray(params.value_a)
      ? params.value_a[0]
      : params.value_a;

    console.log("Parsed parameters:", {
      val_id,
      tran_id,
      bookingId,
      amount,
      currency,
    });

    // Auto-fill missing parameters for development/testing
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.MOCK_PAYMENTS === "true";

    if (isDevelopment && (!val_id || !tran_id || !bookingId)) {
      console.log("Development mode: Auto-filling missing parameters");

      // Auto-generate missing validation ID
      const autoValId = val_id || `AUTO_VAL_${Date.now()}`;
      const autoTranId = tran_id || `AUTO_TRAN_${Date.now()}`;
      const autoBookingId = bookingId || `AUTO_BOOK_${Date.now()}`;

      console.log("Auto-filled parameters:", {
        val_id: autoValId,
        tran_id: autoTranId,
        bookingId: autoBookingId,
      });

      // Skip SSLCommerz validation API call in development
      await BookingService.confirmBooking(autoBookingId);

      return {
        bookingId: autoBookingId,
        transactionId: autoTranId,
        validation: {
          status: "VALID",
          autoFilled: true,
          message: "Development mode: Auto-filled validation",
        },
        successRedirect: `${frontendUrl}/ssl-commerce/success?bookingId=${autoBookingId}`,
      };
    }

    if (!val_id || !tran_id || !bookingId) {
      console.error("Missing required parameters:", {
        val_id: !!val_id,
        tran_id: !!tran_id,
        bookingId: !!bookingId,
      });
      throw new Error(
        "SSLCommerz validation request missing required parameters.",
      );
    }

    const form = new URLSearchParams({
      val_id,
      store_id: storeId,
      store_passwd: storePassword,
      tran_id,
      amount: amount || "0",
      currency: currency || "BDT",
    });

    const response = await axios.post(validationApiUrl, form.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("SSLCommerz validation API response:", response.data);

    const data = response.data;
    const valid = data?.status === "VALID" || data?.status === "VALIDATED";

    if (!valid) {
      console.error("SSLCommerz validation failed:", data);
      await BookingService.updateBookingStatus(bookingId, "CANCELLED");
      throw new Error(
        data?.failedreason || data?.status || "SSLCommerz validation failed.",
      );
    }

    await BookingService.confirmBooking(bookingId);

    return {
      bookingId,
      transactionId: tran_id,
      validation: data,
      successRedirect: `${frontendUrl}/ssl-commerce/success?bookingId=${bookingId}`,
    };
  },
};
