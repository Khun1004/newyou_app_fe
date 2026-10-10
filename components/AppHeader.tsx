import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

/**
 * 모든 화면에서 같이 쓰는 공통 헤더
 *
 *   [ <  ]        화면 제목        [ (추가 버튼들)  🔔 ]
 *
 * - 왼쪽  : 뒤로가기 (뒤로 갈 화면이 없으면 홈으로)
 * - 가운데: 화면 제목 (항상 정가운데)
 * - 오른쪽: 화면별 추가 버튼(right) + 알림 아이콘
 * - 휴대폰 상단(상태바·노치) 여백을 자동으로 처리합니다.
 *
 * 사용 예)
 *   <AppHeader title="생일" />
 *   <AppHeader title="채팅" right={[{ icon: 'create-outline', onPress: handleNewChat }]} />
 *   <AppHeader title="새 기념일" right={[{ label: '저장', onPress: save, disabled: saving }]} showBell={false} />
 *   <AppHeader title="알림" showBell={false} />
 *   <AppHeader title="알람 추가" variant="dark" />   // 어두운 화면용 (검은 배경, 흰 글씨)
 */
export type HeaderAction = {
    icon?: React.ComponentProps<typeof Ionicons>['name']; // 아이콘 버튼
    label?: string; // 글자 버튼 (예: '저장', '완료')
    onPress?: () => void;
    disabled?: boolean;
    color?: string; // 버튼 색 (기본: 헤더 글자색)
    accessibilityLabel?: string;
};

type Props = {
    title: string;
    subtitle?: string; // 제목 아래 작은 글씨 (예: 12 / 300 쪽)
    right?: HeaderAction[];
    left?: HeaderAction; // 왼쪽에 뒤로가기 대신 넣을 버튼 (예: 달력 아이콘)
    showBell?: boolean;
    showBack?: boolean;
    onBack?: () => void;
    backgroundColor?: string;
    variant?: 'light' | 'dark';
    hero?: boolean; // 탭 화면용: 로그인 화면처럼 위까지 이어지는 그라데이션 + 둥근 아래 모서리
};

/**
 * 로그인 화면 위쪽처럼 생긴 배경 (그라데이션 + 둥근 아래 모서리 + 동그란 장식)
 * 휴대폰 맨 위(상태바)부터 칠해져요. 홈 화면처럼 헤더 내용을 직접 만들 때도 써요.
 *
 *   <HeroBackground><View>...헤더 내용...</View></HeroBackground>
 */
export function HeroBackground({ children }: { children: React.ReactNode }) {
    const insets = useSafeAreaInsets();
    return (
        <LinearGradient
            colors={THEME.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top }]}
        >
            <View pointerEvents="none" style={[styles.heroBubble, { width: 150, height: 150, top: -50, right: -40 }]} />
            <View pointerEvents="none" style={[styles.heroBubble, { width: 80, height: 80, bottom: -30, left: -20 }]} />
            {children}
        </LinearGradient>
    );
}

export const HEADER_HEIGHT = 64; // 헤더 막대 높이 (숫자를 바꾸면 모든 화면 헤더 높이가 바뀌어요)
// ============================================================
// 헤더 배경 디자인 — 아래 HEADER_STYLE 한 줄만 바꾸면 모든 화면 헤더가 바뀌어요.
//   'sprout' : 새싹 (연한 초록 → 크림)   ← New You 로고 색
//   'sunrise': 햇살 (연한 노랑 → 연한 분홍)
//   'brand'  : 브랜드 그린 (진한 초록, 흰 글씨)
//   'newyou' : 로고 색 (연한 노랑 → 연한 초록)  ← 기본, 색은 constants/theme.ts 에서 바꿔요
// ============================================================
const HEADER_STYLE: keyof typeof LIGHT_STYLES = 'newyou';

const LIGHT_STYLES = {
    sprout: { colors: ['#E8F3DC', '#FFF7DD'], tint: '#2F4A1C', border: '#D9E7C8' },
    sunrise: { colors: ['#FFF3CF', '#FFE4EC'], tint: '#5A3B1E', border: '#F3E0C8' },
    brand: { colors: ['#3B5A24', '#6B8E3D'], tint: '#FFFFFF', border: '#2F4A1C' },
    newyou: { colors: THEME.headerGradient, tint: THEME.text, border: THEME.line },
} as const;

const THEMES = {
    light: {
        background: LIGHT_STYLES[HEADER_STYLE].colors[0] as string,
        gradient: LIGHT_STYLES[HEADER_STYLE].colors as unknown as [string, string],
        tint: LIGHT_STYLES[HEADER_STYLE].tint as string,
        border: LIGHT_STYLES[HEADER_STYLE].border as string,
    },
    dark: { background: '#000000', gradient: null, tint: '#FFFFFF', border: '#262626' },
};

