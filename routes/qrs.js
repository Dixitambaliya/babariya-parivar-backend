const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrController");

// POST /api/qrs/dynamic
router.post("/dynamic", qrController.createDynamicQR);
// POST /api/qrs/static
router.post("/static", qrController.createStaticQR);

module.exports = router;