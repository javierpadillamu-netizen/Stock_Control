// Iconos de linea simples, toman el color del texto (currentColor)
const PATHS = {
  water: "M12 3c3.5 4.2 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8.5 7.2 12 3z",
  stock: "M3 8l9-5 9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8",
  pits: "M3 7h18 M5 7l2 12h10l2-12 M9 11h6 M10 15h4",
  sprinkler: "M12 21v-8 M8 21h8 M12 13a4 4 0 0 0 4-4 M12 13a4 4 0 0 1-4-4 M5 6l2 1 M19 6l-2 1 M12 3v2",
  river: "M3 8c2.5-2 4.5-2 7 0s4.5 2 7 0 3.5-1 4 0 M3 13c2.5-2 4.5-2 7 0s4.5 2 7 0 3.5-1 4 0 M3 18c2.5-2 4.5-2 7 0s4.5 2 7 0 3.5-1 4 0",
  drain: "M4 4h16v6H4z M8 10v4a4 4 0 0 0 8 0v-4 M12 18v3",
  pond: "M3 14c0 3 4 6 9 6s9-3 9-6-4-5-9-5-9 2-9 5z M7 14c1.5 1 3 1 5 0s3.5-1 5 0",
  factory: "M3 21V10l6 4v-4l6 4V5h4l2 16H3z M7 17h2 M12 17h2",
  warehouse: "M3 21V9l9-6 9 6v12 M7 21v-8h10v8 M7 17h10",
  home: "M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-5h4v5",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 7v5l3 2",
  save: "M5 3h11l3 3v15H5z M8 3v5h7V3 M8 21v-7h8v7",
  chevron: "M9 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
