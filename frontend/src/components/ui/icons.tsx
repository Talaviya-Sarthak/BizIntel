import type { ComponentType } from 'react';

export interface IconProps {
  className?: string;
}

function base(props: IconProps): IconProps {
  return { className: props.className ?? 'h-5 w-5' };
}

type Icon = ComponentType<IconProps>;

function createIcon(paths: React.ReactNode): Icon {
  return function IconComponent(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        {...base(props)}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

export const DashboardIcon = createIcon(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
);

export const FolderIcon = createIcon(
  <>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </>,
);

export const SettingsIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
);

export const ChartIcon = createIcon(
  <>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </>,
);

export const TrendingUpIcon = createIcon(
  <>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </>,
);

export const SparklesIcon = createIcon(
  <>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.4L22 18l-2.1.6L19 21l-.9-2.4L16 18l2.1-.6L19 15z" />
  </>,
);

export const DatabaseIcon = createIcon(
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </>,
);

export const DatabaseZapIcon = createIcon(
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3" />
    <path d="M4 12c0 1.7 3.6 3 8 3" />
    <path d="m17 15-3 5h4l-2 4" />
  </>,
);

export const UploadIcon = createIcon(
  <>
    <path d="M12 16V4" />
    <path d="m6 9 6-5 6 5" />
    <path d="M4 20h16" />
  </>,
);

export const TrashIcon = createIcon(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7" />
  </>,
);

export const DownloadIcon = createIcon(
  <>
    <path d="M12 4v12" />
    <path d="m6 11 6 5 6-5" />
    <path d="M4 20h16" />
  </>,
);

export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
);

export const PlusIcon = createIcon(
  <>
    <path d="M12 5v14M5 12h14" />
  </>,
);

export const ChevronDownIcon = createIcon(<path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = createIcon(<path d="m9 6 6 6-6 6" />);

export const CheckCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 5-5" />
  </>,
);

export const XCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </>,
);

export const ClockIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);

export const AlertIcon = createIcon(
  <>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 9v4M12 16.5h.01" />
  </>,
);

export const InfoIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);

export const FileIcon = createIcon(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5" />
  </>,
);

export const MenuIcon = createIcon(<path d="M4 6h16M4 12h16M4 18h16" />);
export const CloseIcon = createIcon(<path d="M6 6l12 12M18 6L6 18" />);

export const EyeIcon = createIcon(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const LogoutIcon = createIcon(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

export const PlayIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4V8z" fill="currentColor" stroke="none" />
  </>,
);

export const RowsIcon = createIcon(
  <>
    <rect x="4" y="4" width="16" height="5" rx="1" />
    <rect x="4" y="10" width="16" height="5" rx="1" />
    <rect x="4" y="16" width="16" height="5" rx="1" />
  </>,
);

export const ColumnsIcon = createIcon(
  <>
    <rect x="4" y="4" width="5" height="16" rx="1" />
    <rect x="10" y="4" width="5" height="16" rx="1" />
    <rect x="16" y="4" width="5" height="16" rx="1" />
  </>,
);

export const GridIcon = createIcon(
  <>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </>,
);

export const MessageIcon = createIcon(
  <>
    <path d="M21 12a8 8 0 0 1-8 8H4l2-2.5A8 8 0 1 1 21 12z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
  </>,
);

export const FilterIcon = createIcon(
  <>
    <path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8L4 5z" />
  </>,
);

export const HashIcon = createIcon(
  <>
    <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />
  </>,
);

export const CalendarIcon = createIcon(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </>,
);

export const ActivityIcon = createIcon(
  <>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </>,
);

export const LayersIcon = createIcon(
  <>
    <path d="M12 3 3 8l9 5 9-5-9-5z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  </>,
);

export const RefreshIcon = createIcon(
  <>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v5h-5" />
  </>,
);
