// YourReel.tsx
import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Platform,
} from 'react-native';
// expo-router에서 라우팅 및 파라미터 훅 임포트
import { useLocalSearchParams, router } from 'expo-router';
// 아이콘 라이브러리 임포트
import { Ionicons as Icon } from '@expo/vector-icons';
// expo-video 임포트
import { VideoView, useVideoPlayer } from 'expo-video';
// ReelContext 임포트 (deleteReel, toggleHideReel 함수 사용)
import { useReels } from '@/components/contexts/ReelContext'; // 경로는 프로젝트에 맞게 확인
import AppHeader from '@/components/AppHeader';

const { height } = Dimensions.get('window');

// 🚨 실제 프로젝트에서는 expo-constants에서 정확한 StatusBar.currentHeight를 가져와야 합니다.
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : 0;

const ResizeMode = {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch',
};

const YourReel = () => {
    // MyReels에서 전달받은 reelId 및 탭 정보
    const { reelId, tab } = useLocalSearchParams();
    // Context에서 필요한 데이터와 함수 가져오기
    const {
        allReels,
        deleteReel,
        toggleHideReel
    } = useReels();

    // ID를 기반으로 현재 릴 데이터 찾기
    const currentReel = allReels.find(r => String(r.id) === String(reelId));

    // ----------------------------------------------------
    // 비디오 플레이어 설정
    // ----------------------------------------------------
    const videoUrl = currentReel ? currentReel.videoUrl : '';
    const player = useVideoPlayer(videoUrl, (player) => {
        player.loop = true;
    });

    // ----------------------------------------------------
    // 안전한 뒤로 가기 로직
    // ----------------------------------------------------
    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            Alert.alert("알림", "더 이상 뒤로 갈 화면이 없습니다.");
        }
    };


    // ----------------------------------------------------
    // 릴 로드 및 에러 처리
    // ----------------------------------------------------
    useEffect(() => {
        if (!currentReel && reelId) {
            // 릴을 찾을 수 없을 경우 알림 후 안전하게 뒤로 가기 시도
            Alert.alert("알림", "해당 릴을 찾을 수 없거나 삭제되었습니다.", [
                { text: "확인", onPress: handleGoBack }
            ]);
        }
    }, [currentReel, reelId]);


    // ----------------------------------------------------
    // 비디오 자동 재생
    // ----------------------------------------------------
    useEffect(() => {
        if (player && currentReel) {
            player.play();
        }
    }, [player, currentReel]);

    // ----------------------------------------------------
    // 릴 삭제 기능
    // ----------------------------------------------------
    const handleDelete = () => {
        // 'posts', 'hidden' 탭에서 온 내 릴만 삭제 가능 (MOCK_USER_ID 가정)
        if (!currentReel || (tab !== 'posts' && tab !== 'hidden') || currentReel.creatorId !== 'user123') return;

        Alert.alert(
            "릴 삭제",
            "정말로 이 릴을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: () => {
                        deleteReel(currentReel.id);
                        // 삭제 후 이전 화면으로 돌아가기
                        handleGoBack();
                    }
                }
            ]
        );
    };

    // ----------------------------------------------------
    // 릴 숨김/숨김 해제 기능
    // ----------------------------------------------------
    const handleToggleHide = () => {
        // 'posts', 'hidden' 탭에서 온 내 릴만 숨김/숨김 해제 가능 (MOCK_USER_ID 가정)
        if (!currentReel || (tab !== 'posts' && tab !== 'hidden') || currentReel.creatorId !== 'user123') return;

        const action = currentReel.isHidden ? '해제' : '숨김';
        const message = currentReel.isHidden
            ? "이 릴을 프로필에 다시 표시하시겠습니까?"
            : "이 릴을 프로필에서 숨기시겠습니까? 릴은 삭제되지 않고 나만 볼 수 있습니다.";

        Alert.alert(
            `릴 ${action}`,
            message,
            [
                { text: "취소", style: "cancel" },
                {
                    text: action,
                    style: action === '숨김' ? "default" : "destructive",
                    onPress: () => {
                        toggleHideReel(currentReel.id);
                        Alert.alert("완료", `릴이 성공적으로 ${action} 처리되었습니다.`);
                        // 처리 후 이전 화면으로 돌아가기
                        handleGoBack();
                    }
                }
            ]
        );
    };

    if (!currentReel) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <AppHeader title="릴스" variant="dark" />
                <View style={[styles.container, styles.center]}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>릴 데이터를 로드하는 중이거나 찾을 수 없습니다.</Text>
                </View>
            </View>
        );
    }

    // 뱃지 표시를 위한 텍스트 및 아이콘 정의 함수
    const getStatusBadge = () => {
        if (tab === 'likes') {
            return { text: '좋아요한 릴', icon: 'heart' };
        } else if (tab === 'saved') {
            return { text: '저장된 릴', icon: 'bookmark' };
        } else if (tab === 'hidden') {
            return { text: '숨김 처리된 릴', icon: 'eye-off' };
        }
        return null;
    };

    const statusBadge = getStatusBadge();


    return (
        <View style={styles.container}>
            {/* 비디오 뷰: pointerEvents="none"으로 터치 이벤트를 무시하게 하여 하단 레이어 클릭 방지 */}
            {/* zIndex를 낮춰 다른 요소 아래에 위치하도록 함 */}
            <VideoView
                style={styles.video}
                player={player}
                contentFit={ResizeMode.COVER}
                pointerEvents="none"
            />

            {/* 공통 헤더: 영상 위에 투명하게 겹쳐서 표시 */}
            <View style={styles.headerOverlay}>
                <AppHeader title="릴스" variant="dark" backgroundColor="transparent" onBack={handleGoBack} />
            </View>

            {/* 오버레이 뷰 (제목 및 액션 버튼 포함) */}
            <View style={styles.overlay}>
                <Text style={styles.title}>{currentReel.title}</Text>

                {/* 좋아요/저장/숨김 상태 표시 로직 개선 */}
                {statusBadge && (
                    <View style={styles.statusBadge}>
                        <Icon name={statusBadge.icon} size={18} color="#fff" />
                        <Text style={styles.statusText}>
                            {statusBadge.text}
                        </Text>
                    </View>
                )}

                {/* 내 게시물 또는 숨김 탭에서 온 릴에만 관리 버튼 표시 */}
                {(tab === 'posts' || tab === 'hidden') && (
                    <View style={styles.actionButtons}>
                        {/* 숨김/숨김 해제 버튼 */}
                        <TouchableOpacity style={styles.actionButton} onPress={handleToggleHide}>
                            <Icon name={currentReel.isHidden ? "eye" : "eye-off"} size={24} color="#fff" />
                            <Text style={styles.actionText}>
                                {currentReel.isHidden ? '숨김 해제' : '릴 숨기기'}
                            </Text>
                        </TouchableOpacity>

                        {/* 삭제 버튼 */}
                        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                            <Icon name="trash" size={24} color="#ff4444" />
                            <Text style={[styles.actionText, { color: '#ff4444' }]}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    video: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        // zIndex를 낮춰 다른 요소(특히 헤더) 아래에 위치하도록 명시
        zIndex: -1,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT : 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // zIndex를 충분히 높게 설정 (100)하여 버튼 터치 영역 확보
        zIndex: 100,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginLeft: -40,
    },
    backButtonPlaceholder: {
        width: 40,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
        // zIndex를 높여 비디오 위에 위치하도록 설정
        zIndex: 10, // headerContainer(100)보다 낮지만 video(-1)보다 높음
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'flex-start',
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 10,
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    backButton: {
        padding: 5,
        width: 40,
        alignItems: 'center',
    }
});

export default YourReel;