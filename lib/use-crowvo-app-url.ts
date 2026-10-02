"use client";

import { useEffect, useState } from "react";
import { getCrowvoAppUrl } from "@/lib/app-url";

export function useCrowvoAppUrl() {
  const [appUrl, setAppUrl] = useState(() => getCrowvoAppUrl());

  useEffect(() => {
    setAppUrl(getCrowvoAppUrl(window.location.hostname));
  }, []);

  return appUrl;
}
