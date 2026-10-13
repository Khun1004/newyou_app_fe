/**
 * New You 앱 색깔 모음 (라이트 / 다크)
 *
 * 앱 전체의 포인트 색은 여기 한 곳에서 정해요.
 * 기본 색은 New You 로고에서 가져왔어요.
 *   초록 #3B5A24 (새싹, 성장)  ·  노랑 #F2B705 (햇살, 새로운 시작)
 *
 * 다크 모드
 *  - THEME.xxx 는 지금 모드(라이트/다크)에 맞는 색을 돌려줘요.
 *  - 화면 파일의 StyleSheet 색은 constants/themeBoot.ts 가 다크 모드일 때 자동으로 어둡게 바꿔요.
 *  - 모드 바꾸기는 components/contexts/ThemeContext.tsx (마이 페이지의 '화면 모드')
 */

export type Palette = {
    primary: string;
    primaryDark: string;
    primarySoft: string;
    primaryTint: string;
    accent: string;
    accentSoft: string;
    background: string;
    card: string;
    text: string;
    subText: string;
    line: string;
    icon: string;
    placeholder: string;
    headerGradient: [string, string];
    buttonGradient: [string, string];
};

export const LIGHT: Palette = {
    // 포인트 색 (버튼, 선택된 탭, 오늘 날짜 등)
    primary: '#4E7D32',
    primaryDark: '#3B5A24', // 로고 초록
    primarySoft: '#E8F2DE', // 연한 초록 (선택된 칩 배경 등)
    primaryTint: 'rgba(78, 125, 50, 0.06)', // 아주 연한 초록 (오늘 칸 배경 등)

    // 보조 색 (강조, D-day 등)
    accent: '#F2B705', // 로고 노랑
    accentSoft: '#FFF4CC',

    // 배경과 글자
    background: '#FBFAF4', // 따뜻한 아이보리
    card: '#FFFFFF',
    text: '#2E3326',
    subText: '#7C8070',
    line: '#E6E8DA',
    icon: '#A7AB98',
    placeholder: '#B9BCAA',

    // 그라데이션
    headerGradient: ['#FFF6D6', '#E8F2DE'], // 연한 노랑 → 연한 초록
    buttonGradient: ['#7BA84E', '#3B5A24'], // 초록 버튼
};

export const DARK: Palette = {
    primary: '#6FA34A',
    primaryDark: '#A9D38B', // 다크에서는 글자로 쓰일 때 잘 보이게 밝은 초록
    primarySoft: '#26321D',
    primaryTint: 'rgba(111, 163, 74, 0.10)',

    accent: '#F2B705',
    accentSoft: '#3A3216',

    background: '#121410',
    card: '#1C1F18',
    text: '#ECEEE4',
    subText: '#A3A894',
    line: '#2F3428',
    icon: '#8D9280',
    placeholder: '#6E7364',

    headerGradient: ['#1F2217', '#1A2415'],
    buttonGradient: ['#6FA34A', '#3B5A24'],
};

// ------------------------------------------------------------
// 지금 모드
// ------------------------------------------------------------
let darkNow = false;
export const isDark = () => darkNow;
export const setDarkNow = (v: boolean) => {
    darkNow = v;
};

// THEME.xxx → 지금 모드의 색 (화면을 그릴 때 읽으면 바로 바뀐 색이 나와요)
export const THEME: Palette = {} as Palette;
(Object.keys(LIGHT) as (keyof Palette)[]).forEach((key) => {
    Object.defineProperty(THEME, key, {
        enumerable: true,
        get: () => (darkNow ? DARK[key] : LIGHT[key]),
    });
});

// ------------------------------------------------------------
// 라이트 색 → 다크 색 바꾸기
//   kind: 'bg'   배경/테두리 → 밝은 색을 어둡게 (진한 색은 그대로)
//         'text' 글자/아이콘 → 진한 색을 밝게 (흰 글자는 그대로)
// ------------------------------------------------------------
type Kind = 'bg' | 'text';

// THEME 라이트 값 → 다크 값 (가장 먼저 확인해요)
const CURATED: Record<string, string> = {};
(Object.keys(LIGHT) as (keyof Palette)[]).forEach((k) => {
    const l = LIGHT[k];
    const d = DARK[k];
    if (typeof l === 'string' && typeof d === 'string') CURATED[l.toLowerCase()] = d;
});
// primaryDark 는 배경(버튼 그라데이션 끝)으로도 쓰여서 배경일 때는 그대로 둬요
const CURATED_BG_SKIP = new Set(['#3b5a24']);

const NAMED: Record<string, string> = { white: '#ffffff', black: '#000000' };

function parseHex(input: string): [number, number, number, number] | null {
    let h = input.trim().toLowerCase();
    if (NAMED[h]) h = NAMED[h];
    // rgb(…) / rgba(…) 도 읽어요 (예: rgba(255,255,255,0.9) — 반투명 흰 카드)
    const m = h.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
    if (m) return [+m[1], +m[2], +m[3], m[4] !== undefined ? Math.round(parseFloat(m[4]) * 255) : 255];
    if (!h.startsWith('#')) return null;
    h = h.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) : 255];
}

function rgbToHsl(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h / 6, s, l };
}

function hslToHex(h: number, s: number, l: number, a: number) {
    const f = (n: number) => {
        const k = (n + h * 12) % 12;
        const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(c * 255).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}${a < 255 ? a.toString(16).padStart(2, '0') : ''}`;
}

const cache = new Map<string, string>();

export function toDarkColor(color: string, kind: Kind = 'bg'): string {
    if (typeof color !== 'string') return color;
    const key = `${kind}|${color}`;
    const hit = cache.get(key);
    if (hit) return hit;

    let out = color;
    const lower = color.trim().toLowerCase();
    if (CURATED[lower] && !(kind === 'bg' && CURATED_BG_SKIP.has(lower))) {
        out = CURATED[lower];
    } else {
        const rgba = parseHex(color);
        if (rgba) {
            const [r, g, b, a] = rgba;
            const { h, s, l } = rgbToHsl(r, g, b);
            const vivid = s > 0.35 && l > 0.2 && l < 0.7; // 빨강/파랑/초록 같은 진한 색은 그대로
            if (!vivid) {
                if (kind === 'bg' && l >= 0.45) {
                    // 밝은 배경 → 어두운 배경 (흰색 → 거의 검정)
                    const nl = l >= 0.8 ? 0.07 + (1 - l) * 0.6 : 0.2 + (0.8 - l) * 0.3;
                    out = hslToHex(h, s * 0.45, nl, a);
                } else if (kind === 'text' && l <= 0.75) {
                    // 진한 글자 → 밝은 글자
                    const nl = l < 0.5 ? 0.96 - l * 0.7 : 1.1 - l;
                    out = hslToHex(h, s * 0.5, Math.min(0.97, nl), a);
                }
            }
        }
    }
    cache.set(key, out);
    return out;
}

// 화면에서 직접 쓰는 색 (JSX의 color="#333" 같은 곳) — 다크 모드면 바꿔서 돌려줘요
export const dc = <T = string>(color: T, kind: Kind = 'text'): T =>
    (darkNow && typeof color === 'string' ? (toDarkColor(color, kind) as any) : color);
// 배경용
export const dbg = <T = string>(color: T): T => dc(color, 'bg');
// 그라데이션 색 배열
export const dgrad = <T,>(colors: T): T =>
    (darkNow && Array.isArray(colors) ? (colors.map((c) => toDarkColor(c, 'bg')) as any) : colors);
