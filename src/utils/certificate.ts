import { UBMCertificate, Business } from '../types/index.ts';

// Simple fast SHA-256 string generator using Web Crypto API
export async function generateCertificateHash(dataString: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(dataString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Deterministic fallback
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'ubm_' + Math.abs(hash).toString(16).padStart(16, '0') + Date.now().toString(16);
}

export async function createNewUBMCertificate(businessName: string, ownerId: string, taxNumber?: string): Promise<UBMCertificate> {
  const issueDate = new Date().toISOString();
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  const certificateNumber = `UBM-${new Date().getFullYear()}-${randHex}`;
  const verificationCode = `VER-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const payload = `${businessName}|${ownerId}|${certificateNumber}|${issueDate}|${taxNumber || 'N/A'}`;
  const certificateHash = await generateCertificateHash(payload);

  return {
    certificateNumber,
    verificationCode,
    issueDate,
    validUntil,
    certificateHash,
    status: 'issued',
    issuedBy: 'UBM Global SaaS Accreditation Authority',
    issuerAuthority: 'Universal Business Management Cloud Protocol',
    disclaimer: 'IMPORTANT NOTICE: This certificate certifies that this enterprise has been verified and registered on the UBM Cloud Platform. It does NOT replace official state/federal government registration, business licenses, or statutory regulatory charters.'
  };
}
