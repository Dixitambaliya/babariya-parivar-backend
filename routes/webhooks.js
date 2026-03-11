const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

router.post("/razorpay", express.json({ verify: false }), webhookController.razorpayWebhook);

module.exports = router;