export default function AppHeader({
                                      title,
                                      subtitle,
                                      right = [],
                                      left,
                                      showBell = true,
                                      showBack = true,
                                      onBack,
                                      backgroundColor,
                                      variant = 'light',
                                      hero = false,
                                  }: Props) {
    const theme = THEMES[variant];
    const tint = theme.tint;
    const insets = useSafeAreaInsets();

    // 오른쪽 버튼 개수에 맞춰 제목 양옆 여백을 계산 (제목이 버튼과 겹치지 않게)
    const rightWidth =
        right.reduce((w, a) => w + (a.label ? 16 + a.label.length * 16 : 40), 0) + (showBell ? 40 : 0);
    const sideWidth = 8 + Math.max(44, rightWidth, showBack || left ? 40 : 0);

    const handleBack = () => {
        if (onBack) return onBack();
        if (router.canGoBack()) router.back();
        else router.replace('/');
    };

    const wrapperStyle = [
        styles.wrapper,
        {
            paddingTop: insets.top,
            backgroundColor: backgroundColor ?? theme.background,
            borderBottomColor: theme.border,
        },
    ];
    // 배경색을 따로 주지 않은 밝은 헤더는 그라데이션 배경을 써요.
    const useGradient = !backgroundColor && theme.gradient;

    const bar = (
        <View style={styles.bar}>
            {/* 왼쪽: 뒤로가기 */}
            <View style={styles.side}>
                {left ? (
                    <TouchableOpacity
                        onPress={left.onPress}
                        disabled={left.disabled}
                        style={styles.iconButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={left.accessibilityLabel ?? left.label}
                    >
                        <Ionicons name={left.icon!} size={24} color={left.color ?? tint} />
                    </TouchableOpacity>
                ) : showBack && (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.iconButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="뒤로 가기"
                    >
                        <Ionicons name="chevron-back" size={26} color={tint} />
                    </TouchableOpacity>
                )}
            </View>

            {/* 가운데: 제목 (양쪽 버튼 개수와 상관없이 정가운데) */}
            <View style={[styles.titleContainer, { paddingHorizontal: sideWidth }]} pointerEvents="none">
                <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={[styles.subtitle, { color: tint }]} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {/* 오른쪽: 추가 버튼 + 알림 */}
            <View style={[styles.side, styles.rightSide]}>
                {right.map((action, i) => (
                    <TouchableOpacity
                        key={`${action.icon ?? action.label}-${i}`}
                        onPress={action.onPress}
                        disabled={action.disabled}
                        style={action.label ? styles.textButton : styles.iconButton}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        accessibilityLabel={action.accessibilityLabel ?? action.label}
                    >
                        {action.label ? (
                            <Text
                                style={[
                                    styles.textButtonLabel,
                                    { color: action.disabled ? '#9CA3AF' : action.color ?? tint },
                                ]}
                            >
                                {action.label}
                            </Text>
                        ) : (
                            <Ionicons
                                name={action.icon!}
                                size={24}
                                color={action.disabled ? '#9CA3AF' : action.color ?? tint}
                            />
                        )}
                    </TouchableOpacity>
                ))}
                {showBell && (
                    <TouchableOpacity
                        onPress={() => router.push('/Notification')}
                        style={styles.iconButton}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                        accessibilityLabel="알림"
                    >
                        <Ionicons name="notifications-outline" size={24} color={tint} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // 탭 화면: 로그인 화면처럼 위까지 이어지는 둥근 그라데이션
    if (hero && variant === 'light') {
        return <HeroBackground>{bar}</HeroBackground>;
    }

    // 그라데이션은 헤더 막대에만 칠하고, 맨 위 상태바(시간·배터리) 영역은 흰색으로 둬요.
    return useGradient ? (
        <View style={[styles.wrapperPlain, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={theme.gradient!}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientBar, { borderBottomColor: theme.border }]}
            >
                {bar}
            </LinearGradient>
        </View>
    ) : (
        <View style={wrapperStyle}>{bar}</View>
    );
}

const styles = StyleSheet.create({
    hero: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 6,
        overflow: 'hidden',
        zIndex: 10,
        shadowColor: '#7C8070',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    heroBubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.45)',
    },
    wrapper: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        zIndex: 10,
    },
    wrapperPlain: {
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    gradientBar: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    bar: {
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    side: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 44,
        zIndex: 1,
    },
    rightSide: {
        justifyContent: 'flex-end',
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textButton: {
        height: 40,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 1,
    },
});