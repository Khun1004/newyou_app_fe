/**
 * 다크 모드 준비 (앱이 켜질 때 가장 먼저 실행돼요 — index.js 에서 불러와요)
 *
 * 모든 화면의 StyleSheet.create 를 살짝 바꿔서,
 * 다크 모드일 때는 같은 스타일의 '어두운 버전'을 돌려주게 해요.
 *  - 배경/테두리: 밝은 색 → 어두운 색
 *  - 글자/아이콘: 진한 색 → 밝은 색
 *  - 그림자 색, 진한 포인트 색(초록 버튼, 빨강 등)은 그대로
 * 그래서 화면 파일을 하나하나 고치지 않아도 다크 모드가 돼요.
 */
import { StyleSheet } from 'react-native';
import { isDark, toDarkColor } from './theme';

const BG_KEYS = new Set([
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'borderStartColor',
    'borderEndColor',
    'overlayColor',
]);
const TEXT_KEYS = new Set(['color', 'tintColor', 'textDecorationColor']);

function darkifyStyle(style: any): any {
    if (!style || typeof style !== 'object' || Array.isArray(style)) return style;
    const out: any = {};
    for (const k of Object.keys(style)) {
        const v = style[k];
        if (typeof v === 'string' && BG_KEYS.has(k)) out[k] = toDarkColor(v, 'bg');
        else if (typeof v === 'string' && TEXT_KEYS.has(k)) out[k] = toDarkColor(v, 'text');
        else out[k] = v;
    }
    return out;
}

const g = globalThis as any;
if (!g.__newyouThemePatched) {
    g.__newyouThemePatched = true;
    const originalCreate = StyleSheet.create.bind(StyleSheet);

    (StyleSheet as any).create = (styles: Record<string, any>) => {
        const light = originalCreate(styles);
        let dark: any = null;
        const proxy: any = {};
        for (const key of Object.keys(light)) {
            Object.defineProperty(proxy, key, {
                enumerable: true,
                configurable: true,
                get() {
                    if (!isDark()) return (light as any)[key];
                    if (!dark) {
                        const d: any = {};
                        for (const k of Object.keys(styles)) d[k] = darkifyStyle(styles[k]);
                        dark = originalCreate(d);
                    }
                    return dark[key];
                },
            });
        }
        return proxy;
    };
}

export {};
