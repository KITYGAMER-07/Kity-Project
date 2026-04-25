import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { getFileById, getPricesByFileId, getStockCount } from '../store/helpers';
import { getSetting, addPayment, updatePayment, getPaymentById } from '../store/db';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  fileId: number;
}

const GameDetailPage: React.FC<Props> = ({ fileId }) => {
  const { navigate, currentUserId, refreshData } = useApp();
  const file = getFileById(fileId);
  const prices = getPricesByFileId(fileId);
  const [selectedPlan, setSelectedPlan] = useState<number>(0);
  const [paymentStep, setPaymentStep] = useState<'plans' | 'payment' | 'upload' | 'success' | 'rejected'>('plans');
  const [currentPaymentId, setCurrentPaymentId] = useState<number>(0);
  const [proofImage, setProofImage] = useState<string>('');
  const [timer, setTimer] = useState(600);
  const [rejectedReason, setRejectedReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paymentStep !== 'payment' && paymentStep !== 'upload') return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setPaymentStep('plans');
          return 600;
        }
        return prev - 1;
      });
      // Check payment status
      if (currentPaymentId > 0) {
        const pay = getPaymentById(currentPaymentId);
        if (pay) {
          if (pay.status === 'APPROVED') {
            clearInterval(interval);
            setPaymentStep('success');
          } else if (pay.status === 'REJECTED') {
            clearInterval(interval);
            setRejectedReason(pay.rejectReason || 'No reason provided');
            setPaymentStep('rejected');
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentStep, currentPaymentId]);

  if (!file) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-text-secondary">Product not found</p>
        <button onClick={() => navigate('games')} className="btn-primary mt-4 px-6 py-2 rounded-xl">← Back to Store</button>
      </div>
    );
  }

  const upiId = getSetting('UPI_ID') || 'kitygamer@paytm';
  const currentPrice = prices[selectedPlan] || prices[0];

  const handleBuy = () => {
    if (!currentPrice) return;
    const pay = addPayment(currentUserId, fileId, currentPrice.id);
    setCurrentPaymentId(pay.id);
    setPaymentStep('payment');
    setTimer(600);
  };

  const handleDone = () => {
    updatePayment(currentPaymentId, { doneClicked: true });
    setPaymentStep('upload');
  };

  const handleProofUpload = () => {
    if (!proofImage) return;
    updatePayment(currentPaymentId, { proofImage, status: 'PENDING' });
    setPaymentStep('payment');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofImage(ev.target?.result as string);
    };
    reader.readAsDataURL(f);
  };

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const progress = ((600 - timer) / 600) * 100;

  if (paymentStep === 'success') {
    return (
      <div className="max-w-lg mx-auto p-4 text-center animate-fade-in">
        <div className="glass-card rounded-2xl p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-success mb-2">Payment Approved!</h2>
          <p className="text-text-secondary mb-4">Your purchase has been verified successfully.</p>
          <p className="text-sm text-text-muted mb-6">The admin will send your file/key shortly.</p>
          <button onClick={() => { refreshData(); navigate('games'); }} className="btn-primary px-6 py-2 rounded-xl">
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (paymentStep === 'rejected') {
    return (
      <div className="max-w-lg mx-auto p-4 text-center animate-fade-in">
        <div className="glass-card rounded-2xl p-8">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-danger mb-2">Payment Rejected</h2>
          <p className="text-text-secondary mb-2">Reason: <em className="text-warning">{rejectedReason}</em></p>
          <p className="text-sm text-text-muted mb-6">Please try again or contact @KITYGAMER</p>
          <button onClick={() => { refreshData(); setPaymentStep('plans'); }} className="btn-primary px-6 py-2 rounded-xl">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (paymentStep === 'upload') {
    return (
      <div className="max-w-lg mx-auto p-4 animate-fade-in">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 text-center">📸 Upload Payment Proof</h2>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all mb-4"
          >
            {proofImage ? (
              <div>
                <img src={proofImage} alt="Proof" className="max-h-48 mx-auto rounded-lg mb-2" />
                <p className="text-success text-sm">✅ Image selected - Click to change</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-text-secondary">Click to upload screenshot</p>
                <p className="text-text-muted text-xs">PNG, JPG up to 5MB</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          
          <div className="flex gap-3">
            <button onClick={() => setPaymentStep('payment')} className="flex-1 bg-surface-lighter py-3 rounded-xl text-text-secondary hover:text-white transition-all">
              ← Back
            </button>
            <button
              onClick={handleProofUpload}
              disabled={!proofImage}
              className="flex-1 btn-primary py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Submit Proof
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'payment') {
    return (
      <div className="max-w-lg mx-auto p-4 animate-fade-in">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">💳 Payment</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-mono ${timer < 60 ? 'bg-danger/20 text-danger' : 'bg-surface-lighter text-text-secondary'}`}>
              ⏱️ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-lighter rounded-full h-2 mb-6">
            <div className="progress-bar h-2 rounded-full" style={{ width: `${progress}%` }} />
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 mb-4 flex justify-center">
            <QRCodeSVG
              value={`upi://pay?pa=${upiId}&pn=KITYStore&am=${currentPrice?.price || 0}&cu=INR`}
              size={180}
              level="M"
            />
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Amount</span>
              <span className="font-bold text-accent">₹{currentPrice?.price || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Duration</span>
              <span>{currentPrice?.durationDays || 0} Days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">UPI ID</span>
              <span className="font-mono text-xs text-primary-light">{upiId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Product</span>
              <span>{file.fileName}</span>
            </div>
          </div>

          <div className="bg-surface-lighter rounded-xl p-3 mb-4">
            <p className="text-xs text-text-muted text-center">
              ⚠️ Pay using the QR code or UPI ID above, then click "Done" and upload screenshot
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPaymentStep('plans'); setTimer(600); }} className="flex-1 bg-surface-lighter py-3 rounded-xl text-text-secondary hover:text-white transition-all">
              ← Cancel
            </button>
            <button
              onClick={handleDone}
              className="flex-1 btn-accent py-3 rounded-xl font-semibold"
            >
              ✅ Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Plans selection
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <button onClick={() => navigate('games')} className="text-text-secondary hover:text-white transition-colors mb-4 flex items-center gap-1">
        ← Back to Store
      </button>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className={`h-40 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center`}>
          <span className="text-6xl">🎮</span>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-1">{file.fileName}</h2>
          <p className="text-text-muted text-sm mb-6">{file.fileSize}</p>

          {prices.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No plans available yet. Contact admin.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-3">💰 Choose a Plan</h3>
              <div className="grid gap-3">
                {prices.map((price, idx) => {
                  const stock = getStockCount(fileId, price.durationDays);
                  const isSelected = selectedPlan === idx;
                  return (
                    <div
                      key={price.id}
                      onClick={() => setSelectedPlan(idx)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                          : 'border-border bg-surface-lighter hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-border'
                          }`}>
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div>
                            <p className="font-semibold">{price.durationDays} Days</p>
                            <p className="text-text-muted text-xs">
                              {stock > 0 ? `${stock} keys in stock` : 'Out of stock'}
                            </p>
                          </div>
                        </div>
                        <span className="text-accent font-bold text-xl">₹{price.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleBuy}
                disabled={prices.length === 0 || getStockCount(fileId, currentPrice?.durationDays || 0) === 0}
                className="w-full btn-accent mt-6 py-3 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🛒 Buy Now — ₹{currentPrice?.price || 0}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
