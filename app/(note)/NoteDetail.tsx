import NoteDetail from '@/components/Note/NoteDetail';
import { screen } from '@/components/screen';

export default screen(NoteDetail, { requireLogin: '노트' });
