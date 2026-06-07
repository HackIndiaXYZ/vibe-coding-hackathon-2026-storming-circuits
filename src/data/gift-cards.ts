export interface GiftCard {
  id: string;
  brand: string;
  category: "Shopping" | "Pharmacy" | "Healthcare" | "Lifestyle";
  amount: number; // INR equivalent
  cost: number;   // HLTH tokens required
  color: string;  // gradient classes
  logo: string;   // emoji / short label
  description: string;
}

export const GIFT_CARDS: GiftCard[] = [
  { id: "amzn-500",   brand: "Amazon",          category: "Shopping",   amount: 500,  cost: 500,  color: "from-orange-500 to-yellow-500",  logo: "🛒", description: "Use on millions of products across Amazon India." },
  { id: "amzn-1000",  brand: "Amazon",          category: "Shopping",   amount: 1000, cost: 950,  color: "from-orange-500 to-yellow-500",  logo: "🛒", description: "Use on millions of products across Amazon India." },
  { id: "flpkrt-500", brand: "Flipkart",        category: "Shopping",   amount: 500,  cost: 500,  color: "from-blue-500 to-indigo-600",    logo: "🛍️", description: "Spend on electronics, fashion and home essentials." },
  { id: "flpkrt-1000",brand: "Flipkart",        category: "Shopping",   amount: 1000, cost: 950,  color: "from-blue-500 to-indigo-600",    logo: "🛍️", description: "Spend on electronics, fashion and home essentials." },
  { id: "1mg-250",    brand: "Tata 1mg",        category: "Pharmacy",   amount: 250,  cost: 240,  color: "from-emerald-500 to-teal-600",   logo: "💊", description: "Medicines, lab tests and online doctor consults." },
  { id: "1mg-500",    brand: "Tata 1mg",        category: "Pharmacy",   amount: 500,  cost: 475,  color: "from-emerald-500 to-teal-600",   logo: "💊", description: "Medicines, lab tests and online doctor consults." },
  { id: "apollo-500", brand: "Apollo Pharmacy", category: "Pharmacy",   amount: 500,  cost: 480,  color: "from-rose-500 to-pink-600",      logo: "🏥", description: "Redeem in-store or on Apollo 24|7 app." },
  { id: "netmeds-500",brand: "Netmeds",         category: "Pharmacy",   amount: 500,  cost: 480,  color: "from-green-500 to-emerald-600",  logo: "⚕️", description: "Discounted prescription medicines." },
  { id: "swiggy-300", brand: "Swiggy",          category: "Lifestyle",  amount: 300,  cost: 320,  color: "from-orange-600 to-red-500",     logo: "🍔", description: "Food delivery and Instamart groceries." },
  { id: "cure-1000",  brand: "CureFit",         category: "Healthcare", amount: 1000, cost: 900,  color: "from-fuchsia-500 to-purple-600", logo: "💪", description: "Fitness classes, mental wellness and care plans." },
];
