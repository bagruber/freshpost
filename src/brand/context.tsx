import { createContext, useContext, useLayoutEffect, type ReactNode } from "react";
import type { Brand } from "./contract";

// Die aktive Marke liegt im Context, damit Komponenten sie lesen koennen, ohne
// dass der Kern sie importiert. Reine Funktionen (boxes, layout, snap) bekommen
// sie als Argument — sie laufen auch ausserhalb von React, etwa in Tests.
//
// Zusaetzlich schreibt der Provider die Tokens der Marke als CSS Custom
// Properties auf :root. Damit ist der Stylesheet-Weg dieselbe Quelle wie der
// TypeScript-Weg; ein handgepflegtes tokens.css gibt es nicht mehr.

const BrandContext = createContext<Brand | null>(null);

// Tokens sofort setzen — main.tsx ruft das VOR createRoot auf, damit der
// Grundton schon beim ersten Paint steht und nicht erst nach dem Mount.
export function applyBrandTokens(brand: Brand): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(brand.tokens)) {
    root.style.setProperty(`--${name}`, value);
  }
  root.dataset.brand = brand.id;
}

export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  useLayoutEffect(() => {
    applyBrandTokens(brand);
    return () => {
      const root = document.documentElement;
      for (const name of Object.keys(brand.tokens)) root.style.removeProperty(`--${name}`);
      delete root.dataset.brand;
    };
  }, [brand]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  const b = useContext(BrandContext);
  if (!b) throw new Error("useBrand ausserhalb von BrandProvider");
  return b;
}
