import cv from "@techstark/opencv-js";

/**
 * ScanDocument
 * HARDENED version: Specifically handles high-contrast backgrounds (rugs) 
 * and shadows using the reference structure.
 */
export function ScanDocument(inputCanvas, outputCanvas) {
  const src = cv.imread(inputCanvas);
  
  // 1. DOWNSCALE: Reference code often fails on high-res images because of 'noise'.
  // Shrinking the image allows us to find the 'big' paper shape more reliably.
  let ratio = src.rows / 500;
  let dsize = new cv.Size(Math.round(src.cols / ratio), 500);
  let resized = new cv.Mat();
  cv.resize(src, resized, dsize, 0, 0, cv.INTER_AREA);

  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const thresh = new cv.Mat();
  const morphed = new cv.Mat();

  // 2. PRE-PROCESS: Use Bilateral instead of Gaussian to keep edges sharp
  cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY);
  cv.bilateralFilter(gray, blurred, 9, 75, 75, cv.BORDER_DEFAULT);

  // 3. ADAPTIVE THRESHOLD: This replaces Canny. 
  // It handles local lighting (the shadows in your image) perfectly.
  cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

  // 4. MORPHOLOGY: Closes gaps in the paper border and mutes the rug pattern.
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
  cv.morphologyEx(thresh, morphed, cv.MORPH_CLOSE, kernel);
  cv.bitwise_not(morphed, morphed); // Paper becomes WHITE object on BLACK background

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(morphed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 5. FIND THE BIGGEST QUADRILATERAL
  let docContour = null;
  let contourList = [];
  for (let i = 0; i < contours.size(); i++) {
    contourList.push(contours.get(i));
  }
  // Sort by area so the paper is checked first
  contourList.sort((a, b) => cv.contourArea(b) - cv.contourArea(a));

  for (let i = 0; i < Math.min(contourList.length, 5); i++) {
    const cnt = contourList[i];
    const area = cv.contourArea(cnt);
    if (area < (resized.cols * resized.rows * 0.10)) continue;

    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.03 * peri, true);

    if (approx.rows === 4) {
      docContour = approx;
      break; 
    } else {
      approx.delete();
    }
  }

  // 6. ROBUST FALLBACK (Your Internship Requirement)
  let isWarning = false;
  if (!docContour && contourList.length > 0) {
    isWarning = true;
    const rect = cv.boundingRect(contourList[0]);
    docContour = cv.matFromArray(4, 1, cv.CV_32SC2, [
      rect.x, rect.y,
      rect.x + rect.width, rect.y,
      rect.x + rect.width, rect.y + rect.height,
      rect.x, rect.y + rect.height
    ]);
  }

  if (!docContour) {
    cv.imshow(outputCanvas, src);
    cleanup();
    return { warning: true };
  }

  // 7. ORDER POINTS & SCALE UP
  // We must multiply coordinates by 'ratio' to warp the ORIGINAL high-res image.
  const data = docContour.data32F?.length ? docContour.data32F : docContour.data32S;
  const pts = [];
  for (let i = 0; i < 4; i++) {
    pts.push({ 
      x: data[i * 2] * ratio, 
      y: data[i * 2 + 1] * ratio 
    });
  }
  const { topLeft, topRight, bottomRight, bottomLeft } = orderPoints(pts);

  // 8. PERSPECTIVE TRANSFORM (A4-ish fixed size for quality)
  const maxWidth = Math.max(distance(topLeft, topRight), distance(bottomLeft, bottomRight));
  const maxHeight = Math.max(distance(topLeft, bottomLeft), distance(topRight, bottomRight));

  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    topLeft.x, topLeft.y, topRight.x, topRight.y,
    bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y,
  ]);
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight,
  ]);

  const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
  const warped = new cv.Mat();
  cv.warpPerspective(src, warped, M, new cv.Size(maxWidth, maxHeight));

  // Output result
  cv.imshow(outputCanvas, warped);

  cleanup();
  if (M) M.delete(); if (warped) warped.delete();
  if (srcPoints) srcPoints.delete(); if (dstPoints) dstPoints.delete();
  return { warning: isWarning };

  function cleanup() {
    src.delete(); resized.delete(); gray.delete(); blurred.delete();
    thresh.delete(); morphed.delete(); contours.delete(); hierarchy.delete();
    kernel.delete(); if (docContour) docContour.delete();
  }
}

// Helpers from your reference
function orderPoints(points) {
  const sorted = [...points].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const diff = [...points].sort((a, b) => (a.y - a.x) - (b.y - b.x));
  return { 
    topLeft: sorted[0], 
    bottomRight: sorted[3], 
    topRight: diff[0], 
    bottomLeft: diff[3] 
  };
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}