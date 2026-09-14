// hooks/useDynamicCss.ts
import { useEffect, useState } from "react";

const useDynamicCss = (href: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    
    // Create link element
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;

    link.onload = () => {
      setIsLoaded(true);
    };
    link.onerror = () => {
      setIsLoaded(true); // fallback so we don't get stuck if stylesheet fails to load
    };

    document.head.appendChild(link);

    // Cleanup when component unmounts
    return () => {
      document.head.removeChild(link);
    };
  }, [href]);

  return isLoaded;
};

export default useDynamicCss;