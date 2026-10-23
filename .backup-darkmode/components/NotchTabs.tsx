import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';

/**
 * 화면 안에서 쓰는 작은 탭 바 (아래 메인 탭 바와 같은 '움푹 파인' 디자인)
 *
 *   <NotchTabs
 *       items={[
 *           { key: 'chat', label: '채팅', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
 *           { key: 'reels', label: '릴스', icon: 'play-circle-outline', iconActive: 'play-circle' },
 *       ]}
 *       active={mode}
 *       onChange={setMode}
 *   />
 */

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type NotchTabItem = { key: string; label: string; icon: IconName; iconActive: IconName };

export const NOTCH_TABS_HEIGHT = 68; // 화면 내용이 가려지지 않게 아래 여백을 줄 때 써요

const BAR_HEIGHT = NOTCH_TABS_HEIGHT;
const CORNER = 20;
const SIDE_PADDING = 24;
const CIRCLE = 50;
const GAP = 6;
const CENTER_Y = 12;
const SHOULDER = 9;
const NOTCH_R = CIRCLE / 2 + GAP;

function barPath(W: number, cx: number) {
    const H = BAR_HEIGHT;
    const R = CORNER;
    const left = Math.max(R + 0.5, cx - NOTCH_R - SHOULDER);
    const right = Math.min(W - R - 0.5, cx + NOTCH_R + SHOULDER);
    const y = CENTER_Y;
    return [
        `M ${R} 0`,
        `L ${left} 0`,
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

export default function NotchTabs({
                                      items,
                                      active,
                                      onChange,
                                  }: {
    items: NotchTabItem[];
    active: string;
    onChange: (key: string) => void;
}) {
    const insets = useSafeAreaInsets();
    const bottom = Math.max(insets.bottom, 10);
    const activeIndex = Math.max(0, items.findIndex((i) => i.key === active));

    const [barWidth, setBarWidth] = useState(0);
    const tabWidth = (barWidth - SIDE_PADDING * 2) / Math.max(items.length, 1);
    const cx = barWidth > 0 ? SIDE_PADDING + tabWidth * activeIndex + tabWidth / 2 : 0;

    // 초록 동그라미가 '톡' 튀어나오는 움직임
    const pop = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        pop.setValue(0.6);
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
    }, [activeIndex]);

    const activeItem = items[activeIndex];

    return (
        <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: bottom }]}>
            <View style={styles.barArea} onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}>
                {barWidth > 0 && (
                    <Svg width={barWidth} height={BAR_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Path d={barPath(barWidth, cx)} fill="#FFFFFF" stroke={THEME.line} strokeWidth={1} />
                    </Svg>
                )}

                {barWidth > 0 && activeItem && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.circle,
                            { left: cx - CIRCLE / 2, top: CENTER_Y - CIRCLE / 2, transform: [{ scale: pop }] },
                        ]}
                    >
                        <Ionicons name={activeItem.iconActive} size={23} color="#FFFFFF" />
                    </Animated.View>
                )}

                <View style={styles.row}>
                    {items.map((item, i) => {
                        const focused = i === activeIndex;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={styles.item}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityState={{ selected: focused }}
                                accessibilityLabel={item.label}
                                onPress={() => {
                                    if (focused) return;
                                    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onChange(item.key);
                                }}
                            >
                                <View style={styles.iconSlot}>
                                    {!focused && <Ionicons name={item.icon} size={23} color={THEME.text} style={{ opacity: 0.7 }} />}
                                </View>
                                <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
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
        paddingHorizontal: 64, // 탭이 2개라서 메인 탭 바보다 좁게
    },
    barArea: {
        height: BAR_HEIGHT,
        ...Platform.select({
            android: {},
            default: {
                shadowColor: '#4B5A3A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.14,
                shadowRadius: 12,
            },
        }),
    },
    row: { flex: 1, flexDirection: 'row', paddingHorizontal: SIDE_PADDING },
    item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 9 },
    iconSlot: { height: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
    label: { fontSize: 11, fontWeight: '600', color: THEME.subText },
    labelActive: { color: THEME.primaryDark, fontWeight: '800' },
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