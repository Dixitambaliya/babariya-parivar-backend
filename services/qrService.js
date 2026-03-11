const db = require("../config/db");

exports.saveQR = async ({ razorpay_qr_id, amount, status, customer_name, city, profile_image }) => {
  await db.execute(
    "INSERT INTO qr_transactions (razorpay_qr_id, amount, status, customer_name, city, profile_image) VALUES (?, ?, ?, ?, ?, ?)",
    [razorpay_qr_id, amount, status, customer_name, city, profile_image]
  );
};

exports.updateQRStatus = async ({ razorpay_qr_id, payment_id, status }) => {
  await db.execute(
    "UPDATE qr_transactions SET status=?, payment_id=? WHERE razorpay_qr_id=?",
    [status, payment_id, razorpay_qr_id]
  );
};