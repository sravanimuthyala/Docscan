export default function BeforeAfter({ before, after }) {
  if (!before || !after) return null;

  return (
    <div className="mt-4">
      <div className="row justify-content-center g-4">
        
        <div className="col-md-6 text-center">
          <p className="fw-semibold mb-2">Original</p>
          <img
            src={before}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: "500px" }}
            alt="Original"
          />
        </div>

        <div className="col-md-6 text-center">
          <p className="fw-semibold mb-2">Scanned</p>
          <img
            src={after}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: "500px" }}
            alt="Scanned"
          />
        </div>

      </div>
    </div>
  );
}
