import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { NuqsAdapter } from "nuqs/adapters/react";

hydrateRoot(
  document,
  <StrictMode>
    <NuqsAdapter>
      <StartClient />
    </NuqsAdapter>
  </StrictMode>
);
