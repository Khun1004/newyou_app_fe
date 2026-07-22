// 파일명: app/AnniversaryEditBackground.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Image,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAnniversary } from '@/components/contexts/AnniversaryContext';
import { Ionicons } from '@expo/vector-icons';

type RelationshipType = 'married' | 'relationship' | 'friendship';

interface BackgroundOption {
    id: string;
    name: string;
    colors?: string[];
    imageUri?: string;
    type: 'basic' | 'relationship' | 'married' | 'friendship' | 'custom' | 'photo';
}

const defaultBackgrounds: BackgroundOption[] = [
    { id: 'basic1', name: '클래식 블랙', colors: ['#000000', '#1a1a1a', '#333333'], type: 'basic' },
    { id: 'basic2', name: '딥 블랙', colors: ['#0c0c0c', '#1e1e1e', '#2d2d2d'], type: 'basic' },
    { id: 'basic3', name: '미드나이트 블랙', colors: ['#000000', '#191970', '#2f2f4f'], type: 'basic' },
    { id: 'relationship1', name: '로맨틱 핑크', colors: ['#FF6B9D', '#C44569', '#8B1538'], type: 'relationship' },
    { id: 'relationship2', name: '따뜻한 레드', colors: ['#FF416C', '#FF4B2B', '#D63031'], type: 'relationship' },
    { id: 'married1', name: '골든 선셋', colors: ['#FFD700', '#FFA500', '#FF6347'], type: 'married' },
    { id: 'married2', name: '로얄 골드', colors: ['#F7971E', '#FFD200', '#FF8C00'], type: 'married' },
    { id: 'friendship1', name: '퍼플 드림', colors: ['#6C5CE7', '#5F3DC4', '#4C2882'], type: 'friendship' },
    { id: 'friendship2', name: '오션 블루', colors: ['#0984e3', '#74b9ff', '#00cec9'], type: 'friendship' },
    { id: 'custom1', name: '트로피컬', colors: ['#00d2ff', '#3a7bd5', '#2980b9'], type: 'custom' },
    { id: 'custom2', name: '네이처 그린', colors: ['#11998e', '#38ef7d', '#00bf63'], type: 'custom' },
    { id: 'custom3', name: '미스틱 퍼플', colors: ['#667eea', '#764ba2', '#f093fb'], type: 'custom' },
];

