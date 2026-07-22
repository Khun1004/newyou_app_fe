import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Animated, StyleSheet } from 'react-native';
import 'react-native-get-random-values';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 스타일 1: 플로팅 하트 스타일 (기존 코드 유지)
function HeartTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
    const scale = React.useRef(new Animated.Value(focused ? 1 : 0.85)).current;
    const heartScale = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1 : 0.85,
            useNativeDriver: true,
            friction: 5,
            tension: 40,
        }).start();

        Animated.spring(heartScale, {
            toValue: focused ? 1 : 0,
            useNativeDriver: true,
            friction: 4,
            tension: 30,
        }).start();
    }, [focused]);

    return (
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            {/* 큰 하트 배경 */}
            <Animated.View style={{
                transform: [{ scale: heartScale }],
                position: 'absolute',
                top: -16,
            }}>
                <IconSymbol
                    size={60}
                    name="heart.fill"
                    color={color}
                    style={{ opacity: 0.12 }}
                />
            </Animated.View>

            {/* 중간 하트 배경 */}
            <Animated.View style={{
                transform: [{ scale: heartScale }],
                position: 'absolute',
                top: -12,
            }}>
                <IconSymbol
                    size={50}
                    name="heart.fill"
                    color={color}
                    style={{ opacity: 0.2 }}
                />
            </Animated.View>

            {/* 메인 아이콘 */}
            <IconSymbol
                size={focused ? 26 : 24}
                name={name}
                color={color}
            />
        </Animated.View>
    );
}

// 나머지 Icon 컴포넌트들 (LineTabIcon, GlassTabIcon, BounceTabIcon)은 생략합니다.

const TAB_BAR_HEIGHT = 70; // 탭 바의 높이 (iOS Safe Area 제외)

// **중앙 정렬 및 둥근 배경을 위한 컴포넌트**
function FloatingTabBarBackground() {
    const { bottom } = useSafeAreaInsets();

    return (
        <View style={styles.tabBarContainerWrapper}>
            <View style={[styles.tabBarContainer, { paddingBottom: bottom }]}>
                {/* 탭 바의 둥근 배경 */}
                <View style={[styles.roundedBackground, { height: TAB_BAR_HEIGHT }]} />
            </View>
        </View>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const tintColor = colorScheme === 'dark' ? '#FF69B4' : '#FF1493';
    const { bottom } = useSafeAreaInsets(); // Safe Area Insets 가져오기

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: tintColor,
                headerShown: false,
                tabBarButton: HapticTab,

                // 탭 바 배경을 커스텀 컴포넌트로 설정
                tabBarBackground: () => <FloatingTabBarBackground />,

                tabBarStyle: [
                    styles.floatingBar, // 탭 바를 플로팅 스타일로 설정
                    {
                        // 아이콘이 둥근 배경 내에서 중앙 정렬되도록 조정
                        height: TAB_BAR_HEIGHT + bottom,
                        paddingBottom: bottom + 5, // 하단 Safe Area 및 여백 조정
                        paddingTop: 5, // 상단 여백 조정
                        // **아이콘 배치를 위한 좌우 내부 패딩 추가 및 조정**
                        paddingHorizontal: 20,
                    }
                ],

                // 기존의 labelStyle 유지
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarInactiveTintColor: colorScheme === 'dark' ? '#666' : '#AAAAAA',
            }}>
            <Tabs.Screen
                name="timetable"
                options={{
                    title: 'Timetable',
                    tabBarIcon: ({ color, focused }) => (
                        <HeartTabIcon name="calendar" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="board"
                options={{
                    title: 'Board',
                    tabBarIcon: ({ color, focused }) => (
                        <HeartTabIcon name="note.text" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <HeartTabIcon name="house.fill" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="anniversary"
                options={{
                    title: 'Anniversary',
                    tabBarIcon: ({ color, focused }) => (
                        <HeartTabIcon name="heart.fill" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my"
                options={{
                    title: 'My',
                    tabBarIcon: ({ color, focused }) => (
                        <HeartTabIcon name="person.fill" color={color} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

// **탭 바 스타일 시트**
const styles = StyleSheet.create({
    // 탭 바 자체의 스타일: 중앙 정렬 및 투명 배경
    floatingBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
    },
    // FloatingTabBarBackground가 렌더링되는 전체 컨테이너
    tabBarContainerWrapper: {
        flex: 1,
    },
    // 둥근 배경을 배치할 중앙 컨테이너
    tabBarContainer: {
        position: 'absolute',
        bottom: 0, // 아래에 붙임
        left: 0,
        right: 0,
        alignItems: 'center', // 중앙 정렬
    },
    // 실제 둥근 모서리 배경
    roundedBackground: {
        width: '94%', // 가로폭 조절 (가운데에 띄우기 위해)
        maxWidth: 500, // 최대 너비 제한 (선택 사항)
        // **배경색을 'rgba(255, 255, 255, 0.9)'로 변경하고 싶으시면 이 부분을 수정하세요.**
        backgroundColor: 'white',
        borderRadius: 25, // 둥근 모서리
        // 그림자 효과 (선택 사항)
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 10,
            },
        }),
    },
});