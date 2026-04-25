import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { getFileById, getPricesByFileId, getStockCount } from '../store/helpers';
import { getSetting, addPayment, updatePayment, getPaymentById, compressImage, addAdminNotification } from '../store/db';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from './Icon';
import { ProductVisual } from './ProductVisual';

interface Props { fileId: number; }

const GameDetailPage: React.FC<Props> = ({ fileId }) => {
  const { navigate, currentUserId, refreshData, currentUser } = useApp();
  const file = getFileById(fileId);
  const prices = getPricesByFileId(fileId);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [step, setStep] = useState<'plans' | 'payment' | 'upload' | 'waiting' | 'success' | 'rejected'>('plans');
  const [payId, setPayId] = useState(0);
  const [proofImage, setProofImage] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const [timer, setTimer] = useState(600);
  const [rejectReason, setRejectReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 'payment' && step !== 'waiting') return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) { clearInterval(interval); setStep('plans'); return 600; }
        return prev - 1;
      });
      if (payId > 0) {
        const pay = getPaymentById(payId);
        if (pay?.status === 'APPROVED') { clearInterval(interval); setStep('success'); refreshData(); }
        else if (pay?.status === 'REJECTED') { clearInterval(interval); setRejectReason(pay.rejectReason || 'No reason'); setStep('rejected'); refreshData(); }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step, payId, refreshData]);

  if (!file) {
    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <span className="empty-icon" style={{ background: 'rgba(255,90,107,0.12)', borderColor: 'rgba(255,90,107,0.25)', color: 'var(--color-danger)' }}>
          <Icon name="x-circle" className="w-6 h-6" />
        </span>
        <p className="text-text-secondary text-sm mt-2">Product not found</p>
        <button onClick={() => navigate('games')} className="btn-primary mt-4 px-6 py-2 rounded-xl text-sm">
          <Icon name="arrow-left" className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const upiId = getSetting('UPI_ID') || 'kitygamer@paytm';
  const curPrice = prices[selectedPlan] || prices[0];

  const copyKey = (k: string) => {
    navigator.clipboard?.writeText(k);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBuy = () => {
    if (!curPrice) return;
    const p = addPayment(currentUserId, fileId, curPrice.id);
    setPayId(p.id); setStep('payment'); setTimer(600);
  };

  const handleDone = () => {
    updatePayment(payId, { doneClicked: true });
    setStep('upload');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const previewUrl = URL.createObjectURL(f);
      setProofPreview(previewUrl);
      const compressed = await compressImage(f, 400, 0.5);
      setProofImage(compressed);
    } catch {
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setProofImage(ev.target?.result as string);
          setProofPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(f);
      } catch {
        alert('Failed to process image. Try a smaller image.');
      }
    }
    setUploading(false);
  };

  const handleProofUpload = () => {
    if (!proofImage) return;
    try {
      updatePayment(payId, { proofImage, status: 'PROOF_UPLOADED' });
      const price = prices.find(p => p.id === curPrice?.id);
      addAdminNotification(
        'PAYMENT_PROOF',
        'Payment proof uploaded',
        `${currentUser?.username || 'User'} uploaded proof for ${file.fileName} — ₹${price?.price || 0} (${price?.durationDays || 0}D)`,
        payId
      );
      setStep('waiting');
      refreshData();
    } catch {
      alert('Failed to upload proof. Storage may be full. Try a smaller image.');
    }
  };

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const progress = ((600 - timer) / 600) * 100;

  // ===== SUCCESS =====
  if (step === 'success') {
    const pay = getPaymentById(payId);
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 animate-fade-in">
        <div className="panel-card p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/15 border border-success/30 text-success mb-4">
            <Icon name="check-circle" className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2">Payment approved</h2>
          <p className="text-text-secondary text-sm mb-5">Your purchase has been verified.</p>

          {pay?.deliveredKey && (
            <div className="bg-success/[0.08] border border-success/25 rounded-xl p-4 mb-4 text-left">
              <p className="text-success text-xs font-semibold mb-2 inline-flex items-center gap-1.5">
                <Icon name="key" className="w-3.5 h-3.5" /> Your activation key
              </p>
              <div className="bg-bg/40 rounded-lg p-3 flex items-center justify-between gap-2">
                <code className="text-success font-mono text-sm break-all">{pay.deliveredKey}</code>
                <button
                  onClick={() => copyKey(pay.deliveredKey!)}
                  className="text-success text-xs bg-success/15 hover:bg-success/25 px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0 transition-colors"
                  aria-label="Copy key"
                >
                  <Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {pay?.deliveredFile && (
            <div className="bg-primary/[0.08] border border-primary/25 rounded-xl p-4 mb-4 text-left">
              <p className="text-primary-light text-xs font-semibold mb-2 inline-flex items-center gap-1.5">
                <Icon name="folder" className="w-3.5 h-3.5" /> Your file
              </p>
              {pay.deliveredFile.startsWith('data:image/') ? (
                <img src={pay.deliveredFile} alt="Delivered" className="max-h-48 rounded-lg" />
              ) : pay.deliveredFile.startsWith('data:') ? (
                <a
                  href={pay.deliveredFile}
                  download={pay.deliveredFileName || 'file'}
                  className="btn-accent px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2"
                >
                  <Icon name="download" className="w-4 h-4" />
                  Download {pay.deliveredFileName}
                </a>
              ) : null}
            </div>
          )}

          <button
            onClick={() => { refreshData(); navigate('games'); }}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm"
          >
            <Icon name="arrow-left" className="w-4 h-4" /> Back to store
          </button>
        </div>
      </div>
    );
  }

  // ===== REJECTED =====
  if (step === 'rejected') {
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 animate-fade-in">
        <div className="panel-card p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-danger/15 border border-danger/30 text-danger mb-4">
            <Icon name="x-circle" className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2">Payment rejected</h2>
          <div className="status-badge status-warning mb-3">
            <Icon name="alert" className="w-3 h-3" /> {rejectReason}
          </div>
          <p className="text-text-muted text-xs mb-5">Need help? Contact @KITYGAMER</p>
          <button
            onClick={() => { refreshData(); setStep('plans'); }}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm"
          >
            <Icon name="rocket" className="w-4 h-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  // ===== UPLOAD =====
  if (step === 'upload') {
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 animate-fade-in">
        <div className="panel-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="icon-box icon-box-warning">
              <Icon name="camera" className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold">Upload payment proof</h2>
          </div>

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) fileInputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/[0.04] transition-all mb-4 ${
              proofPreview ? 'border-primary/50 bg-primary/[0.06]' : 'border-border'
            }`}
          >
            {uploading ? (
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 text-primary-light mb-3 animate-pulse-soft">
                  <Icon name="clock" className="w-6 h-6" />
                </div>
                <p className="text-text-secondary text-sm">Processing image...</p>
              </div>
            ) : proofPreview ? (
              <div>
                <img src={proofPreview} alt="Proof" className="max-h-44 mx-auto rounded-lg mb-3" />
                <p className="text-success text-xs inline-flex items-center gap-1.5">
                  <Icon name="check-circle" className="w-3.5 h-3.5" />
                  Ready to submit — tap to change
                </p>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary-light mb-3">
                  <Icon name="upload" className="w-6 h-6" />
                </div>
                <p className="text-text-secondary text-sm">Tap to upload screenshot</p>
                <p className="text-text-muted text-xs mt-1">JPG or PNG</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          <div className="flex gap-2">
            <button
              onClick={() => setStep('payment')}
              className="flex-1 btn-secondary py-3 rounded-xl text-sm"
            >
              <Icon name="arrow-left" className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleProofUpload}
              disabled={!proofImage || uploading}
              className="flex-1 btn-accent py-3 rounded-xl text-sm"
            >
              {uploading ? (
                <><Icon name="clock" className="w-4 h-4" /> Processing...</>
              ) : (
                <><Icon name="check" className="w-4 h-4" /> Submit proof</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== PAYMENT or WAITING =====
  if (step === 'payment' || step === 'waiting') {
    const isWaiting = step === 'waiting';
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 animate-fade-in">
        <div className="panel-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="icon-box icon-box-accent">
                <Icon name="card" className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">Payment</h2>
            </div>
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-mono inline-flex items-center gap-1.5 border ${
                timer < 60
                  ? 'bg-danger/15 text-danger border-danger/25 animate-pulse-soft'
                  : 'bg-surface-lighter text-text-secondary border-border'
              }`}
            >
              <Icon name="clock" className="w-3 h-3" />
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
          <div className="w-full bg-surface-lighter rounded-full h-1.5 mb-5 overflow-hidden">
            <div className="progress-bar h-1.5 rounded-full" style={{ width: `${progress}%` }} />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 flex justify-center relative">
            <QRCodeSVG
              value={`upi://pay?pa=${upiId}&pn=KITYStore&am=${curPrice?.price || 0}&cu=INR`}
              size={170}
              level="M"
            />
            <span className="absolute top-2 left-2 text-[10px] font-medium text-bg/70 inline-flex items-center gap-1">
              <Icon name="qr" className="w-3 h-3" /> UPI QR
            </span>
          </div>

          <dl className="space-y-2 mb-5 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <dt className="text-text-secondary inline-flex items-center gap-1.5">
                <Icon name="tag" className="w-3.5 h-3.5" /> Amount
              </dt>
              <dd className="font-extrabold text-accent text-base">₹{curPrice?.price || 0}</dd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <dt className="text-text-secondary inline-flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5" /> Duration
              </dt>
              <dd>{curPrice?.durationDays || 0} days</dd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/60 gap-2">
              <dt className="text-text-secondary inline-flex items-center gap-1.5 flex-shrink-0">
                <Icon name="wallet" className="w-3.5 h-3.5" /> UPI
              </dt>
              <dd className="font-mono text-xs text-primary-light truncate">{upiId}</dd>
            </div>
            <div className="flex justify-between items-center py-1.5 gap-2">
              <dt className="text-text-secondary inline-flex items-center gap-1.5 flex-shrink-0">
                <Icon name="folder" className="w-3.5 h-3.5" /> Product
              </dt>
              <dd className="text-right truncate">{file.fileName}</dd>
            </div>
          </dl>

          {isWaiting ? (
            <div className="text-center py-4 px-3 rounded-xl bg-warning/[0.06] border border-warning/20">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warning/15 text-warning mb-2 animate-pulse-soft">
                <Icon name="clock" className="w-6 h-6" />
              </div>
              <p className="text-text-secondary text-sm font-medium">Waiting for admin approval...</p>
              <p className="text-text-muted text-xs mt-1">Admin notified — auto-updating</p>
              <div className="mt-3 w-full bg-surface-lighter rounded-full h-1 overflow-hidden">
                <div className="bg-warning h-1 rounded-full animate-pulse-soft" style={{ width: '60%' }} />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-surface-lighter rounded-xl p-3 mb-3 inline-flex items-start gap-2 w-full border border-border">
                <Icon name="info" className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted">Pay using QR or UPI ID, then tap Done to upload your proof.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('plans'); setTimer(600); }}
                  className="flex-1 btn-secondary py-3 rounded-xl text-sm"
                >
                  <Icon name="x" className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleDone}
                  className="flex-1 btn-accent py-3 rounded-xl text-sm"
                >
                  <Icon name="check" className="w-4 h-4" /> Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== PLANS =====
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      <button
        onClick={() => navigate('games')}
        className="btn-ghost text-sm mb-3 px-2 py-1.5 -ml-2"
      >
        <Icon name="arrow-left" className="w-4 h-4" /> Back
      </button>

      <div className="panel-card overflow-hidden">
        <ProductVisual
          name={file.fileName}
          seed={file.id}
          className="h-36 sm:h-52"
          initialsClassName="text-4xl sm:text-6xl"
        />
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-1">{file.fileName}</h2>
          <div className="flex items-center gap-3 text-text-muted text-xs sm:text-sm mb-5">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="file" className="w-3.5 h-3.5" /> {file.fileSize}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="shield" className="w-3.5 h-3.5 text-success" /> Verified
            </span>
          </div>

          {prices.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Icon name="tag" className="w-5 h-5" /></span>
              <p className="text-sm">No plans available yet</p>
            </div>
          ) : (
            <>
              <h3 className="section-title mb-3 text-sm sm:text-base">
                <Icon name="tag" className="w-4 h-4 text-accent" />
                Choose your plan
              </h3>
              <div className="space-y-2">
                {prices.map((price, idx) => {
                  const stock = getStockCount(fileId, price.durationDays);
                  const sel = selectedPlan === idx;
                  const oos = stock === 0;
                  return (
                    <button
                      key={price.id}
                      onClick={() => setSelectedPlan(idx)}
                      disabled={oos}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        sel ? 'border-primary bg-primary/10' : 'border-border bg-surface-lighter/60 hover:border-primary/40'
                      } ${oos ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            sel ? 'border-primary bg-primary text-white' : 'border-border'
                          }`}
                        >
                          {sel && <Icon name="check" className="w-3 h-3" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{price.durationDays} days</p>
                          <span className={`status-badge mt-1 ${oos ? 'status-danger' : 'status-success'}`}>
                            <span className="dot" />
                            {oos ? 'Out of stock' : `${stock} in stock`}
                          </span>
                        </div>
                      </div>
                      <span className="text-accent font-extrabold text-base sm:text-xl flex-shrink-0">₹{price.price}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleBuy}
                disabled={!curPrice || getStockCount(fileId, curPrice?.durationDays || 0) === 0}
                className="w-full btn-accent mt-5 py-3 rounded-xl text-sm sm:text-base"
              >
                <Icon name="zap" className="w-4 h-4" />
                Buy now — ₹{curPrice?.price || 0}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
