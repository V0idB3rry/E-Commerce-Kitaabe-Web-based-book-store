// Generates the Second Shelf mockup artboards (*.dc.html) + canvas.json.
// Run: node build-artboards.mjs   (from this folder)
import { writeFileSync } from 'node:fs';

// ── Brand tokens ──────────────────────────────────────────────
const C = {
  green: '#2F4538', greenDeep: '#223329', greenSoft: '#E4EAE3',
  mustard: '#F4B942', mustardSoft: '#FBEFD2',
  paper: '#F6F1E6', card: '#FFFCF5', shelf: '#ECE4D3',
  ink: '#1E2621', muted: '#666D66', line: '#E0D8C6',
  rust: '#9A4A2C', rustSoft: '#F5E2D8',
};

// ── Catalog (sample prices/conditions) ────────────────────────
const BOOKS = {
  money:        { t: 'The Psychology of Money', a: 'Morgan Housel', img: 'money.webp', cat: 'Finance', c: 'Like New', p: 229, m: 399, s: 5 },
  monk:         { t: 'Think Like a Monk', a: 'Jay Shetty', img: 'monk-jay.jpg', cat: 'Self-Help', c: 'Good', p: 249, m: 499, s: 6 },
  power:        { t: 'The 48 Laws of Power', a: 'Robert Greene', img: 'power48.jpg', cat: 'Self-Help', c: 'Good', p: 299, m: 699, s: 4 },
  zero:         { t: 'Zero to One', a: 'Peter Thiel', img: 'zero.jpg', cat: 'Business', c: 'Like New', p: 219, m: 499, s: 3 },
  wings:        { t: 'Wings of Fire', a: 'A. P. J. Abdul Kalam', img: 'wings.jpg', cat: 'Biography', c: 'Good', p: 169, m: 350, s: 10 },
  ferrari:      { t: 'The Monk Who Sold His Ferrari', a: 'Robin Sharma', img: 'ferrari.jpg', cat: 'Self-Help', c: 'Fair', p: 179, m: 299, s: 7 },
  friends:      { t: 'How to Win Friends and Influence People', a: 'Dale Carnegie', img: 'friends.jpg', cat: 'Self-Help', c: 'Good', p: 159, m: 299, s: 8 },
  subconscious: { t: 'The Power of Your Subconscious Mind', a: 'Joseph Murphy', img: 'subconscious.jpg', cat: 'Self-Help', c: 'Like New', p: 149, m: 250, s: 9 },
  dots:         { t: 'Connect the Dots', a: 'Rashmi Bansal', img: 'dots.jpg', cat: 'Business', c: 'Fair', p: 129, m: 250, s: 5 },
  everything:   { t: 'Everything Is F*cked', a: 'Mark Manson', img: 'everything.jpg', cat: 'Self-Help', c: 'Good', p: 199, m: 499, s: 4 },
  attitude:     { t: 'Attitude Is Everything', a: 'Jeff Keller', img: 'attitude.jpg', cat: 'Self-Help', c: 'Fair', p: 119, m: 299, s: 6 },
  gita:         { t: 'Bhagavad Gita', a: 'Ved Vyasa', img: 'gita.jpg', cat: 'Spirituality', c: 'Good', p: 99, m: 250, s: 12 },
  pakistan:     { t: 'Pakistan Under Siege', a: 'Madiha Afzal', img: 'pakistan.jpg', cat: 'Politics', c: 'Like New', p: 259, m: 599, s: 2 },
};
const CATS = ['Self-Help', 'Finance', 'Biography', 'Business', 'Spirituality', 'Politics']
  .map((name) => ({ name, n: Object.values(BOOKS).filter((b) => b.cat === name).length }));

const inr = (n) => '₹' + n.toLocaleString('en-IN');
const off = (b) => Math.round(((b.m - b.p) / b.m) * 100);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const condClass = (c) => ({ 'Like New': 'b-new', Good: 'b-good', Fair: 'b-fair' }[c]);

// ── Icons (24px grid, 1.8 stroke) ─────────────────────────────
const P = {
  search: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
  bag: '<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"></path><path d="M9 8V7a3 3 0 0 1 6 0v1"></path>',
  user: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.4-3.8 4.4-6 8-6s6.6 2.2 8 6"></path>',
  arrow: '<path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path>',
  chevron: '<path d="M6 9l6 6 6-6"></path>',
  chevronR: '<path d="M9 6l6 6-6 6"></path>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
  truck: '<path d="M2.5 6.5h11v10h-11z"></path><path d="M13.5 10h4l3 3.2v3.3h-7"></path><circle cx="6.5" cy="17.5" r="1.8"></circle><circle cx="17" cy="17.5" r="1.8"></circle>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="1.5"></rect><circle cx="12" cy="12" r="2.6"></circle><path d="M6 9.5v5M18 9.5v5"></path>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.7-7.5-9.5V6z"></path><path d="M8.5 12l2.5 2.5 4.5-5"></path>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"></rect><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  minus: '<path d="M5 12h14"></path>',
  x: '<path d="M6 6l12 12M18 6L6 18"></path>',
  trash: '<path d="M4 7h16"></path><path d="M9 7V4.5h6V7"></path><path d="M6.5 7l1 13h9l1-13"></path>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"></path><circle cx="12" cy="12" r="3"></circle>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1"></rect>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"></path><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"></path>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6"></path>',
  tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"></path><circle cx="8.5" cy="8.5" r="1.5"></circle>',
  logout: '<path d="M14 4h4.5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H14"></path><path d="M10 8l-4 4 4 4M6 12h10"></path>',
  store: '<path d="M4 9.5L5.5 4h13L20 9.5"></path><path d="M4 9.5h16v1a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 13.5a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 10.5z"></path><path d="M5.5 13v7.5h13V13"></path>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
  sell: '<path d="M12 20V9"></path><path d="M7.5 13.5L12 9l4.5 4.5"></path><path d="M5 4h14"></path>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"></path>',
};
const ic = (name, size = 20, color = 'currentColor', sw = 1.8) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0">${P[name]}</svg>`;

// Logo: three books on a shelf, the last one leaning.
const logoMark = (size = 34, book = C.green, lean = C.mustard, shelf = C.green) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 34 34" fill="none" style="flex-shrink: 0">` +
  `<rect x="5" y="8" width="6" height="20" rx="1" fill="${book}"></rect>` +
  `<rect x="12.5" y="5" width="6" height="23" rx="1" fill="${book}" opacity="0.72"></rect>` +
  `<rect x="21" y="9" width="6" height="19.5" rx="1" fill="${lean}" transform="rotate(14 24 28)"></rect>` +
  `<rect x="2" y="28.5" width="30" height="2.6" rx="1.3" fill="${shelf}"></rect></svg>`;
const logo = (dark = false, size = 34) =>
  `<div style="display: flex; align-items: center; gap: 10px">${dark ? logoMark(size, C.paper, C.mustard, C.paper) : logoMark(size)}` +
  `<span style="font-family: 'Newsreader', Georgia, serif; font-weight: 600; font-size: ${Math.round(size * 0.74)}px; letter-spacing: -0.01em; color: ${dark ? C.paper : C.green}">Second Shelf</span></div>`;

