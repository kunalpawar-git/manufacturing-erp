import QRCode from 'qrcode';
import { generateSecureToken } from './idGenerator.js';

export const generateQrDataUrl = async (payload) => {
  const options = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    width: 256,
  };

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return await QRCode.toDataURL(payloadString, options);
};

export const createSecureQrPayload = (type, id, token = null) => {
  const secureToken = token || generateSecureToken(type, id);
  return {
    t: type,          // 'part' | 'box' | 'batch' | 'shipment'
    id: id,           // readable ID e.g. PT-0001, BX-0145
    k: secureToken,   // opaque security verification token
    ts: Date.now(),
  };
};
