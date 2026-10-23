import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { THEME } from '@/constants/theme';

/**
 * New You 전용 아래 탭 바 (탭 바가 실제로 움푹 파인 모양)
 *
 *          ( 🏠 )
 *   ╭────╮_____╭────────────────────╮     ← 선택된 탭 자리만 탭 바가 둥글게 파이고,
 *   │          📅     💬     ♡     👤│        그 안에 초록 동그라미가 들어가 있어요.
 *   ╰─────────────────────────────────╯
 *
 * - 다른 탭을 누르면 파인 자리가 그 탭으로 옮겨 가고, 초록 동그라미가 '톡' 튀어나와요.
 * - 아이콘과 순서는 아래 TAB_INFO 에서 바꿔요.
 */

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// 탭 이름(파일 이름) → 아이콘
const TAB_INFO: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
    timetable: { label: '시간표', icon: 'calendar-clear-outline', iconActive: 'calendar-clear' },
    board: { label: '게시판', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
    index: { label: '홈', icon: 'home-outline', iconActive: 'home' },
    anniversary: { label: '기념일', icon: 'heart-outline', iconActive: 'heart' },
    my: { label: '마이', icon: 'person-outline', iconActive: 'person' },
};

// ---------------- 모양 설정 ----------------
const BAR_HEIGHT = 68; // 탭 바 높이
const CORNER = 20; // 탭 바 모서리 둥글기
const SIDE_PADDING = 30; // 탭 바 안쪽 좌우 여백 (파인 자리가 모서리에 걸리지 않게)
const CIRCLE = 50; // 초록 동그라미 크기
const GAP = 6; // 동그라미와 파인 자리 사이 간격
const CENTER_Y = 12; // 동그라미 중심이 탭 바 윗선에서 얼마나 아래에 있는지
const SHOULDER = 9; // 파인 자리 양옆의 부드러운 어깨 폭

const NOTCH_R = CIRCLE / 2 + GAP;

// 탭 바 모양 (위쪽 가운데가 cx 위치에서 둥글게 파인 둥근 사각형)
function barPath(width: number, cx: number) {
    const W = width;
    const H = BAR_HEIGHT;
    const R = CORNER;
    const left = Math.max(R + 0.5, cx - NOTCH_R - SHOULDER);
    const right = Math.min(W - R - 0.5, cx + NOTCH_R + SHOULDER);
    const y = CENTER_Y;
    return [
        `M ${R} 0`,
        `L ${left} 0`,
        // 왼쪽 어깨 → 아래로 둥글게 파인 부분 → 오른쪽 어깨
        `Q ${cx - NOTCH_R} 0 ${cx - NOTCH_R + 1} ${y}`,
        `A ${NOTCH_R} ${NOTCH_R} 0 0 0 ${cx + NOTCH_R - 1} ${y}`,
        `Q ${cx + NOTCH_R} 0 ${right} 0`,
        `L ${W - R} 0`,
        `A ${R} ${R} 0 0 1 ${W} ${R}`,
        `L ${W} ${H - R}`,
        `A ${R} ${R} 0 0 1 ${W - R} ${H}`,
        `L ${R} ${H}`,
        `A ${R} ${R} 0 0 1 0 ${H - R}`,
        `L 0 ${R}`,
        `A ${R} ${R} 0 0 1 ${R} 0`,
        'Z',
    ].join(' ');
}

export default function NewYouTabBar({ state, navigation, insets }: BottomTabBarProps) {
    const bottom = Math.max(insets.bottom, 10);
    const routes = state.routes.filter((r) => TAB_INFO[r.name]);
    const activeIndex = Math.max(0, routes.findIndex((r) => r.key === state.routes[state.index]?.key));

    const [barWidth, setBarWidth] = useState(0);
    const tabWidth = (barWidth - SIDE_PADDING * 2) / Math.max(routes.length, 1);
    const centerOf = (i: number) => SIDE_PADDING + tabWidth * i + tabWidth / 2;

    // 파인 자리는 선택된 탭으로 바로 옮기고, 초록 동그라미만 '톡' 튀어나오게 해요.
    // (미끄러지는 애니메이션은 화면이 무거울 때 중간에 멈춘 것처럼 보여서 뺐어요)
    const notchX = activeIndex;
    const pop = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        pop.setValue(0.6);
        Animated.spring(pop, {
            toValue: 1,
            friction: 5,
            tension: 140,
            useNativeDriver: true,
        }).start();
    }, [activeIndex]);

    const cx = barWidth > 0 ? centerOf(notchX) : 0;
    const activeInfo = TAB_INFO[routes[activeIndex]?.name] ?? TAB_INFO.index;

    return (
        <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: bottom }]}>
            <View style={styles.barArea} onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}>
                {/* 탭 바 배경 (파인 모양) */}
                {barWidth > 0 && (
                    <Svg width={barWidth} height={BAR_HEIGHT} style={styles.svg} pointerEvents="none">
                        <Path d={barPath(barWidth, cx)} fill="#FFFFFF" stroke={THEME.line} strokeWidth={1} />
                    </Svg>
                )}

                {/* 파인 자리 안의 초록 동그라미 */}
                {barWidth > 0 && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.circle,
                            { left: cx - CIRCLE / 2, top: CENTER_Y - CIRCLE / 2, transform: [{ scale: pop }] },
                        ]}
                    >
                        <Ionicons name={activeInfo.iconActive} size={23} color="#FFFFFF" />
                    </Animated.View>
                )}

                {/* 탭 버튼들 */}
                <View style={styles.row}>
                    {routes.map((route, i) => {
                        const info = TAB_INFO[route.name];
                        const focused = i === activeIndex;

                        const onPress = () => {
                            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                            if (!focused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                                activeOpacity={0.7}
                                style={styles.item}
                                accessibilityRole="button"
                                accessibilityState={{ selected: focused }}
                                accessibilityLabel={info.label}
                            >
                                {/* 선택된 탭의 아이콘은 초록 동그라미 안에 있어서 여기서는 빈칸으로 둬요 */}
                                <View style={styles.iconSlot}>
                                    {!focused && <Ionicons name={info.icon} size={23} color={THEME.text} style={{ opacity: 0.7 }} />}
                                </View>
                                <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                                    {info.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 14,
    },
    barArea: {
        height: BAR_HEIGHT,
        // 그림자 (iPhone은 파인 모양을 따라 그림자가 생겨요)
        ...Platform.select({
            android: {},
            default: {
                shadowColor: '#4B5A3A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
            },
        }),
    },
    svg: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: SIDE_PADDING,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 9,
    },
    iconSlot: {
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 3,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: THEME.subText,
    },
    labelActive: {
        color: THEME.primaryDark,
        fontWeight: '800',
    },
    circle: {
        position: 'absolute',
        width: CIRCLE,
        height: CIRCLE,
        borderRadius: CIRCLE / 2,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: THEME.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});