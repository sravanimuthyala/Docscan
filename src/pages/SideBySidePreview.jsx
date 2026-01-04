import React, { useCallback, useRef } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";

export default function SideBySidePreview({ original, scanned }) {
  const imgRef = useRef();
  
  const onUpdate = useCallback(({ x, y, scale }) => {
    const value = make3dTransformValue({ x, y, scale });
    if (imgRef.current) {
      imgRef.current.style.setProperty("transform", value);
    }
  }, []);

  return (
    <div className="border rounded overflow-hidden bg-light" style={{ height: "500px" }}>
      <QuickPinchZoom onUpdate={onUpdate}>
        <div ref={imgRef} style={{ width: "100%", height: "100%" }}>
          <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={original} alt="Original" />}
            itemTwo={<ReactCompareSliderImage src={scanned} alt="Scanned" />}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </QuickPinchZoom>
    </div>
  );
}