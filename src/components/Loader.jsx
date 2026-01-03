export default function Loader({ text = "Processing..." }) {
  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    </div>
  );
}
