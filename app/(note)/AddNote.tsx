import AddNote from '@/components/Note/AddNote';
import { screen } from '@/components/screen';

export default screen(AddNote, { requireLogin: '노트' });
