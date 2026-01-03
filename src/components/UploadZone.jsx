import { useState, useEffect, useRef } from "react";
import cv from "@techstark/opencv-js";
import { PdfToImage } from "../utils/PdfToImage";
import { ScanDocument } from "../utils/ScanDocument";
import BeforeAfter from "./BeforeAfter";
import Loader from "./Loader";

export default function UploadZone() {
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(false);
  const [cvReady, setCvReady] = useState(false);

  // ✅ REQUIRED CANVAS REFS
  const originalCanvasRef = useRef(null);
  const scannedCanvasRef = useRef(null);

  useEffect(() => {
    if (cv && cv.Mat) {
      console.log("✅ OpenCV.js ready (techstark)");
      setCvReady(true);
    }
  }, []);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setWarning(false);

    try {
      let canvas;

      // 1️⃣ PDF → Canvas
      if (file.type === "application/pdf") {
        canvas = await PdfToImage(file);
      } 
      // 2️⃣ Image → Canvas
      else {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();

        canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
      }

      // 3️⃣ Draw into ORIGINAL canvas
      const originalCanvas = originalCanvasRef.current;
      originalCanvas.width = canvas.width;
      originalCanvas.height = canvas.height;
      originalCanvas.getContext("2d").drawImage(canvas, 0, 0);

      setBefore(originalCanvas.toDataURL());

      // 4️⃣ Scan
      const result = ScanDocument(
        originalCanvasRef.current,
        scannedCanvasRef.current
      );

      setAfter(scannedCanvasRef.current.toDataURL());
      setWarning(result.warning);

    } catch (err) {
      console.error(err);
      alert("Failed to process file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <Loader text="Scanning document..." />}

      <div className="mb-3 text-start">
        <label className="form-label fw-semibold mb-3">
          Upload Image or PDF
        </label>
        <input
          type="file"
          className="form-control"
          accept="image/*,application/pdf"
          onChange={handleFile}
          disabled={!cvReady}
        />
      </div>

      {!cvReady && (
        <div className="alert alert-info">
          Initializing OpenCV.js… please wait
        </div>
      )}

      {warning && (
        <div className="alert alert-warning">
          Could not confidently detect document edges. Showing best guess.
        </div>
      )}

      {/* ✅ HIDDEN CANVASES (REQUIRED FOR OPENCV) */}
      <canvas ref={originalCanvasRef} className="d-none" />
      <canvas ref={scannedCanvasRef} className="d-none" />

      <BeforeAfter before={before} after={after} />
    </>
  );
}
