# 📄 DocScan – CamScanner-Style Document Scanner (Full-Stack Intern Task)

DocScan is a full-stack web application that allows users to upload images or PDFs, automatically detects the document inside the image, applies perspective correction (CamScanner-style), and stores both original and processed scans securely per user.

This project  focuses on **frontend computer vision**, **Firebase backend**, and **clean application architecture**.





### Data Flow (End-to-End)

1. User registers or logs in using Firebase Authentication  
2. User uploads an image (PNG/JPEG) or PDF  
3. If PDF → first page is converted to an image using `pdf.js`  
4. Image is drawn onto an HTML `<canvas>`  
5. OpenCV.js reads pixel data from the canvas  
6. Document edges are detected and perspective correction is applied  
7. Scanned output is rendered on a new canvas  
8. Original and scanned images are uploaded to Firebase Storage  
9. Metadata (URLs, filename, userId, timestamp) is saved in Firestore  
10. Gallery fetches scans belonging to the logged-in user  

---

## 🧠 How Auto-Crop Works (Algorithm Steps)

The auto-crop and perspective correction logic is implemented **entirely on the frontend** using **OpenCV.js**.

### Algorithm Pipeline

1. **Grayscale Conversion**
   - Converts image to grayscale
   - Reduces complexity and color noise

2. **Noise Reduction (Bilateral Filter)**
   - Smooths image while preserving edges
   - Works well for textured or dark backgrounds

3. **Canny Edge Detection**
   - Detects strong edges in the image
   - Lower thresholds are used for robustness

4. **Contour Detection**
   - Finds all external contours in the image
   - Contours are filtered based on area

5. **Quadrilateral Approximation**
   - Uses `approxPolyDP` to approximate contours
   - Selects the largest contour with exactly 4 points (document)

6. **Corner Ordering**
   - Points are ordered as:
     - Top-Left
     - Top-Right
     - Bottom-Right
     - Bottom-Left

7. **Perspective Transformation**
   - Computes a transformation matrix
   - Warps the image into a flat rectangle

8. **A4 Aspect Ratio Enforcement**
   - Output is resized to match A4 proportions
   - Ensures rectangular