// ── Shared CSS ────────────────────────────────────────────────
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&amp;family=Figtree:wght@400;500;600;700&amp;family=Newsreader:opsz,wght@6..72,500;6..72,600&amp;display=swap">';
const CSS = `
  body { margin: 0; background: ${C.paper}; color: ${C.ink}; font-family: 'Figtree', 'Segoe UI', system-ui, sans-serif; font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  * { box-sizing: border-box; }
  a { color: ${C.green}; text-decoration: underline; text-underline-offset: 3px; } a:hover { color: ${C.greenDeep}; }
  .serif { font-family: 'Newsreader', Georgia, serif; font-weight: 600; letter-spacing: -0.015em; }
  .display { font-family: 'Anton', Impact, 'Arial Narrow', sans-serif; font-weight: 400; text-transform: uppercase; letter-spacing: 0.01em; line-height: 0.98; }
  .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
  .muted { color: ${C.muted}; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 22px; border-radius: 6px; font-weight: 600; font-size: 15px; white-space: nowrap; }
  .btn-primary { background: ${C.green}; color: ${C.paper}; }
  .btn-accent { background: ${C.mustard}; color: ${C.greenDeep}; }
  .btn-ghost { background: transparent; color: ${C.green}; box-shadow: inset 0 0 0 1.5px ${C.green}; }
  .btn-sm { height: 36px; padding: 0 14px; font-size: 14px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .b-new { background: ${C.greenSoft}; color: #2C5E40; }
  .b-good { background: ${C.mustardSoft}; color: #7A5710; }
  .b-fair { background: ${C.rustSoft}; color: ${C.rust}; }
  .chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 999px; background: ${C.card}; box-shadow: inset 0 0 0 1px ${C.line}; font-size: 14px; font-weight: 500; white-space: nowrap; }
  .input { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; border-radius: 6px; background: ${C.card}; box-shadow: inset 0 0 0 1px ${C.line}; color: ${C.ink}; font-size: 15px; }
  .input.placeholder { color: #9A9D95; }
  .label { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .field { display: flex; flex-direction: column; }
  .card { background: ${C.card}; border-radius: 8px; box-shadow: 0 1px 0 ${C.line}, 0 0 0 1px ${C.line}; }
  .book { display: flex; flex-direction: column; gap: 14px; }
  .shelf { display: flex; align-items: center; justify-content: center; aspect-ratio: 4 / 5; min-height: 0; overflow: hidden; padding: 26px 20px; border-radius: 8px; background: ${C.shelf}; }
  .cover { display: block; width: 100%; height: 100%; min-height: 0; object-fit: contain; filter: drop-shadow(0 10px 14px rgba(34, 51, 41, 0.28)); }
  .book-title { font-family: 'Newsreader', Georgia, serif; font-weight: 600; font-size: 19px; line-height: 1.2; letter-spacing: -0.01em; }
  .price { font-weight: 700; font-size: 18px; }
  .mrp { color: ${C.muted}; text-decoration: line-through; font-size: 14px; }
  .save { color: #2C5E40; font-weight: 600; font-size: 13px; }
  .divider { height: 1px; background: ${C.line}; }
  .dots { background-image: radial-gradient(rgba(246, 241, 230, 0.55) 1.6px, transparent 2.2px); background-size: 16px 16px; }
  table { border-collapse: collapse; width: 100%; }
`;

const doc = (body, extraCss = '') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONTS}
  <style>${CSS}${extraCss}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;

// ── Shared blocks ─────────────────────────────────────────────
const announce = () =>
  `<div style="display: flex; justify-content: center; align-items: center; gap: 28px; height: 38px; background: ${C.greenDeep}; color: ${C.paper}; font-size: 13px; font-weight: 500">` +
  `<div style="display: flex; align-items: center; gap: 8px">${ic('truck', 16, C.mustard)}Free delivery on orders above ₹499</div>` +
  `<div style="display: flex; align-items: center; gap: 8px">${ic('cash', 16, C.mustard)}Cash on delivery available</div></div>`;

const navLink = (label, active) =>
  `<div style="font-weight: ${active ? 700 : 500}; color: ${active ? C.green : C.ink}; padding: 6px 0; box-shadow: ${active ? `inset 0 -2px 0 ${C.mustard}` : 'none'}">${label}</div>`;

const header = (active = '', cartCount = 3, query = '') =>
  announce() +
  `<div style="display: flex; align-items: center; gap: 40px; height: 80px; padding: 0 64px; background: ${C.paper}; box-shadow: inset 0 -1px 0 ${C.line}">` +
  logo() +
  `<div class="input ${query ? '' : 'placeholder'}" style="flex: 1; max-width: 520px; height: 46px; border-radius: 999px; padding: 0 18px">${ic('search', 18, C.muted)}<span>${query || 'Search by title, author or category'}</span></div>` +
  `<div style="display: flex; align-items: center; gap: 28px; margin-left: auto">` +
  navLink('Shop', active === 'shop') + navLink('Categories', active === 'categories') + navLink('Sell your books', active === 'sell') +
  `<div style="width: 1px; height: 28px; background: ${C.line}"></div>` +
  `<div style="display: flex; align-items: center; gap: 8px; font-weight: 500">${ic('user', 22)}Account</div>` +
  `<div style="position: relative; display: flex; align-items: center; gap: 8px; font-weight: 500">${ic('bag', 22)}Cart` +
  (cartCount ? `<span style="display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: ${C.mustard}; color: ${C.greenDeep}; font-size: 12px; font-weight: 700">${cartCount}</span>` : '') +
  `</div></div></div>`;

const footerCol = (title, items) =>
  `<div style="display: flex; flex-direction: column; gap: 12px"><div class="eyebrow" style="color: ${C.mustard}">${title}</div>` +
  items.map((i) => `<div style="color: rgba(246, 241, 230, 0.78)">${i}</div>`).join('') + `</div>`;

const footer = () =>
  `<div style="background: ${C.greenDeep}; color: ${C.paper}; padding: 64px 64px 32px">` +
  `<div style="display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 48px">` +
  `<div style="display: flex; flex-direction: column; gap: 16px">${logo(true)}<div class="display" style="font-size: 30px; line-height: 1.08; color: ${C.mustard}">Old books,<br>new beginnings</div>` +
  `<div style="color: rgba(246, 241, 230, 0.78); max-width: 320px">Pre-loved books, checked by hand and honestly graded.</div></div>` +
  footerCol('Shop', ['All books', 'Categories', 'New arrivals']) +
  footerCol('Help', ['Track your order', 'Returns', 'Condition guide']) +
  footerCol('Get in touch', ['[support email]', '[phone number]', 'Sell your books']) +
  `</div><div style="height: 1px; background: rgba(246, 241, 230, 0.16); margin: 48px 0 24px"></div>` +
  `<div style="display: flex; justify-content: space-between; font-size: 13px; color: rgba(246, 241, 230, 0.6)"><div>© 2026 Second Shelf. All rights reserved.</div>` +
  `<div style="display: flex; gap: 24px"><div>Privacy policy</div><div>Terms</div></div></div></div>`;

const badge = (c) => `<span class="badge ${condClass(c)}">${c}</span>`;

const bookCard = (key, { add = true } = {}) => {
  const b = BOOKS[key];
  return `<div class="book">` +
    `<div class="shelf"><img class="cover" src="${b.img}" alt="${esc(b.t)} cover"></div>` +
    `<div style="display: flex; flex-direction: column; gap: 6px">` +
    `<div style="display: flex">${badge(b.c)}</div>` +
    `<div class="book-title">${esc(b.t)}</div>` +
    `<div class="muted" style="font-size: 14px">${esc(b.a)}</div>` +
    `<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px"><span class="price">${inr(b.p)}</span><span class="mrp">${inr(b.m)}</span><span class="save">${off(b)}% off</span></div>` +
    `</div>` +
    (add ? `<div class="btn btn-ghost btn-sm" style="margin-top: auto">${ic('plus', 16)}Add to cart</div>` : '') +
    `</div>`;
};

const sectionHead = (title, link) =>
  `<div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px">` +
  `<div class="serif" style="font-size: 38px; line-height: 1.1">${title}</div>` +
  (link ? `<div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: ${C.green}">${link}${ic('arrow', 18)}</div>` : '') +
  `</div>`;

const stepper = (n) =>
  `<div style="display: inline-flex; align-items: center; height: 40px; border-radius: 6px; box-shadow: inset 0 0 0 1px ${C.line}; background: ${C.card}">` +
  `<div style="width: 40px; display: flex; justify-content: center; color: ${C.muted}">${ic('minus', 16)}</div>` +
  `<div style="width: 32px; text-align: center; font-weight: 600">${n}</div>` +
  `<div style="width: 40px; display: flex; justify-content: center">${ic('plus', 16)}</div></div>`;

const fan = (keys, widths, positions) =>
  keys.map((k, i) => {
    const [left, top, rot] = positions[i];
    return `<img src="${BOOKS[k].img}" alt="${esc(BOOKS[k].t)} cover" style="position: absolute; left: ${left}px; top: ${top}px; width: ${widths[i]}px; transform: rotate(${rot}deg); filter: drop-shadow(0 22px 26px rgba(20, 30, 24, 0.45)); z-index: ${i === 1 ? 2 : 1}">`;
  }).join('');

