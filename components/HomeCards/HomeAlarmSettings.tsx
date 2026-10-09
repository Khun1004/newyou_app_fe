import React from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';
import { HOME_CARDS, MAX_HOME_CARDS, useHomeCards } from '@/components/HomeCards/homeCardsStore';

/**
 * 마이페이지 > 홈 알람 설정
 * 홈 화면에 보여줄 알람 카드를 고르는 화면 (최대 3개)
 */
export default function HomeAlarmSettings() {
    const { enabled, toggleHomeCard, isOn } = useHomeCards();

    const handleToggle = (id: (typeof HOME_CARDS)[number]['id']) => {
        const ok = toggleHomeCard(id);
        if (!ok) {
            Alert.alert(
                '최대 3개까지 켤 수 있어요',
                '홈 화면에는 알람 카드를 3개까지만 보여줄 수 있어요.\n다른 카드를 먼저 끈 다음 켜 주세요.'
            );
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader title="홈 알람 설정" showBell={false} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="home-outline" size={20} color={THEME.primary} />
                    <Text style={styles.infoText}>
                        홈 화면에 보여줄 알람을 골라 주세요.{'\n'}
                        <Text style={styles.infoBold}>최대 {MAX_HOME_CARDS}개</Text>까지 켤 수 있어요.
                    </Text>
                    <View style={styles.countPill}>
                        <Text style={styles.countText}>
                            {enabled.length} / {MAX_HOME_CARDS}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    {HOME_CARDS.map((c, i) => {
                        const on = isOn(c.id);
                        const full = !on && enabled.length >= MAX_HOME_CARDS;
                        return (
                            <View key={c.id}>
                                <View style={[styles.row, full && { opacity: 0.5 }]}>
                                    <View style={[styles.iconCircle, { backgroundColor: `${c.color}1A` }]}>
                                        <Ionicons name={c.icon as any} size={20} color={c.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.rowTitle}>{c.title}</Text>
                                        <Text style={styles.rowDesc}>{c.description}</Text>
                                    </View>
                                    <Switch
                                        value={on}
                                        onValueChange={() => handleToggle(c.id)}
                                        trackColor={{ false: '#E4E6DA', true: THEME.primary }}
                                        thumbColor="#FFFFFF"
                                        ios_backgroundColor="#E4E6DA"
                                    />
                                </View>
                                {i < HOME_CARDS.length - 1 && <View style={styles.divider} />}
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.footnote}>켠 카드는 홈 화면에 위 순서대로 나와요.</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    content: { padding: 16, paddingBottom: 60 },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.primarySoft,
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
    },
    infoText: { flex: 1, marginLeft: 10, fontSize: 14, lineHeight: 20, color: THEME.text },
    infoBold: { fontWeight: '800', color: THEME.primaryDark },
    countPill: {
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    countText: { fontSize: 14, fontWeight: '800', color: THEME.primaryDark },
    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowTitle: { fontSize: 16, fontWeight: '700', color: THEME.text },
    rowDesc: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    divider: { height: 1, backgroundColor: THEME.line, marginLeft: 52 },
    footnote: { fontSize: 12, color: THEME.subText, marginTop: 10, marginLeft: 4 },
});