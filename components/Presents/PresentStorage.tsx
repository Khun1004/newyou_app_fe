import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Dimensions,
    Image,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSentGifts } from '@/components/contexts/SentGiftsContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

// 예시 받은 선물 데이터
const sampleReceivedData = [
    {
        id: 4,
        name: '미스 디올',
        brand: 'DIOR',
        price: '165,000원',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        sender: '정유진',
        date: '2024-12-12',
        status: '수령완료',
        message: '항상 고마워요! ❤️'
    },
    {
        id: 5,
        name: '초콜릿 케이크',
        brand: 'BAKERY',
        price: '45,000원',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        sender: '최민수',
        date: '2024-12-14',
        status: '수령완료',
        message: '생일 축하합니다! 🎂'
    }
];

// 선물 카드 컴포넌트
const PresentCard = ({ item, type, onPress, onMessagePress }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case '전달완료':
            case '수령완료':
                return '#4CAF50';
            case '배송중':
            case '배송준비중':
                return '#FF9800';
            default:
                return '#666';
        }
    };

    return (
        <TouchableOpacity
            style={styles.presentCard}
            onPress={() => onPress(item)}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.presentImage} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.presentInfo}>
                <Text style={styles.brandName}>{item.brand}</Text>
                <Text style={styles.presentName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>{item.price}</Text>

                <View style={styles.personContainer}>
                    <Ionicons
                        name={type === 'sent' ? "paper-plane-outline" : "gift-outline"}
                        size={14}
                        color="#666"
                    />
                    <Text style={styles.personText}>
                        {type === 'sent' ? `받는 사람: ${item.recipient}` : `보낸 사람: ${item.sender}`}
                    </Text>
                </View>

                <Text style={styles.dateText}>{item.date}</Text>

                {item.message && (
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => onMessagePress(item.message)}
                    >
                        <Ionicons name="chatbubble-outline" size={14} color="#007AFF" />
                        <Text style={styles.messageButtonText}>메시지 보기</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

// 빈 화면 컴포넌트
const EmptyPresents = ({ type }) => (
    <View style={styles.emptyContainer}>
        <Ionicons
            name={type === 'sent' ? "paper-plane-outline" : "gift-outline"}
            size={64}
            color="#ccc"
        />
        <Text style={styles.emptyTitle}>
            {type === 'sent' ? '보낸 선물이 없어요' : '받은 선물이 없어요'}
        </Text>
        <Text style={styles.emptySubtitle}>
            {type === 'sent' ? '소중한 사람에게 선물을 보내보세요' : '친구들이 보내는 선물을 기다려보세요'}
        </Text>
    </View>
);

const PresentStorage = () => {
    const [activeTab, setActiveTab] = useState('sent');
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState('');
    const router = useRouter();

    // Context에서 보낸 선물 데이터 가져오기
    const { sentGifts } = useSentGifts();

    const currentData = activeTab === 'sent' ? sentGifts : sampleReceivedData;

    const handlePresentPress = (item) => {
        // 선물 상세 정보 모달이나 화면으로 이동
        console.log('Present pressed:', item);
    };

    const handleMessagePress = (message) => {
        setSelectedMessage(message);
        setShowMessageModal(true);
    };

    const renderItem = ({ item }) => (
        <PresentCard
            item={item}
            type={activeTab}
            onPress={handlePresentPress}
            onMessagePress={handleMessagePress}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>선물함</Text>
                <View style={styles.headerRight} />
            </View>

            {/* 탭 */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
                    onPress={() => setActiveTab('sent')}
                >
                    <Ionicons
                        name="paper-plane-outline"
                        size={18}
                        color={activeTab === 'sent' ? '#007AFF' : '#666'}
                    />
                    <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
                        보낸 선물 ({sentGifts.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'received' && styles.activeTab]}
                    onPress={() => setActiveTab('received')}
                >
                    <Ionicons
                        name="gift-outline"
                        size={18}
                        color={activeTab === 'received' ? '#007AFF' : '#666'}
                    />
                    <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
                        받은 선물 ({sampleReceivedData.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 선물 목록 */}
            {currentData.length > 0 ? (
                <FlatList
                    data={currentData}
                    renderItem={renderItem}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={styles.row}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <EmptyPresents type={activeTab} />
            )}

            {/* 메시지 모달 */}
            <Modal
                visible={showMessageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMessageModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMessageModal(false)}
                >
                    <View style={styles.messageModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>선물 메시지</Text>
                            <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.messageContent}>
                            <Text style={styles.messageText}>{selectedMessage}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRight: {
        width: 32,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f8f8',
        margin: 16,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    gridContainer: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    presentCard: {
        width: ITEM_WIDTH,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    imageContainer: {
        position: 'relative',
    },
    presentImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    presentInfo: {
        padding: 12,
    },
    brandName: {
        fontSize: 11,
        color: '#999',
        marginBottom: 2,
        fontWeight: '500',
    },
    presentName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        lineHeight: 16,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 8,
    },
    personContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    personText: {
        fontSize: 11,
        color: '#666',
        marginLeft: 4,
    },
    dateText: {
        fontSize: 11,
        color: '#999',
        marginBottom: 8,
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    messageButtonText: {
        fontSize: 11,
        color: '#007AFF',
        marginLeft: 4,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    messageModal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 320,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    messageContent: {
        padding: 20,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        textAlign: 'center',
    },
});

export default PresentStorage;