const CONDITIONS = [
  ['Like New', 'Looks unread. Tight spine, crisp pages, no names or markings.'],
  ['Good', 'Read with care. Light cover wear or a creased spine; pages clean.'],
  ['Fair', 'Well loved. Visible wear and maybe a name inside, but every page intact.'],
];

const files = {};
const W = 1440;
const page = (content) => `<div style="width: ${W}px; min-height: 100%; background: ${C.paper}">${content}</div>`;

// ═════════════════════════════════════════════════════════════
// HOME (desktop)
// ═════════════════════════════════════════════════════════════
files['Main.dc.html'] = doc(page(
  header('shop') +
  // Hero
  `<div style="position: relative; height: 580px; overflow: hidden; background: ${C.green}">` +
  `<div class="dots" style="position: absolute; left: 40px; top: 28px; width: 210px; height: 72px; opacity: 0.8"></div>` +
  `<div style="position: absolute; right: 0; top: 0; width: 760px; height: 580px; background: ${C.mustard}; clip-path: polygon(38% 0, 100% 0, 100% 100%, 0 100%)"></div>` +
  `<div style="position: absolute; left: 64px; top: 124px; width: 720px; display: flex; flex-direction: column; gap: 22px">` +
  `<div class="eyebrow" style="color: ${C.mustard}">Pre-loved books · Honestly graded</div>` +
  `<div class="display" style="font-size: 92px; color: ${C.paper}">Old books,<br><span style="color: ${C.mustard}">new beginnings</span></div>` +
  `<div style="font-size: 19px; line-height: 1.55; color: rgba(246, 241, 230, 0.86); max-width: 520px">Hand-checked second-hand books for a fraction of the cover price. Every copy is graded, so you know exactly what's arriving.</div>` +
  `<div style="display: flex; align-items: center; gap: 24px; margin-top: 8px">` +
  `<div class="btn btn-accent" style="height: 54px; padding: 0 28px; font-size: 16px">Browse the shelf${ic('arrow', 18)}</div>` +
  `<div style="color: ${C.paper}; font-weight: 600; text-decoration: underline; text-underline-offset: 4px">Sell your books</div></div></div>` +
  `<div style="position: absolute; left: 840px; top: 0; width: 600px; height: 580px">` +
  fan(['monk', 'money', 'power'], [210, 250, 210], [[60, 150, -9], [190, 92, 0], [350, 150, 9]]) +
  `</div></div>` +
  // Trust strip
  `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; padding: 30px 64px; box-shadow: inset 0 -1px 0 ${C.line}">` +
  [['shield', 'Checked by hand', 'Every book is inspected and graded before it’s listed.'],
   ['truck', 'Free delivery above ₹499', 'A flat ₹40 on smaller orders.'],
   ['cash', 'Pay your way', 'UPI, cards, net banking or cash on delivery.']]
    .map(([i, t, d]) => `<div style="display: flex; gap: 14px; align-items: flex-start"><div style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: ${C.greenSoft}; color: ${C.green}">${ic(i, 22)}</div><div><div style="font-weight: 700">${t}</div><div class="muted" style="font-size: 14px">${d}</div></div></div>`).join('') +
  `</div>` +
  // Categories
  `<div style="padding: 72px 64px 0">` + sectionHead('Browse by shelf', 'All categories') +
  `<div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px">` +
  CATS.map((c, i) => {
    const tones = [[C.green, C.paper], [C.mustard, C.greenDeep], [C.card, C.ink], [C.greenDeep, C.paper], [C.shelf, C.ink], [C.rustSoft, C.rust]];
    const [bg, fg] = tones[i];
    return `<div style="display: flex; flex-direction: column; justify-content: space-between; height: 150px; padding: 20px; border-radius: 8px; background: ${bg}; color: ${fg}; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05)">` +
      `<div class="serif" style="font-size: 24px; line-height: 1.1">${c.name}</div>` +
      `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; opacity: 0.85"><span>${c.n} ${c.n === 1 ? 'book' : 'books'}</span>${ic('arrow', 18)}</div></div>`;
  }).join('') + `</div></div>` +
  // Fresh arrivals
  `<div style="padding: 80px 64px 0">` + sectionHead('Fresh on the shelf', 'View all 13 books') +
  `<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 28px">` +
  ['money', 'zero', 'wings', 'pakistan', 'everything'].map((k) => bookCard(k)).join('') + `</div></div>` +
  // Condition guide
  `<div style="padding: 88px 64px 0"><div style="display: grid; grid-template-columns: 400px minmax(0, 1fr); gap: 64px; align-items: start">` +
  `<div style="display: flex; flex-direction: column; gap: 16px"><div class="eyebrow" style="color: ${C.rust}">Condition guide</div>` +
  `<div class="serif" style="font-size: 42px; line-height: 1.08">Know exactly what you’re getting</div>` +
  `<div class="muted" style="font-size: 16px">Second-hand shouldn’t mean second-guessing. We grade every copy on one simple scale and show it on every listing.</div>` +
  `<div style="font-size: 14px; margin-top: 4px">Not as described? Tell us within [X] days of delivery.</div></div>` +
  `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">` +
  CONDITIONS.map(([c, d]) => `<div class="card" style="padding: 26px; display: flex; flex-direction: column; gap: 14px; min-height: 200px"><div style="display: flex">${badge(c)}</div><div class="serif" style="font-size: 26px">${c}</div><div class="muted">${d}</div></div>`).join('') +
  `</div></div></div>` +
  // Sell band
  `<div style="padding: 88px 64px 88px"><div style="position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 48px; padding: 56px 64px; border-radius: 10px; background: ${C.mustard}">` +
  `<div style="display: flex; flex-direction: column; gap: 14px; max-width: 680px">` +
  `<div class="display" style="font-size: 56px; color: ${C.greenDeep}">Your shelf is full.<br>Someone else’s isn’t.</div>` +
  `<div style="font-size: 17px; color: ${C.greenDeep}">Send us the books you’ve finished and get paid for every copy we accept.</div></div>` +
  `<div class="btn btn-primary" style="height: 54px; padding: 0 28px; font-size: 16px">${ic('sell', 18)}Sell your books</div></div></div>` +
  footer()
));

