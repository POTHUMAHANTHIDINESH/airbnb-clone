export interface User { id: number; name: string; email: string; avatar: string; bio: string; is_host: boolean; joined: number }
export interface ListingCardT {
  id: number; title: string; city: string; country: string; property_type: string; category: string;
  price_per_night: number; rating: number; review_count: number; photos: string[]; lat: number; lng: number;
  beds: number; bedrooms: number; max_guests: number; wished: boolean; host_name: string; superhost: boolean;
}
export interface ListingDetail extends ListingCardT {
  description: string; address: string; baths: number; cleaning_fee: number;
  amenities: { name: string; icon: string }[];
  host: { id: number; name: string; avatar: string; bio: string; joined: number };
}
export interface Meta { categories: { name: string; icon: string }[]; property_types: string[]; amenities: { name: string; icon: string }[] }
export interface Quote { nights: number; nightly: number; subtotal: number; cleaning_fee: number; service_fee: number; total: number; available: boolean }
export interface Booking {
  id: number; code: string; status: string; check_in: string; check_out: string; guests: number; nights: number;
  subtotal: number; cleaning_fee: number; service_fee: number; total: number; past: boolean; reviewed: boolean;
  listing: { id: number; title: string; city: string; country: string; photo: string };
  guest: { id: number; name: string; avatar: string };
}
export interface Review { id: number; rating: number; comment: string; created_at: string; author: { name: string; avatar: string } }
