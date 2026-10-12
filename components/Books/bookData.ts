// 독서 화면에서 쓰는 책 목록 (목록 · 책 정보 화면이 같이 써요)
export interface Book {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    description: string;
    pages: number;
    genre: string;
    rating: number;
    publishedYear: number;
    color: string; // 표지 사진이 안 나올 때 쓰는 색
    preview?: string; // 미리보기 한 단락
}

export const BOOKS: Book[] = [
    {
        id: '1',
        title: '해리포터와 마법사의 돌',
        author: 'J.K. 롤링',
        coverImage: 'https://images.unsplash.com/photo-1543002598-a83d726b05be?q=80&w=800&auto=format&fit=crop',
        description: '해리포터의 모험이 시작되는 첫 번째 이야기. 열한 번째 생일, 해리는 자신이 마법사라는 사실을 알게 돼요.',
        pages: 320,
        genre: '판타지',
        rating: 4.8,
        publishedYear: 1997,
        color: '#7B3F61',
        preview:
            '더즐리 부부는 프리벳 가 4번지에 살았는데, 그들은 자신들이 완벽하게 정상적인 사람이라고 자랑스럽게 말하곤 했다.',
    },
    {
        id: '2',
        title: '1984',
        author: '조지 오웰',
        coverImage: 'https://images.unsplash.com/photo-1627964434914-f584e27f074d?q=80&w=800&auto=format&fit=crop',
        description: '모든 것이 감시받는 디스토피아 사회를 그린 고전 소설. 지금 읽어도 오싹한 이야기예요.',
        pages: 280,
        genre: 'SF',
        rating: 4.6,
        publishedYear: 1949,
        color: '#3B4A5A',
        preview: '4월의 밝고 차가운 날이었다. 시계가 열세 시를 알리고 있었다.',
    },
    {
        id: '3',
        title: '데미안',
        author: '헤르만 헤세',
        coverImage: 'https://images.unsplash.com/photo-1510214870020-f421f64f40f0?q=80&w=800&auto=format&fit=crop',
        description: '나 자신을 찾아가는 성장 소설. "새는 알에서 나오려고 투쟁한다."',
        pages: 200,
        genre: '문학',
        rating: 4.4,
        publishedYear: 1919,
        color: '#5B6B3A',
        preview: '내가 단지 한 인간의 삶을 살려는 시도를 이야기하려고 한다. 그는 자기 자신이 되려고 노력했던 사람이었다.',
    },
    {
        id: '4',
        title: '코스모스',
        author: '칼 세이건',
        coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=800&auto=format&fit=crop',
        description: '우주와 과학에 대한 경이로운 이야기. 별을 올려다보고 싶어지는 책이에요.',
        pages: 400,
        genre: '과학',
        rating: 4.7,
        publishedYear: 1980,
        color: '#1F3A5F',
    },
    {
        id: '5',
        title: '어린왕자',
        author: '앙투안 드 생텍쥐페리',
        coverImage: 'https://images.unsplash.com/photo-1558980394-b7781b0a7019?q=80&w=800&auto=format&fit=crop',
        description: '사랑과 우정에 대한 철학적 동화. "가장 중요한 것은 눈에 보이지 않아."',
        pages: 120,
        genre: '동화',
        rating: 4.9,
        publishedYear: 1943,
        color: '#C9873B',
    },
];

export const findBook = (id?: string | string[]) => BOOKS.find((b) => b.id === String(id));

// 대충 읽는 시간 (1쪽에 1.5분)
export const readingTime = (pages: number) => {
    const min = Math.round(pages * 1.5);
    return min >= 60 ? `약 ${Math.round(min / 60)}시간` : `약 ${min}분`;
};