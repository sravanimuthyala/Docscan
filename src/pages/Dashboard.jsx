import UploadZone from "../components/UploadZone";

export default function Dashboard() {
  return (
    <div className="min-vh-100 py-5 bg-light" style={{ transition: "background-color 0.3s ease" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-sm-10">
            <div className="card shadow-sm border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: "600px" }}>
              <h4 className="fw-bold text-center mb-4"> Scan Document</h4>
              <UploadZone />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
