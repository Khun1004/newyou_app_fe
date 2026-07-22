import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useBookContext } from '@/components/contexts/BookContext';

interface Book {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    description: string;
    pages: number;
    genre: string;
    rating: number;
    publishedYear: number;
}

type RootStackParamList = {
    BooksDetail: {
        book: Book;
    };
    ReadBook: {
        book: Book;
    };
};

type BooksDetailRouteProp = RouteProp<RootStackParamList, 'BooksDetail'>;

const { width } = Dimensions.get('window');

const BooksDetail: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<BooksDetailRouteProp>();
    const { book } = route.params;

    const { setCurrentBook } = useBookContext();

    const handleReadBook = () => {
        setCurrentBook(book); // 컨텍스트에 현재 책 정보 저장
        navigation.navigate('ReadBook' as never);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007BFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>책 정보</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Book Cover Section */}
                <View style={styles.coverSection}>
                    <Image source={{ uri: book.coverImage }} style={styles.coverImage} />
                </View>

                {/* Book Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>

                    {/* Rating and Pages */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>평점</Text>
                            <Text style={styles.statValue}>⭐ {book.rating}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>페이지</Text>
                            <Text style={styles.statValue}>{book.pages}p</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>출간년도</Text>
                            <Text style={styles.statValue}>{book.publishedYear}</Text>
                        </View>
                    </View>

                    {/* Genre */}
                    <View style={styles.genreContainer}>
                        <Text style={styles.genreLabel}>장르</Text>
                        <View style={styles.genreTag}>
                            <Text style={styles.genreText}>{book.genre}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>책 소개</Text>
                        <Text style={styles.description}>{book.description}</Text>
                    </View>

                    {/* Sample Content Preview */}
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewLabel}>미리보기</Text>
                        <Text style={styles.previewText}>
                            {book.title === '해리포터와 마법사의 돌'
                                ? '더즐리 부부는 프리벳 가 4번지에 살았는데, 그들은 자신들이 완벽하게 정상적인 사람이라고 자랑스럽게 말하곤 했다. 그들은 이상하거나 신비로운 일들과는 전혀 무관한 사람들이었으며, 그런 말도 안 되는 것들은 용납할 수 없다고 생각했다.'
                                : book.title === '1984'
                                    ? '4월의 밝고 차가운 날이었다. 시계가 열세 시를 알리고 있었다. 윈스턴 스미스는 추위를 피하려고 턱을 가슴에 파묻고 빅토리 맨션의 유리문을 재빨리 통과했지만, 성가신 바람이 들어와 소용돌이치며 모래먼지를 날렸다.'
                                    : book.title === '데미안'
                                        ? '내가 단지 한 인간의 삶을 살려는 시도를 이야기하려고 한다. 그는 자기 자신이 되려고 노력했던 사람이었다. 어쩌면 그것은 보잘것없는 이야기일지도 모른다. 모든 사람의 삶이 자기 자신을 향한 길이며, 한 길을 시도한 것이다.'
                                        : '이 책의 첫 번째 장을 읽어보세요. 흥미진진한 이야기가 여러분을 기다리고 있습니다.'}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Read Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.readButton} onPress={handleReadBook}>
                    <Text style={styles.readButtonText}>읽기 시작</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#007BFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    placeholder: {
        width: 40,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    coverSection: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    coverImage: {
        width: width * 0.5,
        height: width * 0.7,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    infoSection: {
        backgroundColor: '#FFFFFF',
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
        textAlign: 'center',
        marginBottom: 8,
    },
    author: {
        fontSize: 18,
        color: '#6C757D',
        textAlign: 'center',
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#6C757D',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    genreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    genreLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginRight: 12,
    },
    genreTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    genreText: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: '500',
    },
    descriptionContainer: {
        marginBottom: 24,
    },
    descriptionLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#495057',
    },
    previewContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    previewLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 12,
    },
    previewText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#495057',
        fontStyle: 'italic',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    readButton: {
        backgroundColor: '#007BFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#007BFF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    readButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default BooksDetail;