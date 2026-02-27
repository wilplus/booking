import * as React from "react";

type Props = {
  className?: string;
  showText?: boolean;
  text?: string;
};

export function Logo({ className = "", showText = true, text = "Book a Lesson" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-xl text-white"
        aria-hidden
      >
        🗓️
      </span>
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {text}
        </span>
      )}
    </div>
  );
}
