import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Footer } from "@/app/components/Footer";
import {
  CatalogHistoryContext,
  type CatalogResult,
} from "@/ecommerce/hooks/catalogHistory";

import { NavigationScroll } from "./NavigationScroll";

const RootLayout = () => {
  const [catalogHistory] = useState(() => new Map<string, CatalogResult>());
  return (
    <CatalogHistoryContext.Provider value={catalogHistory}>
      <NavigationScroll />
      <div className="bg-background text-foreground flex min-h-svh w-full flex-col">
        <div
          data-route-content
          tabIndex={-1}
          className="grid min-w-0 flex-1 outline-none"
        >
          <Outlet />
        </div>
        <Footer />
      </div>
    </CatalogHistoryContext.Provider>
  );
};

export default RootLayout;
