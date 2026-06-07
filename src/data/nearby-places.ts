// Manually-curated list of nearby medical places.
// Replace this array with data scraped from Google Maps.
//
// Tip: When you scrape Google Maps, export rows with these fields:
//   name, category, address, phone, rating, reviewCount, hours,
//   lat, lng, mapsUrl, website (optional)
//
// Category should be one of: "Hospital" | "Clinic" | "Pharmacy" | "Diagnostic" | "Dentist"

export type PlaceCategory =
  | "Hospital"
  | "Clinic"
  | "Pharmacy"
  | "Diagnostic"
  | "Dentist";

export interface NearbyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  hours?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  website?: string;
  /** Short curated highlight from a real Google review */
  topReview?: string;
}

export const NEARBY_PLACES: NearbyPlace[] = [
  {
    id: "apollo-hospital-1",
    name: "Apollo Hospital",
    category: "Hospital",
    address: "Plot 251, Sainik School Rd, Unit 15, Bhubaneswar",
    phone: "+91 674 666 1066",
    rating: 4.3,
    reviewCount: 5421,
    hours: "Open 24 hours",
    lat: 20.2986,
    lng: 85.8242,
    mapsUrl: "https://maps.google.com/?q=Apollo+Hospital+Bhubaneswar",
    website: "https://www.apollohospitals.com",
    topReview:
      "Excellent emergency response and clean wards. Doctors took time to explain the diagnosis.",
  },
  {
    id: "apollo-pharmacy-1",
    name: "Apollo Pharmacy",
    category: "Pharmacy",
    address: "Saheed Nagar, Bhubaneswar",
    phone: "+91 80 4444 4444",
    rating: 4.1,
    reviewCount: 312,
    hours: "7:00 AM – 11:00 PM",
    mapsUrl: "https://maps.google.com/?q=Apollo+Pharmacy+Saheed+Nagar",
    topReview: "Wide stock, generic alternatives suggested when brand was unavailable.",
  },
  {
    id: "kims-1",
    name: "Kalinga Institute of Medical Sciences",
    category: "Hospital",
    address: "KIIT Rd, Patia, Bhubaneswar",
    phone: "+91 674 272 5466",
    rating: 4.2,
    reviewCount: 3984,
    hours: "Open 24 hours",
    mapsUrl: "https://maps.google.com/?q=KIMS+Bhubaneswar",
    topReview: "Affordable, well-equipped, but OPD waiting can be long on weekends.",
  },
  {
    id: "medplus-1",
    name: "MedPlus Pharmacy",
    category: "Pharmacy",
    address: "Jaydev Vihar, Bhubaneswar",
    phone: "+91 40 6700 6700",
    rating: 4.0,
    reviewCount: 188,
    hours: "8:00 AM – 10:30 PM",
    mapsUrl: "https://maps.google.com/?q=MedPlus+Jaydev+Vihar",
    topReview: "Reliable membership discount, home delivery within 30 minutes.",
  },
  {
    id: "sum-1",
    name: "SUM Ultimate Medicare",
    category: "Hospital",
    address: "K8, Kalinga Nagar, Bhubaneswar",
    phone: "+91 674 386 0000",
    rating: 4.0,
    reviewCount: 1276,
    hours: "Open 24 hours",
    mapsUrl: "https://maps.google.com/?q=SUM+Ultimate+Medicare",
    topReview: "Modern infrastructure with attached super-speciality units.",
  },
  {
    id: "dr-lal-1",
    name: "Dr. Lal PathLabs",
    category: "Diagnostic",
    address: "Forest Park, Bhubaneswar",
    phone: "+91 11 3988 5050",
    rating: 4.4,
    reviewCount: 642,
    hours: "6:30 AM – 9:00 PM",
    mapsUrl: "https://maps.google.com/?q=Dr+Lal+PathLabs+Bhubaneswar",
    topReview: "Reports were delivered ahead of time and explained clearly online.",
  },
  {
    id: "smile-dental-1",
    name: "Smile Dental Clinic",
    category: "Dentist",
    address: "Nayapalli, Bhubaneswar",
    phone: "+91 98610 12345",
    rating: 4.7,
    reviewCount: 214,
    hours: "10:00 AM – 8:00 PM",
    mapsUrl: "https://maps.google.com/?q=Smile+Dental+Clinic+Bhubaneswar",
    topReview: "Painless root canal, transparent pricing and modern equipment.",
  },
];
