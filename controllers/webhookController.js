const db = require("../config/db"); // <-- ADD THIS LINE
const qrService = require("../services/qrService");
const { generatePaymentPdf } = require("../utils/pdfUtil");

exports.razorpayWebhook = async (req, res) => {
  try {
    if (req.body.event === "qr_code.paid") {
      const payment = req.body.payload.payment.entity;
      await qrService.updateQRStatus({
        razorpay_qr_id: payment.qr_code_id,
        payment_id: payment.id,
        status: "paid",
      });

      // Fetch the transaction/user info from DB:
      const [result] = await db.execute(
        "SELECT * FROM qr_transactions WHERE razorpay_qr_id = ?",
        [payment.qr_code_id]
      );
      const details = result[0];

      if (details) {
        await generatePaymentPdf({
          username: details.customer_name,
          city: details.city,
          amount: details.amount,
          profile_image: details.profile_image,
          payment_id: payment.id,
        });
      }
    }
    res.send("ok");
  } catch (err) {
    console.error("razorpayWebhook error:", err);
    res.status(500).json({ error: err.message });
  }
};