export default function AnniversaryEditBackground() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();

    const { anniversaries, updateAnniversaryBackground } = useAnniversary();

    // 🔥 기본 기념일 찾기 (id가 없으면 기본 기념일 사용)
    const currentAnniversary = params.id
        ? anniversaries.find(a => a.id === params.id)
        : anniversaries.find(a => a.isDefault);

    const [backgrounds, setBackgrounds] = useState<BackgroundOption[]>(defaultBackgrounds);
    const [selectedBg, setSelectedBg] = useState<BackgroundOption>(defaultBackgrounds[0]);
    // AnniversaryEdit과 동일한 celebrationMessage 필드에 연결됩니다.
    const [message, setMessage] = useState('함께한 소중한 시간을 축하해요!');

    useEffect(() => {
        if (!currentAnniversary) return;

        setMessage(currentAnniversary.celebrationMessage || '함께한 소중한 시간을 축하해요!'); // ✅ 메시지 로드

        if (currentAnniversary.backgroundImageUri) {
            const photoBg: BackgroundOption = {
                id: `photo_${Date.now()}`,
                name: '내 사진',
                imageUri: currentAnniversary.backgroundImageUri,
                type: 'photo',
            };
            setBackgrounds(prev => [...prev.filter(b => b.type !== 'photo'), photoBg]);
            setSelectedBg(photoBg);
        } else if (currentAnniversary.backgroundColors) {
            const found = backgrounds.find(b =>
                b.colors?.join() === currentAnniversary.backgroundColors?.join()
            );
            if (found) setSelectedBg(found);
        }
    }, [currentAnniversary]);

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
            }
        })();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            const uri = result.assets[0].uri;
            const newBg: BackgroundOption = {
                id: `photo_${Date.now()}`,
                name: '내 사진',
                imageUri: uri,
                type: 'photo',
            };

            setBackgrounds(prev => [...prev.filter(b => b.type !== 'photo'), newBg]);
            setSelectedBg(newBg);
        }
    };

    const handleSave = async () => {
        if (!currentAnniversary) {
            Alert.alert('오류', '편집할 기념일을 찾을 수 없습니다.');
            return;
        }

        try {
            // ✅ updateAnniversaryBackground를 통해 celebrationMessage를 업데이트하여 AnniversaryEdit과 연결
            await updateAnniversaryBackground(currentAnniversary.id, {
                backgroundColors: selectedBg.colors,
                backgroundImageUri: selectedBg.imageUri,
                celebrationMessage: message.trim() || '함께한 소중한 시간을 축하해요!',
            });

            Alert.alert('저장 완료', '배경과 메시지가 적용되었습니다.', [
                { text: '확인', onPress: () => router.back() },
            ]);
        } catch (err) {
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        }
    };

    const renderPreview = () => {
        if (selectedBg.imageUri) {
            return (
                <ImageBackground source={{ uri: selectedBg.imageUri }} style={styles.preview} imageStyle={{ borderRadius: 16 }}>
                    <View style={styles.overlay}>
                        <Text style={styles.emoji}>❤️</Text>
                        <Text style={styles.previewText}>{message || '축하 메시지'}</Text>
                    </View>
                </ImageBackground>
            );
        }

        return (
            <LinearGradient colors={selectedBg.colors || ['#000']} style={styles.preview}>
                <Text style={styles.emoji}>❤️</Text>
                <Text style={styles.previewText}>{message || '축하 메시지'}</Text>
            </LinearGradient>
        );
    };

    const renderBgOption = (bg: BackgroundOption) => (
        <TouchableOpacity
            key={bg.id}
            style={[styles.option, selectedBg.id === bg.id && styles.selected]}
            onPress={() => setSelectedBg(bg)}
        >
            {bg.imageUri ? (
                <Image source={{ uri: bg.imageUri }} style={styles.thumb} resizeMode="cover" />
            ) : (
                <LinearGradient colors={bg.colors!} style={styles.thumb} />
            )}
            <Text style={styles.name}>{bg.name}</Text>
            {selectedBg.id === bg.id && (
                <Ionicons name="checkmark-circle" size={28} color="#FFD700" style={styles.check} />
            )}
        </TouchableOpacity>
    );

    const grouped = {
        photo: backgrounds.filter(b => b.type === 'photo'),
        basic: backgrounds.filter(b => b.type === 'basic'),
        relationship: backgrounds.filter(b => b.type === 'relationship'),
        married: backgrounds.filter(b => b.type === 'married'),
        friendship: backgrounds.filter(b => b.type === 'friendship'),
        custom: backgrounds.filter(b => b.type === 'custom'),
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {selectedBg.imageUri ? (
                <ImageBackground source={{ uri: selectedBg.imageUri }} style={StyleSheet.absoluteFillObject} blurRadius={20}>
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                </ImageBackground>
            ) : (
                <LinearGradient colors={selectedBg.colors || ['#000']} style={StyleSheet.absoluteFillObject} />
            )}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.headerBtn}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.title}>배경 · 메시지 편집</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={[styles.headerBtn, { color: '#FF6B9D' }]}>저장</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>미리보기</Text>
                    <View style={styles.previewCard}>{renderPreview()}</View>
                </View>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.sectionTitle}>배경 선택</Text>
                        <TouchableOpacity onPress={pickImage}>
                            <Text style={styles.photoBtn}>갤러리에서 선택</Text>
                        </TouchableOpacity>
                    </View>

                    {grouped.photo.length > 0 && (
                        <View style={styles.grid}>{grouped.photo.map(renderBgOption)}</View>
                    )}
                    <View style={styles.grid}>
                        {[...grouped.basic, ...grouped.relationship, ...grouped.married, ...grouped.friendship, ...grouped.custom].map(
                            renderBgOption
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>축하 메시지</Text>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="축하 메시지를 입력하세요"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            multiline
                            maxLength={100}
                        />
                        <Text style={styles.counter}>{message.length}/100</Text>
                    </View>

                    <View style={{ marginTop: 16 }}>
                        <Text style={styles.presetTitle}>추천 메시지</Text>
                        {[
                            '함께한 소중한 시간을 축하해요!',
                            '우리의 특별한 날을 기념해요!',
                            '더 많은 행복한 순간들을 만들어가요!',
                            '소중한 인연에 감사해요!',
                            '우리만의 특별한 추억이 쌓여가네요!',
                        ].map((m, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.preset, message === m && styles.presetActive]}
                                onPress={() => setMessage(m)}
                            >
                                <Text style={[styles.presetText, message === m && styles.presetTextActive]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerBtn: { color: '#fff', fontSize: 17, fontWeight: '500' },
    title: { color: '#fff', fontSize: 20, fontWeight: '700' },
    section: { marginBottom: 32 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    photoBtn: { color: '#FF6B9D', fontSize: 15 },
    previewCard: { borderRadius: 16, overflow: 'hidden', elevation: 10 },
    preview: { height: 160, justifyContent: 'center', alignItems: 'center' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: { fontSize: 36, marginBottom: 8 },
    previewText: { color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: '500' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    option: { width: '48%', marginBottom: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    selected: { borderWidth: 3, borderColor: '#FFD700' },
    thumb: { height: 80 },
    name: { color: '#fff', textAlign: 'center', padding: 8, fontSize: 13 },
    check: { position: 'absolute', top: 6, right: 6 },
    inputWrap: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    input: { color: '#fff', fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
    counter: { color: '#aaa', textAlign: 'right', marginTop: 8 },
    presetTitle: { color: '#fff', fontSize: 16, marginBottom: 8 },
    preset: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 8 },
    presetActive: { backgroundColor: 'rgba(255,107,157,0.2)', borderWidth: 1, borderColor: '#FF6B9D' },
    presetText: { color: 'rgba(255,255,255,0.8)' },
    presetTextActive: { color: '#fff', fontWeight: '600' },
});