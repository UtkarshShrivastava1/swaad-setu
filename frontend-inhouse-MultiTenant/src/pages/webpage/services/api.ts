import  type { MenuItem, Combo, ContactInfo } from '../types/index';

export const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich, creamy tomato sauce',
    price: 299,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800',
    isPopular: true
  },
  {
    id: '2',
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese with aromatic spices',
    price: 249,
    category: 'Appetizers',
    image: 'https://images.pexels.com/photos/14021988/pexels-photo-14021988.jpeg?auto=compress&cs=tinysrgb&w=800',
    isPopular: true
  },
  {
    id: '3',
    name: 'Biryani',
    description: 'Fragrant basmati rice with tender meat',
    price: 349,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800',
    isPopular: true
  },
  {
    id: '4',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe with spiced potato filling',
    price: 149,
    category: 'South Indian',
    image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=800',
    isPopular: true
  },
  {
    id: '5',
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils in creamy gravy',
    price: 199,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/6210876/pexels-photo-6210876.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '6',
    name: 'Samosa',
    description: 'Crispy pastry filled with spiced potatoes',
    price: 49,
    category: 'Appetizers',
    image: 'https://images.pexels.com/photos/17743495/pexels-photo-17743495.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

export const mockCombos: Combo[] = [
  {
    id: 'c1',
    name: 'Family Feast',
    items: ['Butter Chicken', 'Paneer Tikka', 'Biryani', 'Naan (4pcs)'],
    price: 799,
    savings: 150,
    image: 'https://images.pexels.com/photos/1860204/pexels-photo-1860204.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'c2',
    name: 'Solo Special',
    items: ['Any Main Course', 'Dal', 'Rice', 'Roti (2pcs)'],
    price: 299,
    savings: 50,
    image: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

export const contactInfo: ContactInfo = {
  phone: '+91 98765 43210',
  email: 'hello@swaadsetu.com',
  address: '123 Flavor Street, Mumbai, Maharashtra 400001',
  location: {
    lat: 19.0760,
    lng: 72.8777
  }
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMenuItems;
};

export const getCombos = async (): Promise<Combo[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCombos;
};

export const getContactInfo = async (): Promise<ContactInfo> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return contactInfo;
};