// ═════════════════════════════════════════════════════════════
// HOME (mobile)
// ═════════════════════════════════════════════════════════════
const mBook = (k) => {
  const b = BOOKS[k];
  return `<div class="book" style="gap: 10px"><div class="shelf" style="padding: 16px 12px"><img class="cover" src="${b.img}" alt="${esc(b.t)} cover"></div>` +
    `<div style="display: flex; flex-direction: column; gap: 4px"><div style="display: flex">${badge(b.c)}</div>` +
    `<div class="book-title" style="font-size: 16px">${esc(b.t)}</div><div class="muted" style="font-size: 13px">${esc(b.a)}</div>` +
    `<div style="display: flex; align-items: baseline; gap: 6px"><span class="price" style="font-size: 16px">${inr(b.p)}</span><span class="mrp" style="font-size: 13px">${inr(b.m)}</span></div></div></div>`;
};
files['HomeMobile.dc.html'] = doc(
  `<div style="width: 390px; min-height: 100%; background: ${C.paper}">` +
  `<div style="display: flex; justify-content: center; align-items: center; gap: 8px; height: 34px; background: ${C.greenDeep}; color: ${C.paper}; font-size: 12px; font-weight: 500">${ic('truck', 14, C.mustard)}Free delivery above ₹499 · COD available</div>` +
  `<div style="display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 16px">${logo(false, 28)}` +
  `<div style="display: flex; gap: 4px">` +
  `<div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; position: relative">${ic('bag', 24)}<span style="position: absolute; top: 4px; right: 2px; min-width: 18px; height: 18px; border-radius: 999px; background: ${C.mustard}; color: ${C.greenDeep}; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center">3</span></div>` +
  `<div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">${ic('menu', 24)}</div></div></div>` +
  `<div style="padding: 0 16px 16px"><div class="input placeholder" style="border-radius: 999px">${ic('search', 18, C.muted)}Search books or authors</div></div>` +
  `<div style="position: relative; height: 580px; overflow: hidden; background: ${C.green}">` +
  `<div style="position: absolute; left: 0; bottom: 0; width: 390px; height: 230px; background: ${C.mustard}; clip-path: polygon(0 40%, 100% 0, 100% 100%, 0 100%)"></div>` +
  `<div style="position: absolute; left: 20px; top: 36px; right: 20px; display: flex; flex-direction: column; gap: 14px">` +
  `<div class="eyebrow" style="color: ${C.mustard}; font-size: 11px">Pre-loved · Honestly graded</div>` +
  `<div class="display" style="font-size: 46px; color: ${C.paper}">Old books,<br><span style="color: ${C.mustard}">new beginnings</span></div>` +
  `<div style="color: rgba(246, 241, 230, 0.86); font-size: 16px">Hand-checked second-hand books for a fraction of the cover price.</div>` +
  `<div class="btn btn-accent" style="align-self: flex-start">Browse the shelf${ic('arrow', 18)}</div></div>` +
  `<div style="position: absolute; left: 0; top: 350px; width: 390px; height: 230px">` +
  fan(['monk', 'money', 'power'], [120, 140, 120], [[48, 34, -9], [125, 12, 0], [222, 34, 9]]) + `</div></div>` +
  `<div style="display: flex; flex-direction: column; gap: 14px; padding: 24px 20px; box-shadow: inset 0 -1px 0 ${C.line}">` +
  [['shield', 'Every book checked and graded'], ['truck', 'Free delivery above ₹499'], ['cash', 'UPI, cards or cash on delivery']]
    .map(([i, t]) => `<div style="display: flex; gap: 12px; align-items: center; font-weight: 600; font-size: 15px"><span style="color: ${C.green}">${ic(i, 22)}</span>${t}</div>`).join('') + `</div>` +
  `<div style="padding: 32px 0 0 20px"><div class="serif" style="font-size: 28px; margin-bottom: 16px">Browse by shelf</div>` +
  `<div style="display: flex; gap: 10px; overflow: hidden">` + CATS.map((c) => `<div class="chip" style="height: 44px">${c.name}<span class="muted">${c.n}</span></div>`).join('') + `</div></div>` +
  `<div style="padding: 36px 20px 0"><div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px"><div class="serif" style="font-size: 28px">Fresh on the shelf</div><div style="font-weight: 600; color: ${C.green}">View all</div></div>` +
  `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 14px">` + ['money', 'zero', 'wings', 'pakistan'].map(mBook).join('') + `</div></div>` +
  `<div style="padding: 40px 20px 0"><div class="serif" style="font-size: 28px; margin-bottom: 16px">Know what you’re getting</div>` +
  `<div style="display: flex; flex-direction: column; gap: 10px">` + CONDITIONS.map(([c, d]) => `<div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px"><div style="display: flex">${badge(c)}</div><div class="muted" style="font-size: 14px">${d}</div></div>`).join('') + `</div></div>` +
  `<div style="margin: 40px 20px 40px; padding: 28px 22px; border-radius: 10px; background: ${C.mustard}; display: flex; flex-direction: column; gap: 12px">` +
  `<div class="display" style="font-size: 36px; color: ${C.greenDeep}">Your shelf is full. Someone else’s isn’t.</div>` +
  `<div style="color: ${C.greenDeep}">Send us the books you’ve finished and get paid.</div>` +
  `<div class="btn btn-primary" style="align-self: flex-start">Sell your books</div></div>` +
  `<div style="background: ${C.greenDeep}; padding: 32px 20px; display: flex; flex-direction: column; gap: 16px">${logo(true, 28)}` +
  `<div style="display: flex; gap: 20px; flex-wrap: wrap; color: rgba(246, 241, 230, 0.78); font-size: 14px"><span>Shop</span><span>Track order</span><span>Returns</span><span>Contact</span></div>` +
  `<div style="font-size: 12px; color: rgba(246, 241, 230, 0.6)">© 2026 Second Shelf</div></div>` +
  `</div>`
);

// ═════════════════════════════════════════════════════════════
// CATALOG
// ═════════════════════════════════════════════════════════════
const checkRow = (label, count, checked, extra = '') =>
  `<div style="display: flex; align-items: center; gap: 10px; min-height: 32px">` +
  `<div style="width: 20px; height: 20px; border-radius: 5px; display: flex; align-items: center; justify-content: center; ${checked ? `background: ${C.green}` : `box-shadow: inset 0 0 0 1.5px #B9B3A4; background: ${C.card}`}">${checked ? ic('check', 14, C.paper, 2.6) : ''}</div>` +
  `<div style="flex: 1; ${checked ? 'font-weight: 600' : ''}">${extra || label}</div>` +
  (count !== undefined ? `<div class="muted" style="font-size: 13px">${count}</div>` : '') + `</div>`;

const filterGroup = (title, inner) =>
  `<div style="display: flex; flex-direction: column; gap: 10px; padding: 22px 0; box-shadow: inset 0 -1px 0 ${C.line}">` +
  `<div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700">${title}${ic('chevron', 18, C.muted)}</div>${inner}</div>`;

const selfHelp = Object.entries(BOOKS).filter(([, b]) => b.cat === 'Self-Help').map(([k]) => k);
files['Catalog.dc.html'] = doc(page(
  header('shop') +
  `<div style="padding: 36px 64px 28px; display: flex; flex-direction: column; gap: 10px">` +
  `<div style="display: flex; align-items: center; gap: 6px; font-size: 14px" class="muted">Home${ic('chevronR', 14)}Shop${ic('chevronR', 14)}<span style="color: ${C.ink}">Self-Help</span></div>` +
  `<div style="display: flex; align-items: flex-end; justify-content: space-between">` +
  `<div><div class="serif" style="font-size: 52px; line-height: 1.05">Self-Help</div><div class="muted" style="font-size: 16px; margin-top: 6px">${selfHelp.length} books on this shelf</div></div>` +
  `<div style="display: flex; align-items: center; gap: 12px"><span class="muted">Sort by</span><div class="input" style="height: 44px; gap: 28px">Newest first${ic('chevron', 18, C.muted)}</div></div>` +
  `</div></div>` +
  `<div style="display: grid; grid-template-columns: 272px minmax(0, 1fr); gap: 48px; padding: 0 64px 88px">` +
  // Sidebar
  `<div style="display: flex; flex-direction: column">` +
  `<div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; box-shadow: inset 0 -1px 0 ${C.line}"><div style="font-weight: 700; font-size: 17px">Filters</div><div style="font-size: 14px; font-weight: 600; color: ${C.green}; text-decoration: underline; text-underline-offset: 3px">Clear all</div></div>` +
  filterGroup('Category', CATS.map((c) => checkRow(c.name, c.n, c.name === 'Self-Help')).join('')) +
  filterGroup('Condition', CONDITIONS.map(([c]) => checkRow(c, undefined, c !== 'Fair', badge(c))).join('')) +
  filterGroup('Price', `<div style="display: flex; flex-wrap: wrap; gap: 8px">` +
    ['Under ₹150', '₹150 – ₹250', 'Above ₹250'].map((l, i) => `<div class="chip" style="${i === 1 ? `background: ${C.green}; color: ${C.paper}; box-shadow: none` : ''}">${l}</div>`).join('') + `</div>`) +
  filterGroup('Availability', `<div style="display: flex; align-items: center; justify-content: space-between"><span>In stock only</span>` +
    `<div style="width: 44px; height: 26px; border-radius: 999px; background: ${C.green}; position: relative"><div style="position: absolute; right: 3px; top: 3px; width: 20px; height: 20px; border-radius: 50%; background: ${C.paper}"></div></div></div>`) +
  `</div>` +
  // Results
  `<div style="display: flex; flex-direction: column; gap: 28px">` +
  `<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap"><span class="muted" style="font-size: 14px">Showing 3 of 7</span>` +
  ['Self-Help', 'Like New', 'Good', '₹150 – ₹250', 'In stock'].map((l) => `<div class="chip" style="height: 32px; font-size: 13px; background: ${C.greenSoft}; box-shadow: none">${l}${ic('x', 14)}</div>`).join('') + `</div>` +
  `<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 36px 28px">` +
  ['monk', 'everything', 'friends'].map((k) => bookCard(k)).join('') + `</div>` +
  // Rest of shelf (hidden by current filters) teaser
  `<div style="display: flex; flex-direction: column; gap: 20px; margin-top: 24px; padding-top: 32px; box-shadow: inset 0 1px 0 ${C.line}">` +
  `<div style="display: flex; justify-content: space-between; align-items: center"><div><div class="serif" style="font-size: 26px">4 more Self-Help books outside your filters</div><div class="muted">Different condition or price range</div></div><div class="btn btn-ghost">Show all Self-Help</div></div>` +
  `<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; opacity: 0.9">` +
  ['power', 'subconscious', 'ferrari', 'attitude'].map((k) => bookCard(k)).join('') + `</div></div>` +
  `</div></div>` +
  footer()
));

