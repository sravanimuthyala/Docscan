import { useState } from "react";

export default function UploadItem({ item }) {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="gallery-item">
      <h4>{item.filename}</h4>
      <div className="preview">
        <img src={item.originalUrl} width="250" />

        <div className="zoom-box">
          <img
            src={item.processedUrl}
            style={{ transform: `scale(${zoom})`, transition: "0.15s" }}
            onWheel={e =>
              setZoom(z => Math.max(1, z + (e.deltaY < 0 ? 0.1 : -0.1)))
            }
          />
        </div>
      </div>
    </div>
  );
}
