const encoder = new TextEncoder();

async function getCryptoKey(secret: string) {
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload: Record<string, any>, secret: string): Promise<string> {
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = btoa(payloadStr);
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadBase64)
  );
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${payloadBase64}.${signatureHex}`;
}

export async function verifyToken(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const [payloadBase64, signatureHex] = token.split('.');
    if (!payloadBase64 || !signatureHex) return null;
    const key = await getCryptoKey(secret);
    
    // Re-sign to verify signature matches
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payloadBase64)
    );
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (calculatedHex !== signatureHex) {
      return null;
    }
    
    const payloadStr = atob(payloadBase64);
    const payload = JSON.parse(payloadStr);
    
    // Check if session has expired
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('verifyToken failed:', error);
    return null;
  }
}
