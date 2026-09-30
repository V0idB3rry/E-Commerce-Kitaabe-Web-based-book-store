// Line icons from the mockups (24×24, 1.8 stroke)

const paths = {
  truck: <><path d="M2.5 6.5h11v10h-11z" /><path d="M13.5 10h4l3 3.2v3.3h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  cash: <><rect x="2.5" y="6" width="19" height="12" rx="1.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.4-3.8 4.4-6 8-6s6.6 2.2 8 6" /></>,
  bag: <><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.7-7.5-9.5V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /></>,
  upload: <><path d="M12 20V9" /><path d="M7.5 13.5L12 9l4.5 4.5" /><path d="M5 4h14" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" /><path d="M6.5 7l.8 12.1a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9L17.5 7" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="1.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="1.5" /><path d="M2.5 10h19" /><path d="M6 15h4" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M4 4l16 16" /><path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4" /><path d="M6.3 7.6C3.9 9.3 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.2-1" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  home: <><path d="M4 10.5L12 4l8 6.5" /><path d="M6 9v10.5a.5.5 0 0 0 .5.5H10v-5.5h4V20h3.5a.5.5 0 0 0 .5-.5V9" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>,
  box: <><path d="M4 7.5L12 4l8 3.5v9L12 20l-8-3.5z" /><path d="M4 7.5l8 3.5 8-3.5" /><path d="M12 11v9" /></>,
  filter: <><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></>,
  logout: <><path d="M15 4h3.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H15" /><path d="M10 16.5L5.5 12 10 7.5" /><path d="M5.5 12H16" /></>,
}

export default function Icon({ name, size = 20, stroke = 'currentColor', strokeWidth = 1.8, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
