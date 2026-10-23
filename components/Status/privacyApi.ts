// 🔒 공개 설정 · 🚫 차단 · ♻️ 다시 올리기 API
import api from '@/components/utils/api';

export type PrivacySettings = { anniversaryPublic: boolean; storyPublic: boolean; notePublic: boolean };
export type BlockedUser = { userId: number; name: string; loginId?: string | null; profileImage?: string | null; blockedAt: string };

const msg = (e: any, fallback: string) => e?.response?.data?.message || fallback;

export async function getPrivacy(): Promise<PrivacySettings | null> {
    try {
        const res = await api.get('/privacy');
        return res.data;
    } catch {
        return null;
    }
}

export async function updatePrivacy(body: Partial<PrivacySettings>): Promise<{ ok: boolean; data?: PrivacySettings; message?: string }> {
    try {
        const res = await api.put('/privacy', body);
        return { ok: true, data: res.data };
    } catch (e) {
        return { ok: false, message: msg(e, '설정을 바꾸지 못했어요.') };
    }
}

export async function getBlocks(): Promise<BlockedUser[]> {
    try {
        const res = await api.get('/blocks');
        return res.data ?? [];
    } catch {
        return [];
    }
}

export async function blockUser(userId: number): Promise<{ ok: boolean; message?: string }> {
    try {
        await api.post(`/blocks/${userId}`);
        return { ok: true };
    } catch (e) {
        return { ok: false, message: msg(e, '차단하지 못했어요.') };
    }
}

export async function unblockUser(userId: number): Promise<{ ok: boolean; message?: string }> {
    try {
        await api.delete(`/blocks/${userId}`);
        return { ok: true };
    } catch (e) {
        return { ok: false, message: msg(e, '차단을 풀지 못했어요.') };
    }
}

/** ♻️ 보관함의 상태를 다시 올려요 (24시간 동안 다시 보여요) */
export async function repostStatus(statusId: number): Promise<{ ok: boolean; message?: string }> {
    try {
        await api.post(`/status/${statusId}/repost`);
        return { ok: true };
    } catch (e) {
        return { ok: false, message: msg(e, '다시 올리지 못했어요.') };
    }
}
