'use client';

import React from 'react';
// ✅ Correct way to import QRCode component
import { QRCode } from 'react-qrcode-logo'; // or use 'qrcode.react' if you're using that

export default function InvoiceQR({ value }) {
  return (
    <div style={{ width: '100px', height: '100px' }}>
      <QRCode value={value} size={100} />
    </div>
  );
}
