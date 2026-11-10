
import React from "react";
import { ChevronDown } from "lucide-react";

export default function FilterButton({
  children,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      className={`filter-button ${className}`}
      onClick={onClick}
    >
      <span>{children}</span>

      <ChevronDown size={16} />
    </button>
  );
}
