import type { SVGProps } from "react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

type Option = {
  value: ThemeMode;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.742 13.045a8.088 8.088 0 0 1-2.077.271c-2.135 0-4.14-.83-5.646-2.336a8.025 8.025 0 0 1-2.064-7.723A1 1 0 0 0 9.73 2.034a10.014 10.014 0 0 0-4.489 2.582c-3.898 3.899-3.898 10.243 0 14.143a9.937 9.937 0 0 0 7.072 2.93 9.93 9.93 0 0 0 7.07-2.929 10.007 10.007 0 0 0 2.583-4.491 1.001 1.001 0 0 0-1.224-1.224z" />
    </svg>
  );
}

const OPTIONS: Option[] = [
  { value: "light", label: "Chiaro", Icon: SunIcon },
  { value: "dark", label: "Scuro", Icon: MoonIcon },
];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={[
        "inline-flex items-center gap-0.5 rounded-full bg-surface-3/80 p-0.5 backdrop-blur",
        "ring-1 ring-inset ring-hairline",
        className,
      ].join(" ")}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setMode(value)}
            className={[
              "relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              selected
                ? "bg-surface text-primary shadow-sm"
                : "text-muted hover:text-primary",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
