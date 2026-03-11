const razorpay = require('../config/razorpay');

async function createDynamicQR(req, res) {
  try {
    const { amount, customer_name } = req.body;
    const response = await razorpay.qrCode.create({
      type: "upi_qr",
      name: customer_name || "Customer",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: amount * 100, // Rs to paise
      description: "Payment for order"
    });

    // Save QR info to DB (pseudo code)
    // await db.query('INSERT INTO qr_transactions (razorpay_qr_id, amount, status, customer_name) VALUES (?, ?, ?, ?)', [response.id, amount, response.status, customer_name]);

    res.json({ qr: response, qr_image: response.image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}