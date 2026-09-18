export type AppLanguage = "en" | "hi" | "hinglish";

export const INDIAN_CAPITALS = [
  "Amaravati","Bengaluru","Bhopal","Bhubaneswar","Chandigarh","Chennai","Dehradun","Dispur","Gandhinagar","Gangtok","Hyderabad","Imphal","Itanagar","Jaipur","Kohima","Kolkata","Lucknow","Mumbai","New Delhi","Panaji","Patna","Raipur","Ranchi","Shillong","Shimla","Srinagar","Thiruvananthapuram","Aizawl","Agartala","Port Blair","Puducherry","Kavaratti","Daman","Silvassa","Leh","Jammu"
];

export const PARKKAR_COPY = {
  en: {
    findParking: "Find parking", howItWorks: "How it works", care: "Parkkar Care", wallet: "Parkkar Wallet", account: "My account",
    heroTitle: "Park smarter.", heroAccent: "Move easier.", heroBody: "Find parking, choose the right slot, pay securely, and add vehicle care without leaving the booking flow.",
    search: "Search parking", location: "Location", nearby: "Recommended near you.", explore: "Explore all", liveMap: "Live parking map", openMap: "Open map",
    bestSlot: "Best slot", available: "Available", occupied: "Occupied", selected: "Selected", maintenance: "Unavailable", cleaning: "Cleaning selected",
    careTitle: "Vehicle care while you park.", careBody: "Choose your vehicle, add cleaning or emergency tyre assistance, and attach it to your parking booking.",
    car: "Car", bike: "Bike", ev: "EV", other: "Other", interior: "Interior cleaning", exterior: "Exterior cleaning", puncture: "Tubeless puncture assistance", complete: "Complete clean",
    choose: "Choose", continue: "Continue to booking", noMap: "Detailed floor map unavailable", mapPending: "Live Google Maps needs your API key. The Parkkar parking layout remains usable.",
  },
  hi: {
    findParking: "पार्किंग खोजें", howItWorks: "कैसे काम करता है", care: "पार्ककर केयर", wallet: "पार्ककर वॉलेट", account: "मेरा अकाउंट",
    heroTitle: "स्मार्ट पार्क करें।", heroAccent: "आसानी से आगे बढ़ें।", heroBody: "पार्किंग खोजें, सही स्लॉट चुनें, सुरक्षित भुगतान करें और बुकिंग के साथ वाहन की केयर भी जोड़ें।",
    search: "पार्किंग खोजें", location: "लोकेशन", nearby: "आपके पास सुझाई गई पार्किंग", explore: "सभी देखें", liveMap: "लाइव पार्किंग मैप", openMap: "मैप खोलें",
    bestSlot: "बेहतरीन स्लॉट", available: "उपलब्ध", occupied: "भरा हुआ", selected: "चुना गया", maintenance: "अनुपलब्ध", cleaning: "क्लीनिंग चुनी गई",
    careTitle: "पार्किंग के दौरान वाहन की केयर।", careBody: "वाहन चुनें, क्लीनिंग या टायर सहायता जोड़ें और इसे अपनी पार्किंग बुकिंग से जोड़ें।",
    car: "कार", bike: "बाइक", ev: "EV", other: "अन्य", interior: "इंटीरियर क्लीनिंग", exterior: "एक्सटीरियर क्लीनिंग", puncture: "ट्यूबलेस पंचर सहायता", complete: "कम्प्लीट क्लीन",
    choose: "चुनें", continue: "बुकिंग पर जाएँ", noMap: "डिटेल्ड फ्लोर मैप उपलब्ध नहीं", mapPending: "लाइव Google Maps के लिए API key चाहिए। Parkkar का पार्किंग लेआउट फिर भी इस्तेमाल किया जा सकता है।",
  },
  hinglish: {
    findParking: "Parking dhundo", howItWorks: "Kaise kaam karta hai", care: "Parkkar Care", wallet: "Parkkar Wallet", account: "Mera account",
    heroTitle: "Park smarter.", heroAccent: "Move easier.", heroBody: "Parking dhundo, best slot choose karo, securely pay karo aur booking ke saath vehicle care bhi add karo.",
    search: "Parking search karo", location: "Location", nearby: "Aapke paas recommended.", explore: "Sab dekho", liveMap: "Live parking map", openMap: "Map kholo",
    bestSlot: "Best slot", available: "Available", occupied: "Occupied", selected: "Selected", maintenance: "Unavailable", cleaning: "Cleaning selected",
    careTitle: "Park karte time vehicle care.", careBody: "Vehicle choose karo, cleaning ya emergency tyre help add karo aur booking ke saath attach karo.",
    car: "Car", bike: "Bike", ev: "EV", other: "Other", interior: "Interior cleaning", exterior: "Exterior cleaning", puncture: "Tubeless puncture help", complete: "Complete clean",
    choose: "Choose", continue: "Booking par jao", noMap: "Detailed floor map unavailable", mapPending: "Live Google Maps ke liye API key chahiye. Parkkar parking layout phir bhi use kar sakte ho.",
  },
} as const;

