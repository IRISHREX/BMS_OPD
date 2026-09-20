import { useEffect, useState } from "react";
import api from "../utils/api";

export default function useDiagnosticTestSuggestions() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/v1/test");
        const testList = data.tests || [];
        if (isMounted) {
          setTests(
            testList.map((t) => ({
              id: t._id,
              name: (t.name || "").trim(),
              label: (t.name || "").trim(),
              category: t.category || t.type || "General",
              composition: t.category || t.type || "General", // display category in AutoSuggestInput subtitle
              testType: t.category || t.type || "General",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch diagnostic test suggestions", err);
        if (isMounted) setTests([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTests();
    return () => {
      isMounted = false;
    };
  }, []);

  return { tests, loading };
}
