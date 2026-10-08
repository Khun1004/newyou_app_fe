import ProfileEdit from '@/components/ProfileEdit/ProfileEdit';
import { screen } from '@/components/screen';

export default screen(ProfileEdit, { requireLogin: '프로필 편집' });
