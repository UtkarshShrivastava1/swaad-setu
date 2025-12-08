export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isPopular?: boolean;
}

export interface Combo {
  id: string;
  name: string;
  items: string[];
  price: number;
  savings: number;
  image: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}
