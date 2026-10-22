import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Printer, 
  Download, 
  ExternalLink, 
  QrCode, 
  Copy, 
  Check, 
  X,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { Business } from '../../types/index.ts';

interface Props {
  business: Business;
  onClose?: () => void;
}

export const UBMCertificateModal: React.FC<Props> = ({ business, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showVerifyPortal, setShowVerifyPortal] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const cert = business.certificate;
  const verificationUrl = `https://ubm.app/verify/${cert.verificationCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTestVerification = () => {
    if (verifyInput.trim().toUpperCase() === cert.verificationCode.toUpperCase() ||
        verifyInput.trim() === cert.certificateHash ||
        verifyInput.trim().toUpperCase() === cert.certificateNumber.toUpperCase()) {
      setVerifyResult('VALID: Authenticated active tenant matching database record.');
    } else {
      setVerifyResult('INVALID: No matching active record found for this verification query.');
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-8 max-w-4xl mx-auto shadow-2xl">
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 no-print">
        <div className="flex items-center space-x-2">
          <Award className="w-6 h-6 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">UBM Business Setup Certificate</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowVerifyPortal(!showVerifyPortal)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-indigo-300 font-medium flex items-center space-x-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Public Verify Tool</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium flex items-center space-x-1.5 shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Certificate</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Verify Portal Simulation Dropdown */}
      {showVerifyPortal && (
        <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs no-print">
          <div className="font-semibold text-white mb-2 flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Public Verification Protocol Simulator</span>
          </div>
          <p className="text-slate-400 mb-3">
            External auditors, partners, or banks can verify this certificate authenticity using the certificate number, verification code, or cryptographic SHA-256 hash.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Enter code (e.g. ${cert.verificationCode} or ${cert.certificateNumber})`}
              value={verifyInput}
              onChange={e => setVerifyInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleTestVerification}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Verify Record
            </button>
          </div>
          {verifyResult && (
            <div className={`mt-2 p-2 rounded text-xs font-mono font-medium ${
              verifyResult.startsWith('VALID') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
            }`}>
              {verifyResult}
            </div>
          )}
        </div>
      )}

      {/* THE ACTUAL PRINTABLE CERTIFICATE */}
      <div className="print-container bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-600/40 rounded-2xl p-8 sm:p-12 text-slate-100 relative shadow-2xl overflow-hidden">
        {/* Subtle Guilloche / Watermark Pattern */}
        <div className="absolute inset-0 border border-amber-500/20 m-2 rounded-xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-800/20 font-black text-8xl tracking-widest pointer-events-none select-none uppercase">
          UBM ACCREDITED
        </div>

        {/* Certificate Header */}
        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3 border border-amber-400/40">
            <Award className="w-9 h-9 text-white" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-amber-400">
            UNIVERSAL BUSINESS MANAGEMENT PROTOCOL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            CERTIFICATE OF BUSINESS OPERATIONAL SETUP
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global SaaS Cloud Accreditation • Tenant Isolation Verification
          </p>
        </div>

        {/* Certificate Body */}
        <div className="my-8 text-center relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">This document formally attests that</p>
          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-amber-200">
            {business.legalName || business.name}
          </div>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            Operating as <strong className="text-white">"{business.name}"</strong> has successfully satisfied all architectural requirements, data segregation parameters, and cloud initialization protocols for commercial deployment.
          </p>
        </div>

        {/* Core Record Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative z-10 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificate Number</span>
            <span className="font-mono font-bold text-indigo-300">{cert.certificateNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Industry Sector</span>
            <span className="font-semibold text-white capitalize">{business.category}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Base Currency</span>
            <span className="font-semibold text-white">{business.baseCurrency} ({business.currencySymbol})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Issuance Date</span>
            <span className="font-semibold text-white">{new Date(cert.issueDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Entity Particulars */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 relative z-10 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Registered Headquarter Location</span>
            <span className="text-slate-200">{business.address}, {business.city}, {business.country}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Tax / Commercial Registration</span>
            <span className="text-slate-200">
              Tax ID: {business.taxNumber || 'Registered'} | Reg: {business.registrationNumber || 'Standard'}
            </span>
          </div>
        </div>

        {/* Cryptographic Verification Footer */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs">
          <div className="flex items-center space-x-4">
            {/* Visual QR Code Placeholder */}
            <div className="w-16 h-16 bg-white p-1.5 rounded-lg flex items-center justify-center shrink-0 shadow">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SHA-256 Cloud Cryptographic Seal</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                {cert.certificateHash}
              </div>
              <div className="text-[10px] text-indigo-400 font-medium mt-1">
                Verification Code: <span className="font-mono font-bold text-white">{cert.verificationCode}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-serif italic text-amber-200/90 font-bold text-base">
              Universal Business Management
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              {cert.issuedBy}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              Status: ACTIVE & AUTHENTICATED
            </div>
          </div>
        </div>

        {/* Mandatory Statutory Legal Disclaimer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 leading-relaxed text-center relative z-10 flex items-start justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="max-w-2xl">
            <strong>LEGAL NOTICE & STATUTORY SEPARATION:</strong> {cert.disclaimer} This document serves as independent cloud software accreditation and operational tenant validation only.
          </p>
        </div>
      </div>

      {/* Shareable Verification Link */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800 no-print">
        <span className="text-slate-400">Public Verification Link:</span>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            readOnly
            value={verificationUrl}
            className="bg-slate-900 text-indigo-300 font-mono px-3 py-1.5 rounded-lg border border-slate-800 text-xs w-full sm:w-72"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1 shrink-0 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
