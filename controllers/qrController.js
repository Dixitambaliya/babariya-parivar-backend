const razorpay = require("../config/razorpay");
const qrService = require("../services/qrService");

// POST /api/qrs/dynamic
exports.createDynamicQR = async (req, res) => {
  try {
    const { amount, customer_name,city,profile_image } = req.body;
    if (!amount || !customer_name) {
      return res.status(400).json({ error: "amount and customer_name required" });
    }

    const qr = await razorpay.qrCode.create({
      type: "upi_qr",
      name: customer_name,
      usage: "single_use",
      fixed_amount: true,
      payment_amount: amount * 100,
      description: "Parivar Payment",
    });

    await qrService.saveQR({
      razorpay_qr_id: qr.id,
      amount,
      status: qr.status,
      customer_name,
      city,
      profile_image
    });

    res.json({ qr_id: qr.id, qr_image: qr.image_url });
  } catch (err) {
    console.error("createDynamicQR error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/qrs/static
exports.createStaticQR = async (req, res) => {
  try {
    const qr = await razorpay.qrCode.create({
      type: "upi_qr",
      name: "Babariya Parivar",
      usage: "multiple_use",
      fixed_amount: false, // <-- Add this line!
      description: "Donate to Babariya Parivar",
    });
    res.json({ qr_id: qr.id, qr_image: qr.image_url });
  } catch (err) {
    console.error("createStaticQR error:", err);
    res.status(500).json({ error: err.message });
  }
};