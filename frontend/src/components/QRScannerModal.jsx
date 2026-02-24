import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { registrationAPI } from '../services/api';
import '../styles/EventDetails.css';

const QRScannerModal = ({ eventId, isOpen, onClose, onScanSuccess }) => {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    useEffect(() => {
        if (!isOpen) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            setScanResult(null);
            setError('');
            setSuccessMsg('');
            return;
        }

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                supportedScanTypes: [
                    Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                    Html5QrcodeScanType.SCAN_TYPE_FILE
                ]
            },
            false
        );
        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                if (isProcessingRef.current) return;
                handleQRCodeScanned(decodedText);
            },
            () => { }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [isOpen]);

    const handleQRCodeScanned = async (ticketId) => {
        if (isProcessingRef.current) return;

        setIsProcessing(true);
        setError('');
        setSuccessMsg('');
        setScanResult(ticketId);

        try {
            const { ok, data } = await registrationAPI.scanQR(eventId, { ticketId });

            if (ok) {
                setSuccessMsg(`Success! Scanned ticket: ${ticketId}`);
                if (onScanSuccess) onScanSuccess(data.registration);

                setTimeout(() => {
                    setSuccessMsg('');
                    setScanResult(null);
                }, 3000);
            } else {
                setError(data.message || 'Invalid Ticket');
                setTimeout(() => {
                    setError('');
                    setScanResult(null);
                }, 4000);
            }
        } catch  {
            setError('Network error connecting to server');
            setTimeout(() => setError(''), 4000);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'var(--bg)', padding: '24px', borderRadius: 'var(--radius-lg)',
                width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Scan Participant QR</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-light)' }}>×</button>
                </div>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '16px', borderLeft: '4px solid #dc3545' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '16px', borderLeft: '4px solid #28a745' }}>
                        {successMsg}
                    </div>
                )}

                {isProcessing && !error && !successMsg && (
                    <div style={{ padding: '12px', backgroundColor: '#e2e3e5', color: '#383d41', borderRadius: '4px', marginBottom: '16px', textAlign: 'center' }}>
                        Processing Ticket: <strong>{scanResult}</strong>...
                    </div>
                )}

                <div id="qr-reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-light)' }}>
                    Position the QR code within the frame above to scan.
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