export type MallListing = {
  id: string;
  name: string;
  city: string;
  address: string;
  imageUrl?: string;
  imageSource?: string;
  mapAvailable: boolean;
  mapNote: string;
  parkingLevels?: { level: string; purpose: string; slotCount: number; slotPrefix: string }[];
  verifiedFacts: string[];
};

export const MALLS: MallListing[] = [
  {
    id: "z-square-kanpur", name: "Z Square Mall", city: "Kanpur", address: "M.G. Marg, Kanpur, Uttar Pradesh 208001",
    imageUrl: "https://wanderon-images.gumlet.io/blogs/new/2024/07/z-square-mall.avif", imageSource: "WanderOn",
    mapAvailable: true, mapNote: "Verified multi-level parking layout: B1 bikes, B2/B3 cars.",
    parkingLevels: [
      { level: "B1", purpose: "Bike parking", slotCount: 18, slotPrefix: "B1-" },
      { level: "B2", purpose: "Car parking", slotCount: 30, slotPrefix: "B2-" },
      { level: "B3", purpose: "Car parking", slotCount: 30, slotPrefix: "B3-" },
    ],
    verifiedFacts: ["3-level basement parking", "Up to 2,500 vehicles stated by the mall", "9 lifts", "MG Marg location"],
  },
  {
    id: "rave-3-kanpur", name: "Rave 3 Mall", city: "Kanpur", address: "Parwati Bagla Road, Kanpur, Uttar Pradesh 208002",
    imageUrl: "https://pbs.twimg.com/media/GVeio3JXgAACZNw.jpg", imageSource: "Kanpur Updates",
    mapAvailable: false, mapNote: "Building listing verified; detailed parking-floor layout not verified.", verifiedFacts: ["Parwati Bagla Road", "Mall + multiplex", "Parking available"],
  },
  {
    id: "south-x-kanpur", name: "South X Mall", city: "Kanpur", address: "Kidwai Nagar, Kanpur, Uttar Pradesh",
    imageUrl: "https://files.yappe.in/place/full/big-bazaar-south-x-mall-kidwai-nagar-9409789.webp", imageSource: "Yappe",
    mapAvailable: false, mapNote: "Parking is listed, but a verified slot/floor layout is not available.", verifiedFacts: ["Kidwai Nagar", "Shopping + entertainment", "Parking available"],
  },
  {
    id: "lulu-lucknow", name: "LuLu Mall Lucknow", city: "Lucknow", address: "Golf City, Amar Shaheed Path, Lucknow, Uttar Pradesh",
    imageUrl: "https://img.onmanorama.com/content/dam/mm/en/news/india/images/2022/7/11/lulu-mall-lucknow.jpg", imageSource: "Onmanorama",
    mapAvailable: false, mapNote: "Mall and parking facts verified; detailed slot layout still requires operator data.", verifiedFacts: ["Golf City", "Large retail and entertainment complex", "Parking deck bridge"],
  },
  {
    id: "phoenix-palassio-lucknow", name: "Phoenix Palassio", city: "Lucknow", address: "Shaheed Path, Lucknow, Uttar Pradesh",
    mapAvailable: false, mapNote: "Mall facts are verified; exact parking-slot layout is not exposed in the sources used.", verifiedFacts: ["Shaheed Path", "Three major entrances", "Large retail complex"],
  },
  {
    id: "phoenix-united-lucknow", name: "Phoenix United Mall", city: "Lucknow", address: "LDA Colony, Lucknow, Uttar Pradesh 226012",
    mapAvailable: false, mapNote: "Listing available; exact floor/slot parking data requires operator integration.", verifiedFacts: ["LDA Colony", "Retail and entertainment", "Parking available"],
  },
  {
    id: "one-awadh-lucknow", name: "One Awadh Centre", city: "Lucknow", address: "Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh",
    mapAvailable: false, mapNote: "Mall listing verified; detailed parking layout not verified.", verifiedFacts: ["Vibhuti Khand", "Gomti Nagar", "Opened in 2017"],
  },
  {
    id: "wave-lucknow", name: "Wave Mall Lucknow", city: "Lucknow", address: "TC-54, Vibhuti Khand, Gomti Nagar, Lucknow 226010",
    mapAvailable: false, mapNote: "Official floor plans exist, but this build does not claim a parking-slot layout without operator verification.", verifiedFacts: ["Gomti Nagar", "41+ retail outlets stated by Wave", "Official floor plans available"],
  },
  {
    id: "sahara-ganj-lucknow", name: "Sahara Ganj Mall", city: "Lucknow", address: "Shahnajaf Road, Hazratganj, Lucknow 226001",
    imageUrl: "https://img.staticmb.com/mbcontent/images/uploads/2023/7/Sahara-Ganj-Mall-Lucknow.jpg", imageSource: "MagicBricks",
    mapAvailable: false, mapNote: "Multi-level parking is documented; slot-level layout still requires operator data.", verifiedFacts: ["Hazratganj", "Multi-level car park", "Parking listed by mall"],
  },
];

