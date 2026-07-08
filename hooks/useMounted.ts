"use client";

import { useEffect, useState } from "react";

// Custom hook that returns true only after the component has mounted
// on the client. Used to prevent hydration mismatches for
// theme-dependent UI that differs between server and client.
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
