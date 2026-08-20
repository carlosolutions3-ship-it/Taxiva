/**
 * A minimal, hand-rolled icon set — no icon library dependency. Every icon
 * is a simple 24x24 stroked path so the whole set reads as one system.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 10.5 12 4l8.5 6.5" />
    <path d="M5.5 9.5V19a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 4 0v5h3.5a1 1 0 0 0 1-1V9.5" />
  </Icon>
);

export const DocumentIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
    <path d="M14 3.5V8h4.5" />
    <path d="M9 12.5h6M9 15.5h6" />
  </Icon>
);

export const BanknoteIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="10" rx="2" />
    <circle cx="12" cy="12" r="2.25" />
    <path d="M6.5 9v.01M17.5 15v.01" />
  </Icon>
);

export const ReceiptIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5h12v17l-2.25-1.5L13.5 20l-1.5-1.5L10.5 20l-2.25-1.5L6 20.5Z" />
    <path d="M9 8h6M9 11.5h6M9 15h4" />
  </Icon>
);

export const CheckShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 5 6v6c0 4.2 2.9 7 7 8.5 4.1-1.5 7-4.3 7-8.5V6Z" />
    <path d="m9 12 2 2 4-4.5" />
  </Icon>
);

export const ChartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M20 20H4" />
  </Icon>
);

export const ClipboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="4.5" width="12" height="16" rx="1.5" />
    <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" />
    <path d="M9 11h6M9 15h6" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.5 3.5 3 10.2l6.4 2.4 2.4 6.4Z" />
    <path d="M20.5 3.5 11.7 12.3" />
  </Icon>
);

export const ChatIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z" />
    <path d="M8 10h8M8 13h5" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a1.7 1.7 0 0 0 .35 1.9l.05.05a2 2 0 1 1-2.85 2.85l-.05-.05a1.7 1.7 0 0 0-1.9-.35 1.7 1.7 0 0 0-1 1.55V19.5a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.9.35l-.05.05a2 2 0 1 1-2.85-2.85l.05-.05a1.7 1.7 0 0 0 .35-1.9 1.7 1.7 0 0 0-1.55-1H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.35-1.9l-.05-.05a2 2 0 1 1 2.85-2.85l.05.05a1.7 1.7 0 0 0 1.9.35H10a1.7 1.7 0 0 0 1-1.55V4.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.9-.35l.05-.05a2 2 0 1 1 2.85 2.85l-.05.05a1.7 1.7 0 0 0-.35 1.9V10a1.7 1.7 0 0 0 1.55 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.55 1Z" />
  </Icon>
);

export const LogOutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
    <path d="M16 16.5 20.5 12 16 7.5" />
    <path d="M20.5 12h-11" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 5.5 7 6.5-7 6.5" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15.5V4M8 8l4-4 4 4" />
    <path d="M4.5 15.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
    <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.5-4.5" />
  </Icon>
);

export const FilterIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5.5h16L14 13v5.5l-4 2V13Z" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 21.5 19.5H2.5Z" />
    <path d="M12 10v4M12 16.5v.01" />
  </Icon>
);

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.7 10.4 12.2 5 10.6 10.4 9Z" />
    <path d="M19 3.5v3M17.5 5h3" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12h15M13.5 5.5l6.5 6.5-6.5 6.5" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.75" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
);

export const SpinnerIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