export const CITY_COORDS: Record<string, {lat:number; lng:number}> = {
  Kanpur: {lat:26.4499,lng:80.3319}, Lucknow:{lat:26.8467,lng:80.9462}, Bengaluru:{lat:12.9716,lng:77.5946}, Mumbai:{lat:19.076,lng:72.8777}, "New Delhi":{lat:28.6139,lng:77.209}, Chennai:{lat:13.0827,lng:80.2707}, Hyderabad:{lat:17.385,lng:78.4867}, Kolkata:{lat:22.5726,lng:88.3639}, Jaipur:{lat:26.9124,lng:75.7873}, Ahmedabad:{lat:23.0225,lng:72.5714}, Bhopal:{lat:23.2599,lng:77.4126}, Patna:{lat:25.5941,lng:85.1376}, Raipur:{lat:21.2514,lng:81.6296}, Ranchi:{lat:23.3441,lng:85.3096}, Bhubaneswar:{lat:20.2961,lng:85.8245}, Chandigarh:{lat:30.7333,lng:76.7794}, Dehradun:{lat:30.3165,lng:78.0322}, Shimla:{lat:31.1048,lng:77.1734}
};

export function mallForParkingName(name: string) {
  const lower = name.toLowerCase();
  // Match by "does every identifying word of the mall's name appear
  // (as a whole word) somewhere in the DB location name" rather than by
  // stripping " mall" as one literal substring and checking containment.
  // The old approach broke whenever "Mall" sat in the middle of the name
  // instead of at the end — e.g. "LuLu Mall Lucknow" vs the DB's
  // "LuLu Mall Lucknow Parking": stripping " mall" left "lulu lucknow",
  // which is not a substring of "lulu mall lucknow parking" even though
  // every real word matches. That silently dropped LuLu Mall Lucknow and
  // Wave Mall Lucknow's verified image/facts/map-status from their cards.
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return MALLS.find((mall) => {
    const tokens = mall.name
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word !== "mall" && word !== "parking");
    return (
      tokens.length > 0 &&
      tokens.every((token) => new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(lower))
    );
  });
}
