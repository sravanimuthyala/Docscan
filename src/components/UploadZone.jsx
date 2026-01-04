import { useState, useEffect, useRef } from "react";
import cv from "@techstark/opencv-js";
import { PdfToImage } from "../utils/PdfToImage";
import { ScanDocument } from "../utils/ScanDocument";
import BeforeAfter from "./BeforeAfter";
import Loader from "./Loader";
import { useAuth } from "../auth/AuthProvider";

import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/* ----------------------------------
   Helper: Canvas → Blob
---------------------------------- */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas to Blob conversion failed"));
    }, "image/jpeg", 0.95);
  });
}

export default function UploadZone() {
  const { user, loading: authLoading } = useAuth();

  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); 
  const [warning, setWarning] = useState(false); // ✅ Tracks detection failure
  const [cvReady, setCvReady] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const originalCanvasRef = useRef(null);
  const scannedCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (cv && cv.Mat) {
      setCvReady(true);
    } else if (cv) {
      cv.onRuntimeInitialized = () => setCvReady(true);
    }
  }, []);

  async function processFile(file) {
    if (!file || !user) return;

    setLoading(true);
    setError(null);
    setWarning(false);
    setUploadSuccess(false);
    setBefore(null);
    setAfter(null);
    setFileName(file.name);

    try {
      let sourceCanvas;

      if (file.type === "application/pdf") {
        sourceCanvas = await PdfToImage(file);
      } else {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        await img.decode();

        sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        sourceCanvas.getContext("2d").drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      }

      const originalCanvas = originalCanvasRef.current;
      originalCanvas.width = sourceCanvas.width;
      originalCanvas.height = sourceCanvas.height;
      originalCanvas.getContext("2d").drawImage(sourceCanvas, 0, 0);

      setBefore(originalCanvas.toDataURL("image/jpeg", 0.85));

      // Process with OpenCV
      setTimeout(() => {
        try {
          // ScanDocument should return { warning: boolean }
          const result = ScanDocument(
            originalCanvas,
            scannedCanvasRef.current
          );

          if (result.warning) {
            // ✅ FAIL-SAFE: If detection failed, use original image as "after"
            setAfter(originalCanvas.toDataURL("image/jpeg", 0.85));
            setWarning(true);
          } else {
            setAfter(scannedCanvasRef.current.toDataURL("image/jpeg", 0.9));
            setWarning(false);
          }
        } catch (err) {
          // ✅ HARD FALLBACK: If code crashes, show original and warn
          setAfter(originalCanvas.toDataURL("image/jpeg", 0.85));
          setWarning(true);
        } finally {
          setLoading(false);
        }
      }, 100);
    } catch (err) {
      setError("Failed to process file.");
      setLoading(false);
    }
  }

  async function handleGalleryUpload() {
    if (!user || !before || !after) return;
    setSaving(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      const originalBlob = await canvasToBlob(originalCanvasRef.current);
      
      // Use the scanned canvas if no warning, otherwise use original canvas for "after"
      const afterCanvas = warning ? originalCanvasRef.current : scannedCanvasRef.current;
      const scannedBlob = await canvasToBlob(afterCanvas);

      const originalPath = `scans/${user.uid}/${timestamp}_original_${baseName}.jpg`;
      const scannedPath = `scans/${user.uid}/${timestamp}_scanned_${baseName}.jpg`;

      const originalRef = ref(storage, originalPath);
      const scannedRef = ref(storage, scannedPath);

      await uploadBytes(originalRef, originalBlob);
      await uploadBytes(scannedRef, scannedBlob);

      const originalURL = await getDownloadURL(originalRef);
      const scannedURL = await getDownloadURL(scannedRef);

      await addDoc(collection(db, "scans"), {
        userId: user.uid,
        fileName,
        originalUrl: originalURL,
        scannedUrl: scannedURL,
        originalPath,
        scannedPath,
        isAutoProcessed: !warning, // ✅ Log if it was auto-cropped or not
        createdAt: serverTimestamp()
      });

      setUploadSuccess(true);
    } catch (err) {
      setError("Upload failed. Retry?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card shadow-sm p-4 border-0 rounded-3 bg-white">
      {(loading || saving) && <Loader text={saving ? "Uploading..." : "Scanning..."} />}

      {/* Fail-Safe Warning Display */}
      {warning && (
        <div className="alert alert-warning d-flex align-items-center mb-3 py-2 border-0 small" role="alert">
          <span className="me-2">⚠️</span>
          <div>
            <strong>Detection Uncertain:</strong> We couldn't find document edges. Showing original image instead.
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show small" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div
        className={`mb-4 p-5 rounded-3 text-center border-2 ${dragActive ? "border-dark bg-light" : "border-secondary-subtle"}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); processFile(e.dataTransfer.files[0]); }}
        onClick={() => !saving && fileInputRef.current.click()}
        style={{ cursor: "pointer", borderStyle: "dashed" }}
      >
        <h5 className="fw-bold mb-1">Upload Document</h5>
        <input type="file" ref={fileInputRef} className="d-none" accept="image/*,application/pdf" onChange={(e) => processFile(e.target.files[0])} disabled={loading || saving} />
      </div>

      <canvas ref={originalCanvasRef} style={{ display: "none" }} />
      <canvas ref={scannedCanvasRef} style={{ display: "none" }} />

      {before && after && (
        <>
          <button
            className={`btn w-100 mb-4 ${uploadSuccess ? "btn-success" : error ? "btn-warning" : "btn-dark"}`}
            onClick={handleGalleryUpload}
            disabled={saving || uploadSuccess}
          >
            {saving ? "Saving..." : uploadSuccess ? "Saved ✓" : error ? "Retry Upload" : "Save to Gallery"}
          </button>
          <BeforeAfter before={before} after={after} />
        </>
      )}
    </div>
  );
}