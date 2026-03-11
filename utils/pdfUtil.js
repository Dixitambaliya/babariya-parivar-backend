const PDFDocument = require('pdfkit');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function downloadImageToBuffer(imageUrl) {
  if (!imageUrl) return null;
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return response.data;
  } catch (err) {
    console.warn("Unable to download image:", err.message);
    return null;
  }
}

exports.generatePaymentPdf = async ({ username, city, amount, profile_image, payment_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Receipt setup
      const pdfDir = path.join(__dirname, '..', 'pdfs');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
      const pdfPath = path.join(pdfDir, `payment_${payment_id}.pdf`);
      const doc = new PDFDocument({ margin: 40 });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // 2. Header / Logo
      doc
        .rect(0, 0, doc.page.width, 70)
        .fill('#3B82F6')
        .fillColor('white')
        .fontSize(26)
        .text('Payment Receipt', 40, 25, { align: 'left' })
        .moveDown();

      doc.moveTo(40, 80).lineTo(doc.page.width - 40, 80).stroke('#3B82F6');

      // 3. Profile image with fallback
      const profileY = 110;
      if (profile_image) {
        const imgBuffer = await downloadImageToBuffer(profile_image);
        if (imgBuffer) {
          doc.image(imgBuffer, 40, profileY, { width: 72, height: 72, fit: [72, 72], align: 'left', valign: 'top' })
            .rect(40, profileY, 72, 72).stroke('#3B82F6');
        }
      }

      // 4. Receipt Details
      const labelX = 130;
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('Name:', labelX, profileY + 8)
        .font('Helvetica')
        .fontSize(15)
        .text(username, labelX + 70, profileY + 8);

      doc
        .font('Helvetica-Bold')
        .text('City:', labelX, profileY + 32)
        .font('Helvetica')
        .text(city, labelX + 70, profileY + 32);

      doc
        .font('Helvetica-Bold')
        .text('Amount:', labelX, profileY + 56)
        .font('Helvetica')
        .fillColor('green')
        .text(`₹ ${amount}.00`, labelX + 70, profileY + 56);

      // 5. Receipt Meta (Payment ID, Date)
      const metaY = profileY + 100;
      doc
        .moveDown()
        .moveTo(40, metaY).lineTo(doc.page.width - 40, metaY).stroke('#888');
      doc
        .font('Helvetica-Bold')
        .fillColor('#0F172A')
        .fontSize(12)
        .text('Payment ID:', 40, metaY + 12)
        .font('Helvetica')
        .text(payment_id, 120, metaY + 12);

      doc
        .font('Helvetica-Bold')
        .text('Date:', 40, metaY + 30)
        .font('Helvetica')
        .text(new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }), 120, metaY + 30);

      // 6. Thank you
      doc
        .fontSize(15)
        .fillColor('#3B82F6')
        .text('\n\nThank you for your payment!', { align: 'center' });

      // 7. Footer
      doc.fontSize(10).fillColor("#888").text(
        "This is a system-generated receipt. For queries, contact support@yourdomain.com",
        40, doc.page.height - 60, { align: 'center' }
      );

      doc.end();

      writeStream.on('finish', () => resolve(pdfPath));
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};