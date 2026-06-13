"use client";

import { useEffect } from "react";
import { migrateStoredFootballData } from "@/lib/storage";

export default function LocalStorageMigration() {
  useEffect(() => {
    migrateStoredFootballData();
  }, []);

  return null;
}
