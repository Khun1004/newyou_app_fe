// app/MyScreen.tsx - 완전히 업데이트된 버전
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useAlarms } from '@/components/contexts/AlarmContext';
import { useAnniversary } from '@/components/contexts/AnniversaryContext'; // 추가
import { usePlans } from '@/components/Plan/PlanContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { AUTH_URL, SERVER_IP } from '@/config';
import { THEME } from '@/constants/theme';

export default function MyScreen() {
    const { currentUser, logout, isAuthenticated } = useAuth();
    const { alarms } = useAlarms();
    const { anniversaries, loadAnniversaries } = useAnniversary(); // 추가
    const { plans } = usePlans();
    const [streakDays, setStreakDays] = useState(0);

    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // 기념일 데이터 로드
    useEffect(() => {
        loadAnniversaries();
    }, []);

    // 연속 사용일: 로그인한 사용자별로 앱을 연 날짜를 기록해서 계산
    useEffect(() => {
        if (!isAuthenticated || !currentUser?.phoneNumber) {
            setStreakDays(0);
            return;
        }
        const key = `streak_${currentUser.phoneNumber}`;
        const toDay = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const today = toDay(new Date());
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = toDay(yesterdayDate);

        (async () => {
            try {
                const saved = await AsyncStorage.getItem(key);
                const prev = saved ? JSON.parse(saved) : null; // { lastDate, count }
                let count = 1;
                if (prev?.lastDate === today) count = prev.count;
                else if (prev?.lastDate === yesterday) count = prev.count + 1;
                await AsyncStorage.setItem(key, JSON.stringify({ lastDate: today, count }));
                setStreakDays(count);
            } catch {
                setStreakDays(0);
            }
        })();
    }, [isAuthenticated, currentUser?.phoneNumber]);

    const getFullProfileImageUri = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const IMAGE_ROOT_URL = `http://${SERVER_IP}:8080`;
        const cleanedPath = path.startsWith('/') ? path : `/${path}`;
        return `${IMAGE_ROOT_URL}${cleanedPath}`;
    };

    const userInfo = {
        name: currentUser?.name || '사용자',
        phoneNumber: currentUser?.phoneNumber ?
            `${currentUser.phoneNumber.slice(0, 3)}-${currentUser.phoneNumber.slice(3, 7)}-${currentUser.phoneNumber.slice(7)}` :
            '전화번호 없음',
        memberSince: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ko-KR') : '가입일 없음',
        profileImage: getFullProfileImageUri(currentUser?.profileImage || null),
    };

    // 로그인하지 않았으면 모든 활동 숫자는 0으로 표시하고, 눌러도 이동하지 않아요.
    const statistics = [
        {
            id: '1',
            label: '내 계획',
            value: isAuthenticated ? plans.length.toString() : '0',
            icon: 'checkmark-circle',
            color: '#4ECDC4',
            onPress: isAuthenticated ? () => router.push('/Plan') : undefined,
        },
        {
            id: '2',
            label: '설정한 알람',
            value: isAuthenticated ? alarms.length.toString() : '0',
            icon: 'alarm',
            color: '#FF6B6B',
            onPress: isAuthenticated ? () => router.push('/AlarmList') : undefined,
        },
        {
            id: '3',
            label: '기념일 등록',
            value: isAuthenticated ? anniversaries.length.toString() : '0',
            icon: 'gift',
            color: '#9B59B6',
            onPress: isAuthenticated ? () => router.push('/AnniversaryList') : undefined,
        },
        {
            id: '4',
            label: '연속 사용일',
            value: `${isAuthenticated ? streakDays : 0}일`,
            icon: 'flame',
            color: '#FFA726',
            onPress: undefined as undefined | (() => void),
        },
    ];

    const menuSections = [
        {
            "title": "계정",
            "items": [
                { "id": "1", "title": "프로필 편집", "icon": "person-outline", "hasArrow": true, "onPress": () => router.push('/ProfileEdit') },
                { "id": "2", "title": "계정 설정", "icon": "settings-outline", "hasArrow": true },
                { "id": "3", "title": "배송지 관리", "icon": "location-outline", "hasArrow": true, "onPress": () => router.push('/AddressManagement')  }
            ]
        },
        {
            title: '결제 정보',
            items: [
                { id: '10', title: '결제 수단', icon: 'card-outline', hasArrow: true, onPress: () => router.push('/PaymentSubmit') },
                { id: '11', title: '결제 내역', icon: 'receipt-outline', hasArrow: true, onPress: () => router.push('/PaymentHistory') },
            ]
        },
        {
            title: '알림 설정',
            items: [
                { id: '4', title: '푸시 알림', icon: 'notifications-outline', hasSwitch: true, value: notifications, onToggle: setNotifications },
                { id: '5', title: '알림음', icon: 'volume-high-outline', hasSwitch: true, value: soundEnabled, onToggle: setSoundEnabled },
                { id: '6', title: '다크 모드', icon: 'moon-outline', hasSwitch: true, value: darkMode, onToggle: setDarkMode },
            ]
        },
        {
            title: '지원',
            items: [
                { id: '7', title: '도움말', icon: 'help-circle-outline', hasArrow: true },
                { id: '8', title: '문의하기', icon: 'mail-outline', hasArrow: true },
                { id: '9', title: '버전 정보', icon: 'information-circle-outline', hasArrow: true, subtitle: 'v1.2.0' },
            ]
        }
    ];

    const handleLogout = async () => {
        try {
            await logout(); // 로그아웃 후 홈 화면(둘러보기 상태)으로 이동합니다.
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    const renderMenuItem = (item: any) => {
        return (
            <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                disabled={!item.onPress && !item.hasSwitch}
            >
                <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name={item.icon as any} size={20} color={THEME.primary} />
                    </View>
                    <View style={styles.menuItemText}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        {item.subtitle && (
                            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                        )}
                    </View>
                </View>
                <View style={styles.menuItemRight}>
                    {item.hasSwitch ? (
                        <Switch
                            value={item.value as boolean}
                            onValueChange={item.onToggle}
                            trackColor={{ false: '#ECEDE3', true: THEME.primary }}
                            thumbColor={item.value ? '#fff' : '#f4f3f4'}
                        />
                    ) : item.hasArrow ? (
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 공통 헤더 (햇살 색) */}
            <AppHeader
                title="마이페이지"
                hero
                showBack={false}
                right={isAuthenticated ? [{ icon: 'create-outline', onPress: () => router.push('/ProfileEdit'), accessibilityLabel: '프로필 편집' }] : []}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 로그인하지 않은 상태: 로그인/회원가입 안내 카드 */}
                {!isAuthenticated ? (
                    <View style={styles.profileSection}>
                        <View style={styles.guestCard}>
                            <View style={styles.defaultProfileImage}>
                                <Ionicons name="person" size={40} color={THEME.primary} />
                            </View>
                            <Text style={styles.guestTitle}>로그인하고 New You를 시작해요</Text>
                            <Text style={styles.guestDescription}>노트, 알람, 계획, 생일 알림을 저장할 수 있어요.</Text>
                            <View style={styles.guestButtons}>
                                <TouchableOpacity style={styles.guestLoginButton} onPress={() => router.push('/login')}>
                                    <Text style={styles.guestLoginText}>로그인</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.guestSignupButton} onPress={() => router.push('/signup')}>
                                    <Text style={styles.guestSignupText}>회원가입</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.profileSection}>
                        <View style={styles.profileCard}>
                            <View style={styles.profileImageContainer}>
                                {userInfo.profileImage ? (
                                    <Image source={{ uri: userInfo.profileImage }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.defaultProfileImage}>
                                        <Ionicons name="person" size={40} color={THEME.primary} />
                                    </View>
                                )}
                                <TouchableOpacity style={styles.cameraButton} onPress={() => router.push('/ProfileEdit')}>
                                    <Ionicons name="camera" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.userName}>{userInfo.name}</Text>
                                <Text style={styles.userEmail}>{userInfo.phoneNumber}</Text>
                                <Text style={styles.memberSince}>가입일: {userInfo.memberSince}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.statisticsSection}>
                    <Text style={styles.sectionTitle}>내 활동</Text>
                    <View style={styles.statisticsGrid}>
                        {statistics.map((stat) => (
                            <TouchableOpacity
                                key={stat.id}
                                style={styles.statisticsCard}
                                onPress={stat.onPress}
                                disabled={!stat.onPress}
                            >
                                <View style={[styles.statisticsIcon, { backgroundColor: `${stat.color}15` }]}>
                                    <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                                </View>
                                <Text style={styles.statisticsValue}>{stat.value}</Text>
                                <Text style={styles.statisticsLabel}>{stat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {menuSections.map((section, index) => (
                    <View key={index} style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, itemIndex) => (
                                <View key={item.id}>
                                    {renderMenuItem(item)}
                                    {itemIndex < section.items.length - 1 && (
                                        <View style={styles.menuItemDivider} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {isAuthenticated && (
                    <View style={styles.logoutSection}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                            <Text style={styles.logoutText}>로그아웃</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    guestCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: THEME.line,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    guestTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.text,
        marginTop: 14,
        textAlign: 'center',
    },
    guestDescription: {
        fontSize: 14,
        color: THEME.subText,
        marginTop: 6,
        textAlign: 'center',
    },
    guestButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
        alignSelf: 'stretch',
    },
    guestLoginButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    guestLoginText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    guestSignupButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    guestSignupText: {
        color: THEME.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.text,
    },
    editButton: {
        padding: 5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    profileSection: {
        marginBottom: 24,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: THEME.line,
        borderRadius: 20,
        padding: 24,
        // ⭐️ 프로필 섹션 레이아웃 변경: 가로 정렬 ⭐️
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: THEME.subText,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    profileImageContainer: {
        position: 'relative',
        // ⭐️ 이미지와 정보 사이 간격 조정 ⭐️
        marginBottom: 0,
        marginRight: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    defaultProfileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: THEME.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: THEME.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        // ⭐️ 텍스트 정보 영역: 남은 공간 모두 사용 및 왼쪽 정렬 ⭐️
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: THEME.subText,
        marginBottom: 8,
    },
    memberSince: {
        fontSize: 14,
        color: THEME.icon,
    },
    statisticsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    statisticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statisticsCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: THEME.subText,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statisticsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: THEME.primarySoft, // Icon background color
        justifyContent: 'center',
        alignItems: 'center',
    },
    statisticsValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.text,
        marginBottom: 4,
    },
    statisticsLabel: {
        fontSize: 14,
        color: THEME.subText,
        textAlign: 'center',
    },
    menuSection: {
        marginBottom: 24,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 8,
        shadowColor: THEME.subText,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: THEME.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.text,
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 14,
        color: THEME.icon,
    },
    menuItemRight: {
        marginLeft: 8,
    },
    menuItemDivider: {
        height: 1,
        backgroundColor: THEME.line,
        marginLeft: 64,
        marginRight: 16,
    },
    logoutSection: {
        marginTop: 12,
        marginBottom: 40,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: THEME.primarySoft,
        shadowColor: THEME.subText,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
        marginLeft: 8,
    },
});