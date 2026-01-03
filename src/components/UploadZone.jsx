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

  const originalCanvasRef = useRef(null);
  const scannedCanvasRef = useRef(null);

  useEffect(() => {
    if (cv && cv.Mat) setCvReady(true);
  }, []);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setWarning(false);

    try {
      let sourceCanvas;

      // 1. Convert Input (PDF/Image) to Canvas
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

      // 2. Prepare Original Canvas for OpenCV
      const originalCanvas = originalCanvasRef.current;
      originalCanvas.width = sourceCanvas.width;
      originalCanvas.height = sourceCanvas.height;
      originalCanvas.getContext("2d").drawImage(sourceCanvas, 0, 0);

      // Set the "Before" preview image
      setBefore(originalCanvas.toDataURL("image/jpeg", 0.8));

      // 3. Run the Scanner Logic
      const result = ScanDocument(originalCanvas, scannedCanvasRef.current);
      
      // Set the "After" preview image and any warnings
      setAfter(scannedCanvasRef.current.toDataURL("image/jpeg", 0.8));
      setWarning(result.warning);

    } catch (err) {
      console.error("Upload Error:", err);
      alert("Failed to process file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm p-4">
      {loading && <Loader text="Analyzing document..." />}
      
      <div className="mb-4">
        <label className="form-label fw-bold">Upload Document (PDF or Image)</label>
        <input 
          type="file" 
          className="form-control" 
          onChange={handleFile} 
          disabled={!cvReady || loading} 
        />
        {!cvReady && <div className="text-muted small mt-2 italic">Waiting for Computer Vision engine...</div>}
      </div>

      {warning && (
        <div className="alert alert-warning py-2 mb-4">
          <strong>Notice:</strong> Edge detection failed. Displaying original image.
        </div>
      )}

      {/* Hidden processing canvases */}
      <canvas ref={originalCanvasRef} style={{ display: "none" }} />
      <canvas ref={scannedCanvasRef} style={{ display: "none" }} />

      {before && after && (
        <div className="mt-2">
          <BeforeAfter before={before} after={after} />
        </div>
      )}
    </div>
  );
}