// ═════════════════════════════════════════════════════════════
// BOOK DETAIL
// ═════════════════════════════════════════════════════════════
const bm = BOOKS.money;
files['BookDetail.dc.html'] = doc(page(
  header('shop') +
  `<div style="padding: 28px 64px 0"><div style="display: flex; align-items: center; gap: 6px; font-size: 14px" class="muted">Home${ic('chevronR', 14)}Finance${ic('chevronR', 14)}<span style="color: ${C.ink}">${bm.t}</span></div></div>` +
  `<div style="display: grid; grid-template-columns: 600px minmax(0, 1fr); gap: 72px; padding: 28px 64px 0">` +
  // Cover
  `<div style="display: flex; flex-direction: column; gap: 16px">` +
  `<div style="display: flex; align-items: center; justify-content: center; height: 680px; border-radius: 10px; background: ${C.shelf}; padding: 64px">` +
  `<img src="${bm.img}" alt="${bm.t} cover" style="height: 100%; width: auto; filter: drop-shadow(0 26px 30px rgba(34, 51, 41, 0.35))"></div>` +
  `</div>` +
  // Info
  `<div style="display: flex; flex-direction: column; gap: 22px; padding-top: 12px">` +
  `<div style="display: flex; gap: 10px">${badge(bm.c)}<span class="chip" style="height: 24px; font-size: 12px; padding: 0 10px">Finance</span></div>` +
  `<div><div class="serif" style="font-size: 56px; line-height: 1.02">${bm.t}</div><div style="font-size: 18px; margin-top: 10px">by <span style="font-weight: 600; color: ${C.green}; text-decoration: underline; text-underline-offset: 3px">${bm.a}</span></div></div>` +
  `<div style="display: flex; align-items: baseline; gap: 14px"><span style="font-size: 40px; font-weight: 700">${inr(bm.p)}</span><span class="mrp" style="font-size: 20px">${inr(bm.m)}</span>` +
  `<span style="padding: 4px 10px; border-radius: 6px; background: ${C.greenSoft}; color: #2C5E40; font-weight: 700; font-size: 14px">You save ${inr(bm.m - bm.p)} (${off(bm)}%)</span></div>` +
  `<div style="display: flex; gap: 16px; padding: 18px 20px; border-radius: 8px; background: ${C.card}; box-shadow: inset 0 0 0 1px ${C.line}">` +
  `<div style="color: #2C5E40">${ic('book', 24)}</div><div><div style="font-weight: 700">Condition: Like New</div><div class="muted">${CONDITIONS[0][1]}</div>` +
  `<div style="font-size: 14px; font-weight: 600; margin-top: 6px; color: ${C.green}; text-decoration: underline; text-underline-offset: 3px">How we grade</div></div></div>` +
  `<div class="divider"></div>` +
  `<div style="display: flex; align-items: center; gap: 14px">${stepper(1)}<span class="muted" style="font-size: 14px; font-weight: 600">${bm.s} copies in stock</span></div>` +
  `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">` +
  `<div class="btn btn-primary" style="height: 56px; font-size: 16px">${ic('bag', 20)}Add to cart</div><div class="btn btn-accent" style="height: 56px; font-size: 16px">Buy now</div></div>` +
  `<div style="display: flex; flex-direction: column; gap: 10px; padding: 18px 20px; border-radius: 8px; box-shadow: inset 0 0 0 1px ${C.line}; font-size: 15px">` +
  `<div style="display: flex; gap: 12px; align-items: center">${ic('truck', 20, C.green)}Free delivery on orders above ₹499, otherwise ₹40</div>` +
  `<div style="display: flex; gap: 12px; align-items: center">${ic('cash', 20, C.green)}Cash on delivery available</div>` +
  `<div style="display: flex; gap: 12px; align-items: center">${ic('shield', 20, C.green)}Secure online payments by Razorpay</div></div>` +
  `</div></div>` +
  // Description + details
  `<div style="display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 72px; padding: 72px 64px 0">` +
  `<div><div class="serif" style="font-size: 30px; margin-bottom: 14px">About this book</div>` +
  `<div style="font-size: 17px; line-height: 1.7; max-width: 720px">Doing well with money isn’t necessarily about what you know. It’s about how you behave. In 19 short stories, Morgan Housel explores the strange ways people think about money and teaches you how to make better sense of one of life’s most important topics.</div></div>` +
  `<div class="card" style="padding: 8px 22px">` +
  [['Author', bm.a], ['Category', bm.cat], ['Condition', bm.c], ['Cover price (new)', inr(bm.m)], ['In stock', `${bm.s} copies`]]
    .map(([k, v], i) => `<div style="display: flex; justify-content: space-between; padding: 14px 0; ${i ? `box-shadow: inset 0 1px 0 ${C.line}` : ''}"><span class="muted">${k}</span><span style="font-weight: 600">${v}</span></div>`).join('') +
  `</div></div>` +
  `<div style="padding: 80px 64px 88px">` + sectionHead('You might also like', 'View all') +
  `<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 28px">` +
  ['zero', 'dots', 'power', 'friends', 'subconscious'].map((k) => bookCard(k)).join('') + `</div></div>` +
  footer()
));

// ═════════════════════════════════════════════════════════════
// CART
// ═════════════════════════════════════════════════════════════
const cartKeys = ['money', 'zero', 'wings'];
const cartItems = cartKeys.map((k) => BOOKS[k]);
const subtotal = cartItems.reduce((s, b) => s + b.p, 0);
const mrpTotal = cartItems.reduce((s, b) => s + b.m, 0);
const delivery = subtotal >= 499 ? 0 : 40;
const total = subtotal + delivery;
const summaryRows = (rows) => rows.map(([k, v, style = '']) => `<div style="display: flex; justify-content: space-between; ${style}"><span>${k}</span><span>${v}</span></div>`).join('');

files['Cart.dc.html'] = doc(page(
  header('', 3) +
  `<div style="padding: 44px 64px 96px">` +
  `<div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 28px"><div class="serif" style="font-size: 52px">Your cart</div><div class="muted" style="font-size: 18px">3 books</div></div>` +
  `<div style="display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 48px; align-items: start">` +
  `<div style="display: flex; flex-direction: column; gap: 20px">` +
  `<div style="display: flex; flex-direction: column; gap: 10px; padding: 18px 22px; border-radius: 8px; background: ${C.greenSoft}">` +
  `<div style="display: flex; align-items: center; gap: 10px; font-weight: 700; color: #2C5E40">${ic('truck', 20)}You’ve unlocked free delivery</div>` +
  `<div style="height: 6px; border-radius: 999px; background: ${C.green}"></div></div>` +
  `<div class="card">` +
  cartItems.map((b, i) =>
    `<div style="display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: 24px; padding: 24px; ${i ? `box-shadow: inset 0 1px 0 ${C.line}` : ''}">` +
    `<div style="display: flex; align-items: center; justify-content: center; height: 140px; border-radius: 6px; background: ${C.shelf}; padding: 12px"><img class="cover" src="${b.img}" alt="${esc(b.t)} cover"></div>` +
    `<div style="display: flex; flex-direction: column; gap: 6px"><div style="display: flex">${badge(b.c)}</div><div class="book-title" style="font-size: 22px">${esc(b.t)}</div><div class="muted">${esc(b.a)}</div>` +
    `<div style="display: flex; align-items: center; gap: 20px; margin-top: auto">${stepper(1)}<div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600" class="muted">${ic('trash', 16)}Remove</div></div></div>` +
    `<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px"><span class="price" style="font-size: 20px">${inr(b.p)}</span><span class="mrp">${inr(b.m)}</span><span class="save">${off(b)}% off</span></div>` +
    `</div>`).join('') +
  `</div>` +
  `<div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: ${C.green}">${ic('arrow', 18)}Continue browsing</div>` +
  `</div>` +
  // Summary
  `<div class="card" style="padding: 28px; display: flex; flex-direction: column; gap: 16px">` +
  `<div class="serif" style="font-size: 28px">Order summary</div>` +
  summaryRows([
    ['Cover price (3 books)', `<span class="mrp" style="font-size: 15px">${inr(mrpTotal)}</span>`],
    ['Second-hand discount', `<span class="save" style="font-size: 15px">−${inr(mrpTotal - subtotal)}</span>`],
    ['Subtotal', inr(subtotal), 'font-weight: 600'],
    ['Delivery', delivery ? inr(delivery) : `<span><span class="mrp" style="font-size: 14px">₹40</span> <span class="save" style="font-size: 15px">Free</span></span>`],
  ]) +
  `<div class="divider"></div>` +
  `<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-weight: 700; font-size: 18px">Total</span><span style="font-weight: 700; font-size: 30px">${inr(total)}</span></div>` +
  `<div style="padding: 12px 14px; border-radius: 6px; background: ${C.mustardSoft}; color: #6B4C0C; font-weight: 600; font-size: 14px; text-align: center">You’re saving ${inr(mrpTotal - subtotal)} on this order</div>` +
  `<div class="btn btn-primary" style="height: 56px; font-size: 16px">${ic('lock', 18)}Proceed to checkout</div>` +
  `<div class="muted" style="font-size: 13px; text-align: center">UPI, cards, net banking or cash on delivery</div>` +
  `</div></div></div>` +
  footer()
));

