// Reels.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
// 컨텍스트 경로가 정확한지 확인하세요.
import { useReels } from '@/components/contexts/ReelContext';
// expo-video 임포트
import { useVideoPlayer, VideoView } from 'expo-video';

// ResizeMode를 VideoView의 정적 속성으로 가져옵니다.
const ResizeMode = {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch',
};

const { width } = Dimensions.get('window');

// topInset: 위쪽에 겹쳐 있는 헤더 높이 (그만큼 아래에 배지를 둬요)
const Reels = ({ initialReelId, onScrollFinished, topInset = 0 }: { initialReelId?: any; onScrollFinished?: any; topInset?: number }) => {
    // ReelContext에서 데이터 및 액션 함수를 가져옵니다.
    const { allReels, toggleLike, toggleSave } = useReels();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
    const [isPlaying, setIsPlaying] = useState(true); // 현재 활성화된 릴의 재생 상태

    const scrollViewRef = useRef(null);
    // 모든 비디오 플레이어 인스턴스를 저장하기 위한 참조
    const playerRefs = useRef({});

    const currentShort = allReels[currentIndex];

    // ----------------------------------------------------
    // 비디오 자동 재생/일시정지 로직
    // ----------------------------------------------------

    // 현재 인덱스의 비디오를 제어하는 핵심 로직
    const updatePlayback = useCallback((newIndex) => {
        allReels.forEach((short, index) => {
            const player = playerRefs.current[short.id];

            // ⚠️ 여기서 player가 undefined일 수 있으므로 null/undefined 체크 필수
            if (player) {
                // expo-video 플레이어 객체가 로드되었는지 확인하는 것이 좋습니다.
                // player.isLoaded는 useVideoPlayer 훅이 반환하는 객체의 속성이 아닙니다.
                // 하지만 player 객체 자체의 존재 여부로 충분히 체크합니다.

                if (index === newIndex) {
                    // 1. 현재 보이는 릴은 재생 시작
                    // ⚠️ player.play()는 player 객체가 완전히 초기화되었을 때만 작동합니다.
                    player.play();
                    setIsPlaying(true);
                } else {
                    // 2. 다른 릴은 일시 정지 및 처음으로 되돌리기
                    player.pause();
                    // ⚠️ seekTo 호출 전 로드 확인
                    // 이 부분이 undefined 에러를 일으킬 수 있습니다.
                    if (typeof player.seekTo === 'function') {
                        player.seekTo(0);
                    }
                }
            }
        });
    }, [allReels]);


    // 인덱스가 변경될 때마다 비디오 재생 상태 업데이트
    useEffect(() => {
        updatePlayback(currentIndex);

        // 컴포넌트 언마운트 시 현재 재생 중인 비디오를 일시 정지
        return () => {
            const player = playerRefs.current[allReels[currentIndex]?.id];
            if (player) {
                player.pause();
                // cleanup 시에는 seekTo를 호출하지 않아도 됩니다.
            }
        };
    }, [currentIndex, updatePlayback, allReels]);

    // ----------------------------------------------------
    // 스크롤 및 레이아웃 로직
    // ----------------------------------------------------

    // 초기 릴 위치 설정
    useEffect(() => {
        if (initialReelId && allReels.length > 0) {
            const initialIndex = allReels.findIndex(reel => String(reel.id) === String(initialReelId));

            if (initialIndex !== -1) {
                setCurrentIndex(initialIndex);
                // 렌더링 후 스크롤을 이동시키기 위해 setTimeout 사용
                if (scrollViewRef.current && containerHeight > 0) {
                    setTimeout(() => {
                        scrollViewRef.current.scrollTo({
                            y: initialIndex * containerHeight,
                            animated: false
                        });
                        if (onScrollFinished) {
                            onScrollFinished();
                        }
                    }, 100);
                }
            }
        }
    }, [initialReelId, allReels, containerHeight, onScrollFinished]);


    // 컨테이너 높이 측정 (스크롤 페이지네이션에 필요)
    const handleLayout = (event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0 && height !== containerHeight) {
            setContainerHeight(height);
        }
    };

    // 스크롤이 끝났을 때 현재 인덱스 업데이트
    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.y;
        if (containerHeight > 0) {
            // 가장 가까운 릴 인덱스를 계산
            const index = Math.round(scrollPosition / containerHeight);

            if (index !== currentIndex) {
                setCurrentIndex(index);
                // 재생 제어는 useEffect(currentIndex)가 담당
            }
        }
    };

    // ----------------------------------------------------
    // 사용자 액션 핸들러
    // ----------------------------------------------------

    // 재생/일시정지 버튼 클릭 핸들러
    const handleTogglePlayPause = () => {
        if (!currentShort) return;

        const player = playerRefs.current[currentShort.id];

        if (!player) return; // 플레이어 인스턴스가 없으면 리턴

        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleToggleLike = () => {
        if (currentShort) {
            toggleLike(currentShort.id);
        }
    };

    const handleToggleSave = () => {
        if (currentShort) {
            toggleSave(currentShort.id);
        }
    };

    if (allReels.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>릴스를 로드하는 중...</Text>
            </View>
        );
    }

    // ----------------------------------------------------
    // 렌더링
    // ----------------------------------------------------

    return (
        <View style={styles.container} onLayout={handleLayout}>
            <StatusBar barStyle="light-content" />

            {containerHeight > 0 && (
                <ScrollView
                    ref={scrollViewRef}
                    pagingEnabled // 페이지 단위 스크롤 활성화
                    showsVerticalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll} // 스크롤이 멈췄을 때만 인덱스 업데이트
                    // 스크롤 성능 향상을 위해 contentContainerStyle 제거 (필요 없음)
                    style={{ flex: 1 }}
                >
                    {allReels.map((short, index) => {

                        // 각 릴마다 useVideoPlayer를 호출하여 인스턴스 생성
                        // ⚠️ 주의: 렌더링 루프 내에서 훅을 호출하는 것은 React 규칙을 위반할 수 있지만,
                        // 이 패턴은 expo-video의 공식 예제에서 흔히 사용됩니다.
                        // 이 컴포넌트는 단일 페이지네이션 스크롤뷰이므로 인덱스가 변경될 때마다
                        // 새로운 훅 호출이 발생하는 것은 자연스럽습니다.
                        const player = useVideoPlayer(short.videoUrl, (player) => {
                            player.loop = true; // 비디오 반복 재생 설정
                        });

                        // useRef에 플레이어 인스턴스 저장
                        playerRefs.current[short.id] = player;

                        const isActive = index === currentIndex;

                        return (
                            <View
                                key={short.id}
                                style={[
                                    styles.videoContainer,
                                    { height: containerHeight } // 계산된 높이 적용
                                ]}
                            >
                                {/* 비디오 뷰 컴포넌트 */}
                                <VideoView
                                    style={styles.video}
                                    player={player}
                                    contentFit={ResizeMode.COVER}
                                    nativeControls={false}
                                />

                                {/* 위·아래 어둡게 (글자가 잘 보이게) */}
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.55)', 'transparent']}
                                    style={[styles.topShade, { height: topInset + 90 }]}
                                    pointerEvents="none"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.85)']}
                                    style={styles.bottomShade}
                                    pointerEvents="none"
                                />

                                {/* 화면 아무 곳이나 누르면 재생/일시정지 */}
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={StyleSheet.absoluteFill}
                                    onPress={handleTogglePlayPause}
                                    disabled={!isActive}
                                />

                                {/* 위쪽: 분류 배지 + 몇 번째인지 */}
                                <View style={[styles.topRow, { top: topInset + 10 }]} pointerEvents="none">
                                    <View style={styles.glassPill}>
                                        <Ionicons name="sparkles" size={12} color="#fff" />
                                        <Text style={styles.glassPillText}>
                                            {short.title ? short.title.split(' ')[0] : '릴스'}
                                        </Text>
                                    </View>
                                    <View style={styles.glassPill}>
                                        <Text style={styles.glassPillText}>
                                            {index + 1} / {allReels.length}
                                        </Text>
                                    </View>
                                </View>

                                {/* 가운데: 멈췄을 때만 재생 표시 */}
                                {isActive && !isPlaying && (
                                    <View style={styles.pausedIcon} pointerEvents="none">
                                        <Ionicons name="play" size={44} color="rgba(255,255,255,0.95)" />
                                    </View>
                                )}

                                {/* 오른쪽: 만든 사람 + 좋아요 · 저장 · 공유 */}
                                <View style={styles.actionColumn}>
                                    <View style={styles.creatorAvatarWrap}>
                                        <LinearGradient colors={['#A9C58A', THEME.primary]} style={styles.creatorAvatar}>
                                            <Text style={styles.creatorAvatarText}>
                                                {short.creatorId ? short.creatorId[0].toUpperCase() : 'U'}
                                            </Text>
                                        </LinearGradient>
                                        <View style={styles.followBadge}>
                                            <Ionicons name="add" size={12} color="#fff" />
                                        </View>
                                    </View>

                                    <TouchableOpacity onPress={handleToggleLike} style={styles.action} accessibilityLabel="좋아요">
                                        <Ionicons
                                            name={short.isLiked ? 'heart' : 'heart-outline'}
                                            size={32}
                                            color={short.isLiked ? '#FF4D6D' : '#fff'}
                                            style={styles.iconShadow}
                                        />
                                        <Text style={styles.actionText}>{short.likes}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleToggleSave} style={styles.action} accessibilityLabel="저장">
                                        <Ionicons
                                            name={short.isSaved ? 'bookmark' : 'bookmark-outline'}
                                            size={29}
                                            color={short.isSaved ? '#F2B705' : '#fff'}
                                            style={styles.iconShadow}
                                        />
                                        <Text style={styles.actionText}>{short.isSaved ? '저장됨' : '저장'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.action} accessibilityLabel="공유">
                                        <Ionicons name="paper-plane-outline" size={28} color="#fff" style={styles.iconShadow} />
                                        <Text style={styles.actionText}>공유</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 아래 왼쪽: 만든 사람 · 제목 · 소리 */}
                                <View style={styles.bottomInfo} pointerEvents="none">
                                    <Text style={styles.creatorName}>@{short.creatorId || 'user'}</Text>
                                    <Text style={styles.title} numberOfLines={2}>
                                        {short.title}
                                    </Text>
                                    <View style={styles.musicRow}>
                                        <Ionicons name="musical-notes" size={13} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.musicText} numberOfLines={1}>
                                            원본 오디오 · {short.creatorId || 'user'}
                                        </Text>
                                    </View>
                                </View>

                                {/* 맨 아래: 지금 몇 번째인지 얇은 막대 */}
                                <View style={styles.progressTrack} pointerEvents="none">
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${((index + 1) / Math.max(allReels.length, 1)) * 100}%` },
                                        ]}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
};

// ----------------------------------------------------
// 스타일 시트
// ----------------------------------------------------

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
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
    },
    videoContainer: {
        width: width,
        position: 'relative',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    topShade: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    bottomShade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '45%',
    },
    topRow: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    glassPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    glassPillText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    pausedIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 84,
        height: 84,
        marginLeft: -42,
        marginTop: -42,
        borderRadius: 42,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 6,
    },
    actionColumn: {
        position: 'absolute',
        right: 12,
        bottom: 70,
        alignItems: 'center',
        gap: 18,
    },
    creatorAvatarWrap: {
        marginBottom: 6,
        alignItems: 'center',
    },
    creatorAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    followBadge: {
        position: 'absolute',
        bottom: -8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: THEME.primary,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    action: {
        alignItems: 'center',
    },
    iconShadow: {
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 3,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bottomInfo: {
        position: 'absolute',
        left: 16,
        right: 86,
        bottom: 26,
    },
    creatorName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
    },
    title: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 14,
        lineHeight: 20,
    },
    musicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.14)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        maxWidth: '100%',
    },
    musicText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        marginLeft: 5,
    },
    progressTrack: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
    },
    progressFill: {
        height: 3,
        borderRadius: 2,
        backgroundColor: '#fff',
    },
});

export default Reels;