import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {Ionicons} from "@expo/vector-icons";

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

const Books: React.FC = () => {
    const navigation = useNavigation();
    const [books, setBooks] = useState<Book[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

    useEffect(() => {
        // 샘플 책 데이터와 실제 이미지 URL
        const sampleBooks: Book[] = [
            {
                id: '1',
                title: '해리포터와 마법사의 돌',
                author: 'J.K. 롤링',
                coverImage: 'https://images.unsplash.com/photo-1543002598-a83d726b05be?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                description: '해리포터의 모험이 시작되는 첫 번째 이야기',
                pages: 320,
                genre: '판타지',
                rating: 4.8,
                publishedYear: 1997,
            },
            {
                id: '2',
                title: '1984',
                author: '조지 오웰',
                coverImage: 'https://images.unsplash.com/photo-1627964434914-f584e27f074d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                description: '디스토피아 사회를 그린 고전 소설',
                pages: 280,
                genre: 'SF',
                rating: 4.6,
                publishedYear: 1949,
            },
            {
                id: '3',
                title: '데미안',
                author: '헤르만 헤세',
                coverImage: 'https://images.unsplash.com/photo-1510214870020-f421f64f40f0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                description: '자아 발견과 성장을 다룬 성장 소설',
                pages: 200,
                genre: '문학',
                rating: 4.4,
                publishedYear: 1919,
            },
            {
                id: '4',
                title: '코스모스',
                author: '칼 세이건',
                coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                description: '우주와 과학에 대한 경이로운 이야기',
                pages: 400,
                genre: '과학',
                rating: 4.7,
                publishedYear: 1980,
            },
            {
                id: '5',
                title: '어린왕자',
                author: '앙투안 드 생텍쥐페리',
                coverImage: 'https://images.unsplash.com/photo-1558980394-b7781b0a7019?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                description: '사랑과 우정에 대한 철학적 동화',
                pages: 120,
                genre: '동화',
                rating: 4.9,
                publishedYear: 1943,
            },
        ];

        setBooks(sampleBooks);
        setFilteredBooks(sampleBooks);
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredBooks(books);
        } else {
            const filtered = books.filter(
                book =>
                    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    book.genre.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredBooks(filtered);
        }
    }, [searchQuery, books]);

    const renderBookItem = ({ item }: { item: Book }) => (
        <TouchableOpacity
            style={styles.bookItem}
            onPress={() => navigation.navigate('BooksDetail', { book: item })}
        >
            <Image source={{ uri: item.coverImage }} style={styles.bookCover} />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <Text style={styles.bookGenre}>{item.genre}</Text>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>⭐ {item.rating}</Text>
                    <Text style={styles.pages}>{item.pages}페이지</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                {/* 뒤로 가기 버튼 추가 */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={28} color="#212529" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>독서</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="책 제목, 저자, 장르로 검색..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredBooks}
                renderItem={renderBookItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row', // 백 버튼과 제목을 한 줄에 배치
        alignItems: 'center', // 세로 중앙 정렬
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10, // 백 버튼 공간 확보를 위해 패딩 조정
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    backButton: {
        padding: 10, // 터치 영역을 넓게
        marginRight: 5, // 제목과의 간격
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
    },
    searchInput: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    bookItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    bookCover: {
        width: 80,
        height: 120,
        borderRadius: 8,
        marginRight: 16,
    },
    bookInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#6C757D',
        marginBottom: 4,
    },
    bookGenre: {
        fontSize: 12,
        color: '#007BFF',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        color: '#FFC107',
        fontWeight: '600',
    },
    pages: {
        fontSize: 12,
        color: '#6C757D',
    },
});

export default Books;