// ═════════════════════════════════════════════════════════════
// CHECKOUT
// ═════════════════════════════════════════════════════════════
const step = (n, label, state) => {
  const done = state === 'done', cur = state === 'current';
  return `<div style="display: flex; align-items: center; gap: 10px; font-weight: ${cur ? 700 : 500}; color: ${done || cur ? C.ink : C.muted}">` +
    `<div style="width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; ${done ? `background: ${C.green}; color: ${C.paper}` : cur ? `background: ${C.mustard}; color: ${C.greenDeep}` : `box-shadow: inset 0 0 0 1.5px ${C.line}`}">${done ? ic('check', 14, C.paper, 2.6) : n}</div>${label}</div>`;
};
const inputField = (label, value, { placeholder = false, prefix = '', span = 1, h = 48 } = {}) =>
  `<div class="field" style="grid-column: span ${span}"><div class="label">${label}</div>` +
  `<div class="input ${placeholder ? 'placeholder' : ''}" style="height: ${h}px; ${h > 48 ? 'align-items: flex-start; padding-top: 13px' : ''}">${prefix ? `<span style="color: ${C.ink}; font-weight: 600; padding-right: 10px; box-shadow: inset -1px 0 0 ${C.line}">${prefix}</span>` : ''}${value}</div></div>`;

const payOption = (selected, icon, title, desc, extra = '') =>
  `<div style="display: flex; gap: 16px; padding: 20px; border-radius: 8px; background: ${selected ? C.card : 'transparent'}; box-shadow: inset 0 0 0 ${selected ? `2px ${C.green}` : `1px ${C.line}`}">` +
  `<div style="width: 22px; height: 22px; border-radius: 50%; margin-top: 2px; ${selected ? `box-shadow: inset 0 0 0 7px ${C.green}` : `box-shadow: inset 0 0 0 1.5px #B9B3A4`}"></div>` +
  `<div style="flex: 1"><div style="display: flex; align-items: center; gap: 10px; font-weight: 700">${icon}${title}</div><div class="muted" style="font-size: 14px; margin-top: 2px">${desc}</div>${extra}</div></div>`;

files['Checkout.dc.html'] = doc(page(
  `<div style="display: flex; align-items: center; justify-content: space-between; height: 84px; padding: 0 64px; box-shadow: inset 0 -1px 0 ${C.line}">` +
  logo() +
  `<div style="display: flex; align-items: center; gap: 18px">${step(1, 'Cart', 'done')}<div style="width: 48px; height: 2px; background: ${C.green}"></div>${step(2, 'Delivery & payment', 'current')}<div style="width: 48px; height: 2px; background: ${C.line}"></div>${step(3, 'Confirmation', 'next')}</div>` +
  `<div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: ${C.green}">${ic('lock', 18)}Secure checkout</div></div>` +
  `<div style="display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 56px; padding: 44px 64px 96px; align-items: start">` +
  `<div style="display: flex; flex-direction: column; gap: 36px">` +
  `<div class="card" style="padding: 32px">` +
  `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px"><div class="serif" style="font-size: 30px">Delivery details</div></div>` +
  `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">` +
  inputField('Full name', 'Priya Sharma') +
  inputField('Phone number', '98765 43210', { prefix: '+91' }) +
  inputField('Email', 'priya.sharma@example.com', { span: 2 }) +
  inputField('Address', 'Flat 4B, Shanti Apartments, Baner Road', { span: 2, h: 84 }) +
  inputField('City', 'Pune') +
  inputField('Pincode', '411045') +
  `</div></div>` +
  `<div class="card" style="padding: 32px">` +
  `<div class="serif" style="font-size: 30px; margin-bottom: 24px">Payment method</div>` +
  `<div style="display: flex; flex-direction: column; gap: 12px">` +
  payOption(true, ic('shield', 20, C.green), 'Pay online', 'UPI, credit & debit cards, net banking and wallets',
    `<div style="display: flex; gap: 8px; margin-top: 12px">${['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net banking'].map((m) => `<span class="chip" style="height: 28px; font-size: 12px; font-weight: 600">${m}</span>`).join('')}</div>`) +
  payOption(false, ic('cash', 20, C.green), 'Cash on delivery', 'Pay in cash when your books arrive') +
  `</div></div></div>` +
  // Summary
  `<div class="card" style="padding: 28px; display: flex; flex-direction: column; gap: 18px">` +
  `<div style="display: flex; justify-content: space-between; align-items: baseline"><div class="serif" style="font-size: 26px">Your order</div><div style="font-size: 14px; font-weight: 600; color: ${C.green}; text-decoration: underline; text-underline-offset: 3px">Edit cart</div></div>` +
  cartItems.map((b) =>
    `<div style="display: flex; gap: 14px; align-items: center"><div style="width: 56px; height: 72px; flex-shrink: 0; border-radius: 4px; background: ${C.shelf}; padding: 6px"><img class="cover" src="${b.img}" alt="${esc(b.t)} cover" style="filter: none"></div>` +
    `<div style="flex: 1; min-width: 0"><div style="font-weight: 600; line-height: 1.3">${esc(b.t)}</div><div class="muted" style="font-size: 13px">${b.c} · Qty 1</div></div><div style="font-weight: 600">${inr(b.p)}</div></div>`).join('') +
  `<div class="divider"></div>` +
  summaryRows([['Subtotal', inr(subtotal)], ['Delivery', delivery ? inr(delivery) : `<span class="save" style="font-size: 15px">Free</span>`], ['You save', `<span class="save" style="font-size: 15px">${inr(mrpTotal - subtotal)}</span>`]]) +
  `<div class="divider"></div>` +
  `<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-weight: 700; font-size: 18px">Total</span><span style="font-weight: 700; font-size: 30px">${inr(total)}</span></div>` +
  `<div class="btn btn-primary" style="height: 56px; font-size: 16px">${ic('lock', 18)}Pay ${inr(total)}</div>` +
  `<div class="muted" style="display: flex; gap: 8px; align-items: flex-start; font-size: 13px">${ic('shield', 16)}Payments are processed securely by Razorpay. We never see or store your card details.</div>` +
  `</div></div>`
));

