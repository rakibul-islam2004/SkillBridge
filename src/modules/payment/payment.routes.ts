import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { PaymentController } from "./payment.controller.js";

const router = Router();

router.post(
  "/ssl-commerce/session",
  authMiddleware,
  PaymentController.createSSLCommerzSession,
);
router.get("/ssl-commerce/success", PaymentController.sslCommerzSuccess);
router.get("/ssl-commerce/fail", PaymentController.sslCommerzFail);

export default router;
