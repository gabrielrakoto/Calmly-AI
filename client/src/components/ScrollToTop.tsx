import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // ⏳ Laisse le browser mobile finir ses animations internes
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }, 10); // 10ms fix iOS + Chrome mobile
  }, [location]);

  return null;
}
