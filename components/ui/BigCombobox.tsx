// BigCombobox — searchable member picker for selecting a big.
// Falls back to free text for bigs not yet in the system. Used by ProfileForm on /profile.
"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Member } from "@/types/member";

interface BigComboboxProps {
  members: Member[];
  value: string;
  bigUid: string | null;
  onChange: (name: string, uid: string | null) => void;
  placeholder?: string;
}

export function BigCombobox({
  members,
  value,
  bigUid,
  onChange,
  placeholder,
}: BigComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = inputValue.trim()
    ? members.filter((m) =>
        `${m.firstName} ${m.lastName}`
          .toLowerCase()
          .includes(inputValue.toLowerCase().trim())
      )
    : members.slice(0, 8);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    setOpen(true);
    onChange(v, null);
  }

  function handleSelect(member: Member) {
    const name = `${member.firstName} ${member.lastName}`;
    setInputValue(name);
    onChange(name, member.uid);
    setOpen(false);
  }

  // Close dropdown when focus leaves the container entirely
  function handleBlur(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        autoComplete="off"
        className={bigUid ? "pr-16" : undefined}
      />
      {bigUid && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-600 pointer-events-none">
          <Check className="h-3 w-3" />
          Linked
        </span>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-md border bg-background shadow-md">
          {filtered.map((member) => (
            <li key={member.uid}>
              <button
                type="button"
                // Prevent the input blur from firing before the click registers
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(member)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
              >
                <span>
                  {member.firstName} {member.lastName}
                </span>
                {bigUid === member.uid && (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