// ═════════════════════════════════════════════════════════════
// SIGN IN
// ═════════════════════════════════════════════════════════════
files['SignIn.dc.html'] = doc(
  `<div style="width: ${W}px; height: 100%; min-height: 900px; display: grid; grid-template-columns: 640px minmax(0, 1fr); background: ${C.paper}">` +
  `<div style="position: relative; overflow: hidden; background: ${C.green}; padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between">` +
  `<div class="dots" style="position: absolute; right: 40px; top: 40px; width: 180px; height: 110px"></div>` +
  `<div style="position: absolute; left: 0; bottom: 0; width: 640px; height: 360px; background: ${C.mustard}; clip-path: polygon(0 45%, 100% 0, 100% 100%, 0 100%)"></div>` +
  `<div style="position: relative">${logo(true)}</div>` +
  `<div style="position: relative; display: flex; flex-direction: column; gap: 16px; margin-bottom: 300px"><div class="display" style="font-size: 68px; color: ${C.paper}">Old books,<br><span style="color: ${C.mustard}">new beginnings</span></div>` +
  `<div style="color: rgba(246, 241, 230, 0.86); font-size: 17px; max-width: 420px">Sign in to track your orders, save your delivery address and check out faster.</div></div>` +
  `<div style="position: absolute; left: 0; bottom: 0; width: 640px; height: 330px">` +
  fan(['wings', 'money', 'zero'], [160, 190, 160], [[120, 90, -10], [225, 40, 0], [350, 90, 10]]) + `</div></div>` +
  `<div style="display: flex; align-items: center; justify-content: center; padding: 48px">` +
  `<div style="width: 420px; display: flex; flex-direction: column; gap: 22px">` +
  `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 4px; border-radius: 8px; background: ${C.shelf}">` +
  `<div style="height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: ${C.card}; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.08)">Sign in</div>` +
  `<div style="height: 42px; display: flex; align-items: center; justify-content: center; font-weight: 500" class="muted">Create account</div></div>` +
  `<div><div class="serif" style="font-size: 44px; line-height: 1.1">Welcome back</div><div class="muted" style="font-size: 16px; margin-top: 6px">Good to see you on the shelf again.</div></div>` +
  `<div class="field"><div class="label">Email</div><div class="input placeholder">you@example.com</div></div>` +
  `<div class="field"><div style="display: flex; justify-content: space-between"><div class="label">Password</div><div style="font-size: 13px; font-weight: 600; color: ${C.green}; text-decoration: underline; text-underline-offset: 3px">Forgot password?</div></div>` +
  `<div class="input" style="justify-content: space-between; box-shadow: inset 0 0 0 2px ${C.green}"><span style="letter-spacing: 0.2em">••••••••••</span>${ic('eye', 18, C.muted)}</div></div>` +
  `<div style="display: flex; align-items: center; gap: 10px">${checkRow('', undefined, true, 'Keep me signed in')}</div>` +
  `<div class="btn btn-primary" style="height: 54px; font-size: 16px">Sign in</div>` +
  `<div class="muted" style="text-align: center">New to Second Shelf? <span style="font-weight: 700; color: ${C.green}; text-decoration: underline; text-underline-offset: 3px">Create an account</span></div>` +
  `</div></div></div>`
);

// ═════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═════════════════════════════════════════════════════════════
const payBadge = (s) => ({
  Paid: `<span class="badge b-new">Paid</span>`,
  COD: `<span class="badge" style="background: #E6E9F2; color: #3C4A6B">COD</span>`,
  Failed: `<span class="badge b-fair">Failed</span>`,
})[s];
const statusSel = (s) => {
  const tone = { Processing: [C.mustardSoft, '#7A5710'], Shipped: ['#E6E9F2', '#3C4A6B'], Delivered: [C.greenSoft, '#2C5E40'], Cancelled: [C.rustSoft, C.rust] }[s];
  return `<div style="display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 8px 0 12px; border-radius: 6px; background: ${tone[0]}; color: ${tone[1]}; font-size: 13px; font-weight: 600">${s}${ic('chevron', 14)}</div>`;
};
const ORDERS = [
  ['#1042', 'Priya Sharma', 'Pune', '14 Sep, 11:20 AM', 3, 617, 'Paid', 'Processing'],
  ['#1041', 'Rahul Verma', 'Delhi', '14 Sep, 09:05 AM', 1, 339, 'COD', 'Processing'],
  ['#1040', 'Ananya Iyer', 'Chennai', '13 Sep, 06:48 PM', 2, 518, 'Paid', 'Shipped'],
  ['#1039', 'Karan Mehta', 'Jaipur', '12 Sep, 02:15 PM', 4, 736, 'Paid', 'Delivered'],
  ['#1038', 'Sneha Kulkarni', 'Mumbai', '12 Sep, 10:32 AM', 1, 189, 'Failed', 'Cancelled'],
  ['#1037', 'Arjun Nair', 'Kochi', '11 Sep, 07:54 PM', 2, 508, 'COD', 'Delivered'],
];
const sideItem = (icon, label, active) =>
  `<div style="display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 14px; border-radius: 6px; ${active ? `background: rgba(246, 241, 230, 0.1); color: ${C.paper}; font-weight: 600; box-shadow: inset 3px 0 0 ${C.mustard}` : 'color: rgba(246, 241, 230, 0.7)'}">${ic(icon, 20)}${label}</div>`;
const kpi = (label, value, note) =>
  `<div class="card" style="padding: 22px 24px; display: flex; flex-direction: column; gap: 6px"><div class="muted" style="font-size: 14px; font-weight: 500">${label}</div>` +
  `<div style="font-size: 34px; font-weight: 700; letter-spacing: -0.01em">${value}</div><div class="muted" style="font-size: 13px">${note}</div></div>`;
const th = (t, align = 'left') => `<th style="text-align: ${align}; padding: 12px 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${C.muted}; box-shadow: inset 0 -1px 0 ${C.line}">${t}</th>`;
const td = (c, align = 'left') => `<td style="text-align: ${align}; padding: 14px 16px; box-shadow: inset 0 -1px 0 ${C.line}; vertical-align: middle">${c}</td>`;

files['Admin.dc.html'] = doc(
  `<div style="width: ${W}px; min-height: 100%; display: grid; grid-template-columns: 248px minmax(0, 1fr); background: #F2EEE4">` +
  `<div style="background: ${C.greenDeep}; padding: 24px 16px; display: flex; flex-direction: column; gap: 6px">` +
  `<div style="display: flex; align-items: center; justify-content: space-between; padding: 0 6px 24px">${logo(true, 28)}</div>` +
  `<div class="eyebrow" style="color: rgba(246, 241, 230, 0.45); font-size: 11px; padding: 0 14px 6px">Manage</div>` +
  sideItem('grid', 'Dashboard', true) + sideItem('book', 'Books') + sideItem('receipt', 'Orders') + sideItem('tag', 'Categories') +
  `<div style="margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: 16px; box-shadow: inset 0 1px 0 rgba(246, 241, 230, 0.12)">` +
  sideItem('store', 'View store') + sideItem('logout', 'Log out') + `</div></div>` +
  `<div style="padding: 28px 40px 48px; display: flex; flex-direction: column; gap: 28px">` +
  `<div style="display: flex; align-items: center; justify-content: space-between">` +
  `<div><div class="serif" style="font-size: 38px">Dashboard</div><div class="muted">Sunday, 14 September 2026</div></div>` +
  `<div style="display: flex; align-items: center; gap: 14px"><div class="input placeholder" style="width: 300px; height: 44px">${ic('search', 18, C.muted)}Search orders or books</div>` +
  `<div class="btn btn-primary" style="height: 44px">${ic('plus', 18)}Add book</div>` +
  `<div style="width: 44px; height: 44px; border-radius: 50%; background: ${C.mustard}; color: ${C.greenDeep}; display: flex; align-items: center; justify-content: center; font-weight: 700">A</div></div></div>` +
  `<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">` +
  kpi('Revenue this month', '₹12,480', 'From paid and delivered COD orders') +
  kpi('Orders this month', '38', '6 placed today') +
  kpi('Waiting to ship', '6', 'Oldest placed 2 days ago') +
  kpi('Low on stock', '3', 'Books with 4 or fewer copies') +
  `</div>` +
  `<div style="display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start">` +
  `<div class="card" style="overflow: hidden">` +
  `<div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px"><div class="serif" style="font-size: 24px">Recent orders</div>` +
  `<div style="display: flex; gap: 8px">${['All', 'Processing', 'Shipped', 'Delivered'].map((l, i) => `<div class="chip" style="height: 32px; font-size: 13px; ${i === 0 ? `background: ${C.green}; color: ${C.paper}; box-shadow: none` : ''}">${l}</div>`).join('')}</div></div>` +
  `<table><thead><tr>${th('Order')}${th('Customer')}${th('Placed')}${th('Items', 'right')}${th('Total', 'right')}${th('Payment')}${th('Status')}</tr></thead><tbody>` +
  ORDERS.map(([id, name, city, date, items, tot, pay, st]) =>
    `<tr>${td(`<span style="font-weight: 700">${id}</span>`)}${td(`<div style="font-weight: 600">${name}</div><div class="muted" style="font-size: 13px">${city}</div>`)}` +
    `${td(`<span style="font-size: 14px">${date}</span>`)}${td(items, 'right')}${td(`<span style="font-weight: 600">${inr(tot)}</span>`, 'right')}${td(payBadge(pay))}${td(statusSel(st))}</tr>`).join('') +
  `</tbody></table>` +
  `<div style="display: flex; justify-content: center; padding: 16px; font-weight: 600; color: ${C.green}">View all orders</div></div>` +
  `<div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 4px">` +
  `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px"><div class="serif" style="font-size: 24px">Low on stock</div><div style="font-size: 14px; font-weight: 600; color: ${C.green}">All books</div></div>` +
  ['pakistan', 'zero', 'power'].map((k, i) => {
    const b = BOOKS[k];
    return `<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; ${i ? `box-shadow: inset 0 1px 0 ${C.line}` : ''}">` +
      `<div style="width: 44px; height: 58px; flex-shrink: 0; border-radius: 4px; background: ${C.shelf}; padding: 5px"><img class="cover" src="${b.img}" alt="${esc(b.t)} cover" style="filter: none"></div>` +
      `<div style="flex: 1; min-width: 0"><div style="font-weight: 600; line-height: 1.3">${esc(b.t)}</div><div style="font-size: 13px; font-weight: 600; color: ${C.rust}">${b.s} left</div></div>` +
      `<div class="btn btn-ghost btn-sm" style="height: 32px">Restock</div></div>`;
  }).join('') +
  `</div></div></div></div>`
);

