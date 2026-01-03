import UploadZone from "../components/UploadZone";

export default function Dashboard() {
  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 rounded-4 p-4">
              <h4 className="fw-bold text-center mb-3">Scan Document</h4>
              <UploadZone />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
