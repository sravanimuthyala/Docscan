import cv from "@techstark/opencv-js";

export function ScanDocument(inputCanvas, outputCanvas) {
  let src = null, gray = null, blurred = null, edges = null, thresh = null;
  let contours = null, hierarchy = null, bestContour = null;
  let srcMat = null, dstMat = null, M = null, warped = null;

  try {
    src = cv.imread(inputCanvas);
    gray = new cv.Mat();
    blurred = new cv.Mat();
    edges = new cv.Mat();
    thresh = new cv.Mat();

    // 1. UNIVERSAL PRE-PROCESSING
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0);

    // 2. MULTI-STRATEGY CONTOUR DETECTION
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();

    // Strategy A: Canny (Best for the Marble/High Contrast pics)
    cv.Canny(blurred, edges, 75, 200);
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    cv.dilate(edges, edges, kernel);
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    bestContour = findBestRect(contours, src.rows * src.cols);

    // Strategy B: Fallback to Thresholding (Best for the Patterned Cloth pics)
    if (!bestContour) {
      cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
      cv.dilate(thresh, thresh, kernel);
      cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      bestContour = findBestRect(contours, src.rows * src.cols);
    }

    // 3. IF NO RECTANGLE FOUND, SHOW ORIGINAL
    if (!bestContour) {
      cv.imshow(outputCanvas, src);
      return { warning: true };
    }

    // 4. PREPARE POINTS & WARP
    const pts = [];
    for (let i = 0; i < 4; i++) {
      pts.push({ x: bestContour.data32S[i * 2], y: bestContour.data32S[i * 2 + 1] });
    }
    const [tl, tr, br, bl] = orderPoints(pts);

    const width = Math.max(distance(tl, tr), distance(bl, br));
    const height = Math.max(distance(tl, bl), distance(tr, br));

    srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
    dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height]);

    M = cv.getPerspectiveTransform(srcMat, dstMat);
    warped = new cv.Mat();
    cv.warpPerspective(src, warped, M, new cv.Size(width, height));

    cv.imshow(outputCanvas, warped);
    return { warning: false };

  } catch (err) {
    console.error("OpenCV Scan Error:", err);
    return { warning: true };
  } finally {
    // Comprehensive Cleanup
    if (src) src.delete(); if (gray) gray.delete();
    if (blurred) blurred.delete(); if (edges) edges.delete();
    if (thresh) thresh.delete(); if (contours) contours.delete();
    if (hierarchy) hierarchy.delete(); if (bestContour) bestContour.delete();
    if (srcMat) srcMat.delete(); if (dstMat) dstMat.delete();
    if (M) M.delete(); if (warped) warped.delete();
  }
}

// Helper to find the best 4-point contour in a MatVector
function findBestRect(contours, imageArea) {
  let maxArea = 0;
  let best = null;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);

    if (area < imageArea * 0.15) continue;

    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

    if (approx.rows === 4 && area > maxArea) {
      if (best) best.delete();
      best = approx;
      maxArea = area;
    } else {
      approx.delete();
    }
  }
  return best;
}

function orderPoints(pts) {
  const rect = new Array(4);
  const sum = pts.map(p => p.x + p.y);
  rect[0] = pts[sum.indexOf(Math.min(...sum))]; // TL
  rect[2] = pts[sum.indexOf(Math.max(...sum))]; // BR

  const diff = pts.map(p => p.y - p.x);
  rect[1] = pts[diff.indexOf(Math.min(...diff))]; // TR
  rect[3] = pts[diff.indexOf(Math.max(...diff))]; // BL
  return rect;
}

function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}