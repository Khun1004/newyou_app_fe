// ✍️ 상태 올리기 — 사진 + 한마디, 또는 예쁜 색 위에 한마디만
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { STATUS_COLORS } from '@/components/Status/statusApi';

const MAX = 60;
const IDEAS = ['오늘도 화이팅 💪', '보고 싶어요 🥰', '맛있는 거 먹는 중 🍜', '공부 중 📚', '산책 중 🌿', '행복한 하루 ☀️'];

type Props = {
    visible: boolean;
    onClose: () => void;
    onPost: (body: { image?: string | null; text?: string; bgColor?: string }) => Promise<{ ok: boolean; message?: string }>;
    onOpenArchive?: () => void;
};

export default function StatusComposer({ visible, onClose, onPost, onOpenArchive }: Props) {
    const [image, setImage] = useState<{ uri: string; data: string } | null>(null);
    const [text, setText] = useState('');
    const [color, setColor] = useState(STATUS_COLORS[0]);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (visible) {
            setImage(null);
            setText('');
            setColor(STATUS_COLORS[Math.floor(Math.random() * STATUS_COLORS.length)]);
        }
    }, [visible]);

    const pick = async (camera: boolean) => {
        try {
            if (camera) {
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) {
                    Alert.alert('카메라 권한', '사진을 찍으려면 카메라 권한이 필요해요.');
                    return;
                }
            }
            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ['images'],
                quality: 0.45,
                base64: true,
            };
            const result = camera
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);
            if (result.canceled || !result.assets?.length) return;
            const a = result.assets[0];
            if (!a.base64) {
                Alert.alert('사진', '사진을 읽지 못했어요. 다른 사진을 골라 주세요.');
                return;
            }
            const mime = a.mimeType || (a.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
            if (a.base64.length > 10 * 1024 * 1024) {
                Alert.alert('사진', '사진이 너무 커요. 다른 사진을 골라 주세요.');
                return;
            }
            setImage({ uri: a.uri, data: `data:${mime};base64,${a.base64}` });
        } catch (e) {
            Alert.alert('사진', '사진을 불러오지 못했어요.');
        }
    };

    const canPost = !!image || text.trim().length > 0;

    const submit = async () => {
        if (!canPost || posting) return;
        setPosting(true);
        const res = await onPost({ image: image?.data ?? null, text: text.trim(), bgColor: color });
        setPosting(false);
        if (res.ok) onClose();
        else Alert.alert('상태 올리기', res.message || '올리지 못했어요.');
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={[styles.screen, { backgroundColor: image ? 'rgb(0,0,0)' : color }]}>
                {/* 미리보기 */}
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.fill} resizeMode="cover" />
                ) : (
                    <LinearGradient colors={[color, 'rgba(0,0,0,0.35)'] as any} style={styles.fill} />
                )}

                <SafeAreaView style={{ flex: 1 }}>
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        {/* 위쪽 */}
                        <View style={styles.top}>
                            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.circleBtn} accessibilityLabel="닫기">
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.topTitle}>내 상태 올리기</Text>
                            {onOpenArchive ? (
                                <TouchableOpacity onPress={onOpenArchive} style={styles.archiveBtn}>
                                    <Ionicons name="albums-outline" size={16} color="#FFFFFF" />
                                    <Text style={styles.archiveText}>보관함</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 40 }} />
                            )}
                        </View>

                        {/* 가운데: 글 */}
                        <View style={styles.center}>
                            <TextInput
                                value={text}
                                onChangeText={(t) => setText(t.slice(0, MAX))}
                                placeholder={image ? '사진에 한마디 (선택)' : '지금 어떤 기분이에요?'}
                                placeholderTextColor="rgba(255,255,255,0.75)"
                                style={[styles.input, image ? styles.inputOnImage : styles.inputBig]}
                                multiline
                                maxLength={MAX}
                                textAlign="center"
                            />
                            <Text style={styles.counter}>
                                {text.length}/{MAX}
                            </Text>
                            {!image && text.length === 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideas}>
                                    {IDEAS.map((idea) => (
                                        <TouchableOpacity key={idea} onPress={() => setText(idea)} style={styles.idea}>
                                            <Text style={styles.ideaText}>{idea}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* 아래쪽 */}
                        <View style={styles.bottom}>
                            {!image ? (
                                <View style={styles.colors}>
                                    {STATUS_COLORS.map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            onPress={() => setColor(c)}
                                            style={[styles.colorDot, { backgroundColor: c }, c === color && styles.colorDotOn]}
                                            accessibilityLabel="배경색"
                                        />
                                    ))}
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setImage(null)} style={styles.removePhoto}>
                                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                                    <Text style={styles.removeText}>사진 빼기</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.pickBtn} onPress={() => pick(false)}>
                                    <Ionicons name="images-outline" size={22} color="#FFFFFF" />
                                    <Text style={styles.pickText}>사진</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pickBtn} onPress={() => pick(true)}>
                                    <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
                                    <Text style={styles.pickText}>카메라</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 1 }} />
                                <TouchableOpacity
                                    style={[styles.postBtn, !canPost && { opacity: 0.45 }]}
                                    onPress={submit}
                                    disabled={!canPost || posting}
                                    activeOpacity={0.85}
                                >
                                    {posting ? (
                                        <ActivityIndicator color="#3B5A24" />
                                    ) : (
                                        <>
                                            <Text style={styles.postText}>올리기</Text>
                                            <Ionicons name="send" size={16} color="#3B5A24" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.hint}>🔒 연결한 친구·가족만 볼 수 있고, 24시간 뒤에 사라져요</Text>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

// 색·사진 위에 그리는 화면이라 다크 모드 자동 변환을 피하려고 rgba 로 썼어요
const W = 'rgba(255,255,255,1)';
const styles = StyleSheet.create({
    screen: { flex: 1 },
    fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
    circleBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
    topTitle: { color: W, fontSize: 17, fontWeight: '900' },
    archiveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    archiveText: { color: W, fontSize: 13, fontWeight: '800' },

    center: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
    input: { color: W, fontWeight: '900' },
    inputBig: { fontSize: 30, lineHeight: 40, minHeight: 120 },
    inputOnImage: {
        fontSize: 19,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: 200,
    },
    counter: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: '700' },
    ideas: { gap: 8, paddingTop: 18, paddingHorizontal: 4 },
    idea: { paddingHorizontal: 12, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
    ideaText: { color: W, fontSize: 13, fontWeight: '700' },

    bottom: { paddingHorizontal: 18, paddingBottom: 18 },
    colors: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
    colorDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
    colorDotOn: { borderWidth: 4, borderColor: W, transform: [{ scale: 1.15 }] },
    removePhoto: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        marginBottom: 16,
    },
    removeText: { color: W, fontSize: 13, fontWeight: '700' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pickBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 62,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.28)',
    },
    pickText: { color: W, fontSize: 11, fontWeight: '700', marginTop: 2 },
    postBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 52,
        paddingHorizontal: 24,
        borderRadius: 26,
        backgroundColor: 'rgba(255,214,79,1)',
    },
    postText: { color: 'rgba(59,90,36,1)', fontSize: 16, fontWeight: '900' },
    hint: { color: 'rgba(255,255,255,0.85)', fontSize: 11, textAlign: 'center', marginTop: 12 },
});