// ═════════════════════════════════════════════════════════════
// STYLE GUIDE
// ═════════════════════════════════════════════════════════════
const swatch = (name, hex, fg = C.ink, ring = false) =>
  `<div style="display: flex; flex-direction: column; gap: 10px"><div style="height: 96px; border-radius: 8px; background: ${hex}; ${ring ? `box-shadow: inset 0 0 0 1px ${C.line}` : ''}"></div>` +
  `<div><div style="font-weight: 700">${name}</div><div class="muted" style="font-size: 13px; font-family: ui-monospace, Consolas, monospace">${hex}</div></div></div>`;
files['StyleGuide.dc.html'] = doc(page(
  `<div style="padding: 56px 64px 72px; display: flex; flex-direction: column; gap: 56px">` +
  `<div style="display: flex; align-items: center; justify-content: space-between">${logo(false, 44)}<div class="muted">Brand system · v1</div></div>` +
  `<div><div class="eyebrow muted" style="margin-bottom: 18px">Colour</div>` +
  `<div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 16px">` +
  swatch('Forest', C.green) + swatch('Forest deep', C.greenDeep) + swatch('Mustard', C.mustard) + swatch('Paper', C.paper, C.ink, true) +
  swatch('Card', C.card, C.ink, true) + swatch('Shelf', C.shelf) + swatch('Ink', C.ink) + swatch('Rust', C.rust) +
  `</div></div>` +
  `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px">` +
  `<div style="display: flex; flex-direction: column; gap: 10px"><div class="eyebrow muted">Display · Anton</div><div class="display" style="font-size: 64px; color: ${C.green}">Old books,<br>new beginnings</div><div class="muted" style="font-size: 14px">Hero headlines and promo bands only. Always uppercase.</div></div>` +
  `<div style="display: flex; flex-direction: column; gap: 10px"><div class="eyebrow muted">Headings · Newsreader</div><div class="serif" style="font-size: 44px; line-height: 1.1">Fresh on the shelf</div><div class="book-title">The Psychology of Money</div><div class="muted" style="font-size: 14px">Page titles, section headings and book titles.</div></div>` +
  `<div style="display: flex; flex-direction: column; gap: 10px"><div class="eyebrow muted">Body · Figtree</div><div style="font-size: 17px">Hand-checked second-hand books for a fraction of the cover price.</div><div style="font-weight: 700">Free delivery above ₹499</div><div class="muted" style="font-size: 14px">UI text, prices, forms and tables.</div></div>` +
  `</div>` +
  `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; align-items: start">` +
  `<div style="display: flex; flex-direction: column; gap: 14px"><div class="eyebrow muted">Buttons</div>` +
  `<div style="display: flex; gap: 12px; flex-wrap: wrap"><div class="btn btn-primary">Add to cart</div><div class="btn btn-accent">Buy now</div><div class="btn btn-ghost">Check</div></div>` +
  `<div class="muted" style="font-size: 14px">Forest for the main action, mustard for the hero and “Buy now”, outline for secondary.</div></div>` +
  `<div style="display: flex; flex-direction: column; gap: 14px"><div class="eyebrow muted">Condition badges</div>` +
  `<div style="display: flex; gap: 10px">${badge('Like New')}${badge('Good')}${badge('Fair')}</div>` +
  `<div style="display: flex; align-items: baseline; gap: 8px"><span class="price">₹229</span><span class="mrp">₹399</span><span class="save">43% off</span></div>` +
  `<div class="muted" style="font-size: 14px">Every listing shows its grade and the saving against the new cover price.</div></div>` +
  `<div style="display: flex; flex-direction: column; gap: 14px"><div class="eyebrow muted">Inputs</div>` +
  `<div class="input placeholder">${ic('search', 18, C.muted)}Search by title, author or category</div>` +
  `<div style="display: flex; gap: 8px"><div class="chip">Self-Help</div><div class="chip" style="background: ${C.green}; color: ${C.paper}; box-shadow: none">₹150 – ₹250</div></div></div>` +
  `</div>` +
  `<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 28px"><div style="grid-column: span 5" class="eyebrow muted">Book card</div>` +
  bookCard('money') + bookCard('pakistan') + bookCard('ferrari') +
  `</div></div>`
));

// ── Write files + canvas.json ─────────────────────────────────
for (const [name, src] of Object.entries(files)) writeFileSync(name, src);

const row1 = 0, row2 = 3200;
const canvas = {
  artboards: [
    { file: 'Main.dc.html', title: 'Home · Desktop', x: 0, y: row1, w: 1440, h: 3000 },
    { file: 'HomeMobile.dc.html', title: 'Home · Mobile', x: 1560, y: row1, w: 390, h: 2860 },
    { file: 'Catalog.dc.html', title: 'Catalog', x: 2070, y: row1, w: 1440, h: 2100 },
    { file: 'BookDetail.dc.html', title: 'Book detail', x: 3630, y: row1, w: 1440, h: 2520 },
    { file: 'Cart.dc.html', title: 'Cart', x: 0, y: row2, w: 1440, h: 1500 },
    { file: 'Checkout.dc.html', title: 'Checkout', x: 1560, y: row2, w: 1440, h: 1200 },
    { file: 'SignIn.dc.html', title: 'Sign in', x: 3120, y: row2, w: 1440, h: 900 },
    { file: 'Admin.dc.html', title: 'Admin · Dashboard', x: 4680, y: row2, w: 1440, h: 1000 },
    { file: 'StyleGuide.dc.html', title: 'Style guide', x: 0, y: row2 + 1660, w: 1440, h: 1600 },
  ],
  annotations: [
    { id: 'brand-note', x: 0, y: -260, w: 520, text: 'Second Shelf, brand v1\nBuilt on the existing banner: forest green #2F4538 + mustard #F4B942 on warm paper.\nAnton (hero) · Newsreader (headings, titles) · Figtree (UI)\nPrices, stock, orders and revenue are sample data.' },
  ],
  launch: { view: 'canvas' },
};
writeFileSync('canvas.json', JSON.stringify(canvas, null, 2));
console.log('wrote', Object.keys(files).join(', '), '+ canvas.json');
