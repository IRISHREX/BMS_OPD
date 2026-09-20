import { useEffect, useState } from "react";
import api from "../utils/api";

export default function useAdviceSuggestions() {
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAdvices = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/v1/advice");
        const adviceList = data.advices || [];
        if (isMounted) {
          setAdvices(
            adviceList.map((a) => ({
              id: a._id,
              name: (a.name || "").trim(),
              label: (a.name || "").trim(),
              advice: (a.advice || "").trim(),
              composition: (a.advice || "").trim() // to show in AutoSuggestInput
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch advice suggestions", err);
        if (isMounted) setAdvices([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdvices();
    return () => {
      isMounted = false;
    };
  }, []);

  return { advices, loading };
}
