import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  deleteDoc
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../auth/AuthProvider";

export default function Gallery() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  
  // State for Comparison Mode
  const [inspectingScan, setInspectingScan] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function fetchScans() {
      try {
        const q = query(
          collection(db, "scans"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setScans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchScans();
  }, [user]);

  async function handleDelete(scanId, scannedPath, originalPath) {
    if (!window.confirm("Permanently delete this scan?")) return;
    setDeletingId(scanId);
    try {
      if (scannedPath) await deleteObject(ref(storage, scannedPath)).catch(() => {});
      if (originalPath) await deleteObject(ref(storage, originalPath)).catch(() => {});
      await deleteDoc(doc(db, "scans", scanId));
      setScans(prev => prev.filter(s => s.id !== scanId));
      if (inspectingScan?.id === scanId) setInspectingScan(null);
    } catch (err) {
      alert("Deletion failed.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) return <div className="text-center mt-5">Please log in.</div>;
  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border text-dark"></div>
      <p className="mt-2 text-muted">Fetching your documents...</p>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">{inspectingScan ? "Side-by-Side View" : "My Gallery"}</h2>
        {inspectingScan && (
          <button className="btn btn-sm btn-dark px-3 shadow-sm" onClick={() => setInspectingScan(null)}>
            <i className="bi bi-arrow-left me-2"></i>Back to Gallery
          </button>
        )}
      </div>

      {inspectingScan ? (
        /* --- SIDE-BY-SIDE COMPARISON MODE (NO ZOOM) --- */
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 p-3 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small fw-semibold">{inspectingScan.fileName}</span>
                <div className="d-flex gap-4 small fw-bold text-uppercase">
                  <span className="text-primary">Original</span>
                  <span className="text-success">Scanned</span>
                </div>
              </div>

              {/* Static Side-by-Side Container */}
              <div 
                className="rounded-3 bg-light border d-flex overflow-hidden" 
                style={{ height: "65vh" }}
              >
                {/* Left: Original */}
                <div className="w-50 h-100 border-end bg-white">
                  <img 
                    src={inspectingScan.originalUrl} 
                    alt="Original" 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                  />
                </div>
                {/* Right: Scanned */}
                <div className="w-50 h-100 bg-white">
                  <img 
                    src={inspectingScan.scannedUrl} 
                    alt="Scanned" 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                  />
                </div>
              </div>

              <div className="mt-3 text-end">
                <button 
                  className="btn btn-sm btn-outline-danger" 
                  onClick={() => handleDelete(inspectingScan.id, inspectingScan.scannedPath, inspectingScan.originalPath)}
                >
                  Delete Document
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- STANDARD GALLERY GRID --- */
        <div className="row">
          {scans.length === 0 ? (
            <div className="col-12 text-center text-muted py-5">
              <i className="bi bi-camera fs-1 mb-2"></i>
              <h5>No scans yet!</h5>
            </div>
          ) : (
            scans.map(scan => (
              <div className="col-md-4 mb-4" key={scan.id}>
                <div className="card h-100 shadow-sm border-0 gallery-card">
                  <div 
                    className="img-preview-box bg-light" 
                    style={{ height: "220px", cursor: "pointer" }}
                    onClick={() => setInspectingScan(scan)}
                  >
                    <img src={scan.scannedUrl} className="w-100 h-100" style={{ objectFit: "contain" }} alt="Document preview" />
                  </div>
                  <div className="card-body">
                    <h6 className="text-truncate fw-bold mb-3">{scan.fileName}</h6>
                    <div className="d-flex gap-2">
                      <button className="btn btn-dark btn-sm flex-grow-1" onClick={() => setInspectingScan(scan)}>
                        Compare
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        disabled={deletingId === scan.id}
                        onClick={() => handleDelete(scan.id, scan.scannedPath || scan.storagePath, scan.originalPath)}
                      >
                        {deletingId === scan.id ? "..." : <i className="bi bi-trash"></i>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}