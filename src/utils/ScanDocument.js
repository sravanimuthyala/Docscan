import cv from "@techstark/opencv-js";

/**
 * ScanDocument
 * Perspective-corrects document to A4 ratio. 
 * Includes null-safe cleanup to prevent ReferenceErrors.
 */
export function ScanDocument(inputCanvas, outputCanvas) {
  // 1. Declare all variables as null so they exist in scope for cleanup
  let src = null, original = null, gray = null, blurred = null, thresh = null;
  let edges = null, contours = null, hierarchy = null, kernel = null;
  let page = null, srcTri = null, dstTri = null, M = null, warped = null;

  try {
    src = cv.imread(inputCanvas);
    original = src.clone();
    gray = new cv.Mat();
    blurred = new cv.Mat();
    thresh = new cv.Mat();

    // Preprocessing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

    // Edge Detection
    edges = new cv.Mat();
    kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
    cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, kernel);
    cv.Canny(thresh, edges, 75, 200);

    // Find Contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    const imageArea = src.rows * src.cols;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < imageArea * 0.15) continue; // Ignore noise

      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > maxArea) {
        if (page) page.delete(); // Delete previous best
        page = approx;
        maxArea = area;
      } else {
        approx.delete();
      }
    }

    // 2. FAIL-SAFE: If no 4-point polygon found, show original and exit
    if (!page) {
      cv.imshow(outputCanvas, original);
      return { warning: true };
    }

    // 3. Transformation Logic
    const pts = [];
    const data = page.data32S || page.data32F;
    for (let i = 0; i < 4; i++) {
      pts.push({ x: data[i * 2], y: data[i * 2 + 1] });
    }

    const [tl, tr, br, bl] = orderCorners(pts);
    const width = Math.max(distance(br, bl), distance(tr, tl));
    const height = width * 1.414; // Standard A4 ratio

    srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
    dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height]);
    
    M = cv.getPerspectiveTransform(srcTri, dstTri);
    warped = new cv.Mat();
    cv.warpPerspective(original, warped, M, new cv.Size(width, height));

    cv.imshow(outputCanvas, warped);
    return { warning: false };

  } catch (err) {
    console.error("OpenCV Logic Error:", err);
    return { warning: true };
  } finally {
    // 4. NULL-SAFE CLEANUP: Check if initialized before deleting
    if (src) src.delete();
    if (original) original.delete();
    if (gray) gray.delete();
    if (blurred) blurred.delete();
    if (thresh) thresh.delete();
    if (edges) edges.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
    if (kernel) kernel.delete();
    if (page) page.delete();
    if (srcTri) srcTri.delete();
    if (dstTri) dstTri.delete();
    if (M) M.delete();
    if (warped) warped.delete();
  }
}

// Helpers for coordinate sorting
function orderCorners(pts) {
  const rect = new Array(4);
  const sum = pts.map(p => p.x + p.y);
  const diff = pts.map(p => p.x - p.y);
  rect[0] = pts[sum.indexOf(Math.min(...sum))]; // Top-Left
  rect[2] = pts[sum.indexOf(Math.max(...sum))]; // Bottom-Right
  rect[1] = pts[diff.indexOf(Math.min(...diff))]; // Top-Right
  rect[3] = pts[diff.indexOf(Math.max(...diff))]; // Bottom-Left
  return rect;
}

function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}