import AddMoney from '@/components/Money/AddMoney';
import { screen } from '@/components/screen';

export default screen(AddMoney, { requireLogin: '가계부' });