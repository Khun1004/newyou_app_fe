// 💝 기념일 함께 보기 — 내 기념일을 서버에 올리고, 친구 기념일을 받아 와요
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import api from '@/components/utils/api';
import type { StatusItem } from '@/components/Status/statusApi';

export type SharedMember = { name: string; photo?: string | null; emoji?: string | null };

export type FriendAnniversaryData = {
    userId: number;
    ownerName?: string;
    ownerPhoto?: string | null;
    partnerName?: string | null;
    partnerPhoto?: string | null;
    relationshipType?: 'relationship' | 'married' | 'friendship' | null;
    startDate?: string | null;
    message?: string | null;
    bgColors?: string[];
    bgImage?: string | null;
    members?: SharedMember[];
    shared?: boolean;
    // 💞 친구의 사람들 (친구가 등록한 친구 목록) + 친구 본인 상태
    ownerStatuses?: StatusItem[];
    people?: FriendPerson[];
};

export type FriendPerson = {
    key: string;
    userId?: number | null;
    name: string;
    relation?: string | null;
    photo?: string | null;
    isMe?: boolean;       // 친구 목록에 있는 '나'
    statuses: StatusItem[]; // 내가 볼 수 있는 상태만
    hasStatus: boolean;
    hasUnseen: boolean;
};

type SyncInput = {
    owner: string; // 계정(전화번호) — 기기 저장 키에 써요
    partnerName?: string;
    partnerPhoto?: string | null;
    relationshipType?: string;
    startDate?: string;
    message?: string;
    bgColors?: string[];
    bgImageUri?: string;
    members: SharedMember[];
    shared: boolean;
};

let lastSent = ''; // 같은 내용은 다시 보내지 않아요

/** 휴대폰의 배경 사진 → 서버에 올릴 값 (이미 올린 사진이면 서버 주소를 그대로) */
async function bgValue(owner: string, uri?: string): Promise<string> {
    if (!uri) return '';
    if (uri.startsWith('data:image')) return uri;
    const m = uri.match(/\/images\/anniv\/[^?#]+/);
    if (m) return m[0];
    // 지난번에 올린 것과 같은 사진이면 서버 주소만 보내요
    try {
        const saved = JSON.parse((await AsyncStorage.getItem(`@anniv_bg_synced_${owner}`)) || 'null');
        if (saved && saved.local === uri && saved.server) return saved.server;
    } catch {}
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
        const mime = /\.png($|\?)/i.test(uri) ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${base64}`;
    } catch {
        return ''; // 읽지 못하면 배경색만 보여 줘요
    }
}

export async function syncMyAnniversary(input: SyncInput) {
    const bgImage = await bgValue(input.owner, input.bgImageUri);
    const body = {
        partnerName: input.partnerName ?? '',
        partnerPhoto: input.partnerPhoto ?? '',
        relationshipType: input.relationshipType ?? 'relationship',
        startDate: input.startDate ? String(input.startDate).slice(0, 10) : '',
        message: input.message ?? '',
        bgColors: input.bgColors ?? [],
        bgImage,
        members: input.members,
        shared: input.shared,
    };
    const key = JSON.stringify({ ...body, bgImage: bgImage.startsWith('data:') ? `local:${input.bgImageUri}` : bgImage });
    if (key === lastSent) return;
    try {
        const res = await api.put('/anniversary/mine', body, { timeout: 60000 });
        lastSent = key;
        if (bgImage.startsWith('data:') && res.data?.bgImage) {
            await AsyncStorage.setItem(
                `@anniv_bg_synced_${input.owner}`,
                JSON.stringify({ local: input.bgImageUri, server: res.data.bgImage })
            );
        }
    } catch (e) {
        console.warn('기념일을 서버에 올리지 못했어요 (다음에 다시 시도해요)', e);
    }
}

export async function fetchFriendAnniversary(userId: number): Promise<{ data?: FriendAnniversaryData; message?: string }> {
    try {
        const res = await api.get(`/anniversary/friend/${userId}`);
        return { data: res.data };
    } catch (e: any) {
        return { message: e?.response?.data?.message || '기념일을 불러오지 못했어요.' };
    }
}