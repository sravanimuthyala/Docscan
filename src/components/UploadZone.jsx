import { useState, useEffect, useRef } from "react";
import cv from "@techstark/opencv-js";
import { PdfToImage } from "../utils/PdfToImage";
import { ScanDocument } from "../utils/ScanDocument";
import BeforeAfter from "./BeforeAfter";
import Loader from "./Loader";
import { useAuth } from "../auth/AuthProvider";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export default function UploadZone() {
  const { user, loading: authLoading } = useAuth();
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState(false);
  const [cvReady, setCvReady] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const originalCanvasRef = useRef(null);
  const scannedCanvasRef = useRef(null);
  const fileInputRef = useRef(null); // Ref to trigger hidden input

  useEffect(() => {
    if (cv && cv.Mat) {
      setCvReady(true);
    } else if (cv) {
      cv.onRuntimeInitialized = () => setCvReady(true);
    }
  }, []);

  async function processFile(file) {
    if (!file) return;
    if (!user) {
      alert("Please login to upload.");
      return;
    }

    setLoading(true);
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

      const beforeData = originalCanvas.toDataURL("image/jpeg", 0.85);
      setBefore(beforeData);

      setTimeout(async () => {
        try {
          const result = ScanDocument(originalCanvas, scannedCanvasRef.current);
          const afterData = scannedCanvasRef.current.toDataURL("image/jpeg", 0.9);
          setAfter(afterData);
          setWarning(result.warning);
        } catch {
          setAfter(beforeData);
          setWarning(true);
        } finally {
          setLoading(false);
        }
      }, 100);
    } catch {
      setLoading(false);
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    processFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  async function handleGalleryUpload() {
    if (!user || !after || !before) return;
    setSaving(true);
    try {
      const timestamp = Date.now();
      const baseName = fileName.replace(/\.[^/.]+$/, "");

      const originalPath = `scans/${user.uid}/${timestamp}_original_${baseName}.jpg`;
      const scannedPath = `scans/${user.uid}/${timestamp}_scanned_${baseName}.jpg`;

      const originalRef = ref(storage, originalPath);
      await uploadString(originalRef, before, "data_url");
      const originalURL = await getDownloadURL(originalRef);

      const scannedRef = ref(storage, scannedPath);
      await uploadString(scannedRef, after, "data_url");
      const scannedURL = await getDownloadURL(scannedRef);

      await addDoc(collection(db, "scans"), {
        userId: user.uid,
        fileName,
        originalUrl: originalURL,
        scannedUrl: scannedURL,
        originalPath,
        scannedPath,
        createdAt: serverTimestamp()
      });

      setUploadSuccess(true);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <Loader text="Checking authentication..." />;

  return (
    <div className="card shadow-sm p-4 border-0 rounded-3 bg-white">
      {(loading || saving) && (
        <div className="d-flex flex-column align-items-center justify-content-center py-4">
          <div className="spinner-border text-dark mb-3"></div>
          <p className="fw-semibold text-muted">
            {saving ? "Saving both versions..." : "Scanning..."}
          </p>
        </div>
      )}

      {/* Improved Drag-and-drop zone (single interactive container) */}
      <div
        className={`mb-4 p-5 rounded-3 text-center border-2 ${
          dragActive ? "border-dark bg-light" : "border-secondary-subtle"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()} // Trigger the hidden input
        style={{ 
          transition: "all 0.2s ease", 
          cursor: "pointer", 
          borderStyle: "dashed" 
        }}
      >
        <div className="d-flex flex-column align-items-center justify-content-center py-2">
          <i className={`bi bi-cloud-arrow-up fs-1 mb-3 ${dragActive ? "text-dark" : "text-muted"}`}></i>
          <h5 className="fw-bold mb-1">Upload Document</h5>
          <p className="text-muted small">Drag & drop a file here, or click to choose manually</p>

          {/* Hidden standard input */}
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept="image/*,application/pdf"
            onChange={handleFile}
            disabled={!cvReady || loading || saving}
          />

          {fileName && !loading && (
            <div className="mt-3 badge bg-light text-dark border p-2 fw-normal">
              <i className="bi bi-file-earmark-check me-1"></i>
              {fileName}
            </div>
          )}
        </div>
      </div>

      <canvas ref={originalCanvasRef} style={{ display: "none" }} />
      <canvas ref={scannedCanvasRef} style={{ display: "none" }} />

      {before && after && (
        <div className="mt-3">
          <button
            className={`btn ${uploadSuccess ? "btn-success" : "btn-dark"} w-100 mb-4`}
            onClick={handleGalleryUpload}
            disabled={saving || uploadSuccess}
          >
            {uploadSuccess ? "Files Saved ✓" : "Save Original + Processed"}
          </button>
          <BeforeAfter before={before} after={after} />
        </div>
      )}
    </div>
  );
}