import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useEffect, useState } from "react";
import UploadItem from "../components/UploadItem";
import Loader from "../components/Loader";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "uploads"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="page">
      {loading && <Loader text="Loading gallery..." />}
      <h2>Your Scans</h2>
      {items.map(item => (
        <UploadItem key={item.id} item={item} />
      ))}
    </div>
  );
}
