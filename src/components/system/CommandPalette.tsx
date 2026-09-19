"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import type {
  ProductContext,
  ProductDestination,
} from "@/lib/product-navigation";
export function CommandPalette({
  open,
  onOpenChange,
  destinations,
  context,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: ProductDestination[];
  context: ProductContext;
  returnFocus: React.MutableRefObject<HTMLElement | null>;
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  const matches = destinations.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="x-overlay" />
        <Dialog.Content
          data-foundation={context}
          className="x-palette"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            input.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <div className="x-palette-heading">
            <Dialog.Title>Go to a workspace</Dialog.Title>
            <Dialog.Close
              className="x-icon-button"
              aria-label="Close navigation search"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="x-description">
            Search the destinations available in this context. ⌘ / Ctrl K
          </Dialog.Description>
          <label className="x-search-field">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search destinations</span>
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a destination…"
            />
          </label>
          <nav aria-label="Search results" className="x-palette-results">
            {matches.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
              >
                <span>{item.label}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ))}
            {!matches.length && <p role="status">No matching destinations.</p>}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
