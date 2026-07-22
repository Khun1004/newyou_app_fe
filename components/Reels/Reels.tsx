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

const Reels = ({ initialReelId, onScrollFinished }) => {
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
                                />

                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                                    style={styles.gradient}
                                />

                                {/* ----------------------- 헤더 (상단) ----------------------- */}
                                <View style={styles.header}>
                                    <View style={styles.headerContent}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>
                                                {short.title ? short.title.split(' ')[0] : '릴스'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* ----------------------- 재생/일시정지 버튼 (중앙) ----------------------- */}
                                <TouchableOpacity
                                    style={[
                                        styles.playButton,
                                        // 현재 활성화된 릴이고 재생 중일 때만 버튼을 숨김 (isPlaying이 false일 때 보임)
                                        (isActive && isPlaying) && { opacity: 0 }
                                    ]}
                                    onPress={handleTogglePlayPause}
                                    disabled={!isActive} // 현재 릴이 아니면 비활성화
                                >
                                    <View style={styles.playButtonCircle}>
                                        <Text style={styles.playIcon}>
                                            {isPlaying ? '⏸' : '▶'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* ----------------------- 액션 버튼 (우측) ----------------------- */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity onPress={handleToggleLike} style={styles.actionButton}>
                                        <View style={[
                                            styles.actionCircle,
                                            short.isLiked && styles.likedCircle
                                        ]}>
                                            <Text style={styles.actionIcon}>
                                                {short.isLiked ? '❤️' : '🤍'}
                                            </Text>
                                        </View>
                                        <Text style={styles.actionText}>{short.likes}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleToggleSave} style={styles.actionButton}>
                                        <View style={[
                                            styles.actionCircle,
                                            short.isSaved && styles.savedCircle
                                        ]}>
                                            <Text style={styles.actionIcon}>
                                                {short.isSaved ? '📌' : '📑'}
                                            </Text>
                                        </View>
                                        <Text style={styles.actionText}>저장</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionButton}>
                                        <View style={styles.actionCircle}>
                                            <Text style={styles.actionIcon}>🔗</Text>
                                        </View>
                                        <Text style={styles.actionText}>공유</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ----------------------- 하단 정보 (좌측) ----------------------- */}
                                <View style={styles.bottomInfo}>
                                    <View style={styles.creatorInfo}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {short.creatorId ? short.creatorId[0].toUpperCase() : 'U'}
                                            </Text>
                                        </View>
                                        <Text style={styles.creatorName}>{short.creatorId || 'User'}</Text>
                                    </View>

                                    <Text style={styles.title}>{short.title}</Text>

                                    {/* ----------------------- 페이지 표시기 (하단 중앙) ----------------------- */}
                                    <View style={styles.progressContainer}>
                                        {allReels.map((_, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.dotIndicator,
                                                    idx === currentIndex && styles.dotIndicatorActive
                                                ]}
                                            />
                                        ))}
                                    </View>
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
        color: '#fff',
        marginTop: 10,
    },
    videoContainer: {
        width: width,
        position: 'relative',
    },
    // VideoView 스타일 (컨테이너에 꽉 차게)
    video: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
    },
    header: {
        position: 'absolute',
        top: 40, // StatusBar를 고려하여 조정
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    categoryText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -35 }, { translateY: -35 }],
        zIndex: 10,
    },
    playButtonCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        fontSize: 30,
        color: '#fff',
    },
    actionButtons: {
        position: 'absolute',
        right: 16,
        bottom: 120, // 하단 정보와 겹치지 않도록 조정
        gap: 20,
        zIndex: 5,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionCircle: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    likedCircle: {
        backgroundColor: '#FF4141', // 좋아요 시 색상 변경
    },
    savedCircle: {
        backgroundColor: '#FFC107', // 저장 시 색상 변경
    },
    actionIcon: {
        fontSize: 26,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 80,
        zIndex: 5,
    },
    creatorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4C4A4C',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    creatorName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
    },
    dotIndicator: {
        width: 6,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 3,
    },
    dotIndicatorActive: {
        backgroundColor: '#fff',
        width: 10,
        borderRadius: 5,
    },
});

export default Reels;