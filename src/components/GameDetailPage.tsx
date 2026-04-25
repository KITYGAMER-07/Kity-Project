import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { getFileById, getPricesByFileId, getStockCount } from '../store/helpers';
import { getSetting, addPayment, updatePayment, getPaymentById, compressImage, addAdminNotification } from '../store/db';
import { QRCodeSVG } from 'qrcode.react';

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
    return <div className="text-center py-16 px-4"><div className="text-5xl mb-4">❌</div><p className="text-text-secondary text-sm">Product not found</p><button onClick={() => navigate('games')} className="btn-primary mt-4 px-6 py-2 rounded-xl text-sm">← Back</button></div>;
  }

  const upiId = getSetting('UPI_ID') || 'kitygamer@paytm';
  const curPrice = prices[selectedPlan] || prices[0];

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
      // Show preview immediately
      const previewUrl = URL.createObjectURL(f);
      setProofPreview(previewUrl);
      // Compress image for storage
      const compressed = await compressImage(f, 400, 0.5);
      setProofImage(compressed);
    } catch {
      // Fallback: try direct data URL
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
      
      // Send notification to admin
      const price = prices.find(p => p.id === curPrice?.id);
      addAdminNotification(
        'PAYMENT_PROOF',
        '📸 Payment Proof Uploaded!',
        `${currentUser?.username || 'User'} uploaded proof for ${file.fileName} - ₹${price?.price || 0} (${price?.durationDays || 0}D)`,
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

  if (step === 'success') {
    const pay = getPaymentById(payId);
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 text-center animate-fade-in">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="text-5xl sm:text-6xl mb-4">🎉</div>
          <h2 className="text-xl sm:text-2xl font-bold text-success mb-2">Payment Approved!</h2>
          <p className="text-text-secondary text-sm mb-4">Your purchase has been verified.</p>

          {pay?.deliveredKey && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-4 text-left">
              <p className="text-success text-sm font-semibold mb-1">🔑 Your Activation Key:</p>
              <div className="bg-success/10 rounded-lg p-3 flex items-center justify-between gap-2">
                <code className="text-success font-mono text-sm break-all">{pay.deliveredKey}</code>
                <button onClick={() => navigator.clipboard?.writeText(pay.deliveredKey!)} className="text-success text-xs bg-success/20 px-2 py-1 rounded flex-shrink-0">📋</button>
              </div>
            </div>
          )}

          {pay?.deliveredFile && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 text-left">
              <p className="text-primary-light text-sm font-semibold mb-2">📁 Your File:</p>
              {pay.deliveredFile.startsWith('data:image/') ? (
                <img src={pay.deliveredFile} alt="Delivered" className="max-h-48 rounded-lg mb-2" />
              ) : pay.deliveredFile.startsWith('data:') ? (
                <a href={pay.deliveredFile} download={pay.deliveredFileName || 'file'} className="btn-accent px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2">
                  📥 Download {pay.deliveredFileName}
                </a>
              ) : null}
            </div>
          )}

          <button onClick={() => { refreshData(); navigate('games'); }} className="btn-primary px-6 py-2 rounded-xl text-sm">← Back to Store</button>
        </div>
      </div>
    );
  }

  if (step === 'rejected') {
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 text-center animate-fade-in">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="text-5xl sm:text-6xl mb-4">❌</div>
          <h2 className="text-xl sm:text-2xl font-bold text-danger mb-2">Rejected</h2>
          <p className="text-text-secondary text-sm mb-1">Reason: <em className="text-warning">{rejectReason}</em></p>
          <p className="text-text-muted text-xs mb-4">Contact @KITYGAMER</p>
          <button onClick={() => { refreshData(); setStep('plans'); }} className="btn-primary px-6 py-2 rounded-xl text-sm">Try Again</button>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 animate-fade-in">
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-center">📸 Upload Payment Proof</h2>
          
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-primary transition-all mb-4 ${proofPreview ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
          >
            {uploading ? (
              <div>
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p className="text-text-secondary text-sm">Processing image...</p>
              </div>
            ) : proofPreview ? (
              <div>
                <img src={proofPreview} alt="Proof" className="max-h-44 mx-auto rounded-lg mb-2" />
                <p className="text-success text-xs">✅ Ready to submit — Tap to change</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-text-secondary text-sm">Tap to upload screenshot</p>
                <p className="text-text-muted text-xs mt-1">JPG, PNG supported</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          
          <div className="flex gap-2">
            <button onClick={() => setStep('payment')} className="flex-1 bg-surface-lighter py-3 rounded-xl text-text-secondary text-sm">← Back</button>
            <button onClick={handleProofUpload} disabled={!proofImage || uploading} className="flex-1 btn-accent py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
              {uploading ? '⏳ Processing...' : '✅ Submit Proof'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' || step === 'waiting') {
    const isWaiting = step === 'waiting';
    return (
      <div className="max-w-lg mx-auto p-3 sm:p-4 animate-fade-in">
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold">💳 Payment</h2>
            <div className={`px-2 py-1 rounded-full text-xs font-mono ${timer < 60 ? 'bg-danger/20 text-danger animate-pulse' : 'bg-surface-lighter text-text-secondary'}`}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
          <div className="w-full bg-surface-lighter rounded-full h-1.5 mb-4"><div className="progress-bar h-1.5 rounded-full" style={{ width: `${progress}%` }} /></div>

          <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 flex justify-center">
            <QRCodeSVG value={`upi://pay?pa=${upiId}&pn=KITYStore&am=${curPrice?.price || 0}&cu=INR`} size={160} level="M" />
          </div>

          <div className="space-y-1.5 mb-4 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Amount</span><span className="font-bold text-accent">₹{curPrice?.price || 0}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Duration</span><span>{curPrice?.durationDays || 0} Days</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">UPI</span><span className="font-mono text-xs text-primary-light truncate ml-2">{upiId}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Product</span><span className="text-right max-w-[50%] truncate">{file.fileName}</span></div>
          </div>

          {isWaiting ? (
            <div className="text-center py-3">
              <div className="animate-pulse text-2xl mb-2">⏳</div>
              <p className="text-text-secondary text-sm font-medium">Waiting for admin approval...</p>
              <p className="text-text-muted text-xs mt-1">Admin has been notified • Auto-updating</p>
              <div className="mt-3 w-full bg-surface-lighter rounded-full h-1">
                <div className="bg-warning h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-surface-lighter rounded-xl p-3 mb-3"><p className="text-xs text-text-muted text-center">⚠️ Pay using QR/UPI, then tap Done to upload proof</p></div>
              <div className="flex gap-2">
                <button onClick={() => { setStep('plans'); setTimer(600); }} className="flex-1 bg-surface-lighter py-3 rounded-xl text-text-secondary text-sm">← Cancel</button>
                <button onClick={handleDone} className="flex-1 btn-accent py-3 rounded-xl font-semibold text-sm">✅ Done</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      <button onClick={() => navigate('games')} className="text-text-secondary hover:text-white text-sm mb-3 inline-block">← Back</button>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <span className="text-5xl sm:text-6xl">🎮</span>
        </div>
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">{file.fileName}</h2>
          <p className="text-text-muted text-xs sm:text-sm mb-5">{file.fileSize}</p>

          {prices.length === 0 ? (
            <p className="text-text-secondary text-center py-6 text-sm">No plans available</p>
          ) : (
            <>
              <h3 className="font-semibold text-sm sm:text-base mb-3">💰 Choose Plan</h3>
              <div className="space-y-2">
                {prices.map((price, idx) => {
                  const stock = getStockCount(fileId, price.durationDays);
                  const sel = selectedPlan === idx;
                  return (
                    <div key={price.id} onClick={() => setSelectedPlan(idx)} className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${sel ? 'border-primary bg-primary/10' : 'border-border bg-surface-lighter'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-primary bg-primary' : 'border-border'}`}>
                            {sel && <span className="text-white text-[8px]">✓</span>}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{price.durationDays} Days</p>
                            <p className="text-text-muted text-[10px] sm:text-xs">{stock > 0 ? `${stock} in stock` : 'Out of stock'}</p>
                          </div>
                        </div>
                        <span className="text-accent font-bold text-base sm:text-xl">₹{price.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleBuy} disabled={!curPrice || getStockCount(fileId, curPrice?.durationDays || 0) === 0} className="w-full btn-accent mt-4 py-3 rounded-xl font-semibold text-sm sm:text-base disabled:opacity-50">
                🛒 Buy Now — ₹{curPrice?.price || 0}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
