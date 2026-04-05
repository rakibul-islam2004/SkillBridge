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

  async mockPaymentGateway(req: Request, res: Response) {
    const { bookingId, tran_id, val_id, amount } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const paymentMethods = [
      { id: "bkash", name: "bKash", icon: "📱" },
      { id: "nagad", name: "Nagad", icon: "📱" },
      { id: "rocket", name: "Rocket", icon: "📱" },
      { id: "card", name: "Credit/Debit Card", icon: "💳" },
    ];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Select Payment Method</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 50px auto; padding: 20px; }
          .card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px; }
          h1 { font-size: 24px; margin-bottom: 10px; color: #333; }
          .amount { font-size: 18px; color: #666; margin-bottom: 30px; }
          .methods { display: grid; gap: 12px; }
          .method { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
            padding: 15px; 
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
          }
          .method:hover { 
            border-color: #4f46e5; 
            background: #f9f9ff;
          }
          .method.active {
            border-color: #4f46e5;
            background: #f0f4ff;
          }
          .method-icon { font-size: 32px; }
          .method-name { font-size: 16px; font-weight: 500; color: #333; flex: 1; }
          .method-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #e0e0e0; }
          .method.active .method-radio { background: #4f46e5; border-color: #4f46e5; }
          .pay-btn {
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .pay-btn:hover { background: #3f3ccc; }
          .pay-btn:disabled { background: #ccc; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>Select Payment Method</h1>
            <div class="amount">Amount: ৳${amount}</div>
            
            <div class="methods" id="methods">
              ${paymentMethods
                .map(
                  (method) => `
                <div class="method" onclick="selectMethod('${method.id}')">
                  <div class="method-icon">${method.icon}</div>
                  <div class="method-name">${method.name}</div>
                  <div class="method-radio"></div>
                </div>
              `,
                )
                .join("")}
            </div>

            <button class="pay-btn" onclick="submitPayment()" id="payBtn">
              Pay ৳${amount}
            </button>
          </div>
        </div>

        <script>
          let selectedMethod = null;

          function selectMethod(method) {
            document.querySelectorAll('.method').forEach(m => m.classList.remove('active'));
            event.target.closest('.method').classList.add('active');
            selectedMethod = method;
          }

          function submitPayment() {
            if (!selectedMethod) {
              alert('Please select a payment method');
              return;
            }

            // Simulate payment processing
            const payBtn = document.getElementById('payBtn');
            payBtn.disabled = true;
            payBtn.textContent = 'Processing...';

            // Auto-redirect to success after brief delay
            setTimeout(() => {
              const successUrl = '${frontendUrl}/ssl-commerce/success?bookingId=${bookingId}&tran_id=${tran_id}&status=VALID&val_id=${val_id}&value_a=${bookingId}&mock=true';
              window.location.href = successUrl;
            }, 1500);
          }

          // Auto-select first method on load
          window.addEventListener('load', () => {
            selectMethod('${paymentMethods[0].id}');
          });
        </script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  },
};
