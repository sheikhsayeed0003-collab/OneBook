import type {
  Comment,
  Conversation,
  EventItem,
  Group,
  Job,
  Message,
  NotificationItem,
  PageEntity,
  Post,
  Product,
  Story,
  User,
} from "@/lib/types";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=dbeafe,c7d2fe,e0e7ff`;
const photo = (seed: string, w = 800, h = 500) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

export const currentUser: User = {
  id: "u-1",
  username: "mursalin",
  name: "Mursalin",
  email: "mursalin@facbook.app",
  bio: "Building products. Coffee, cameras, and late-night feeds.",
  about: "Software engineer. Loves clean UI, fast apps, and good conversations.",
  location: "Dhaka, Bangladesh",
  website: "https://facbook.app/mursalin",
  joinedAt: "March 2018",
  avatar: avatar("mursalin"),
  cover: photo("cover-mursalin", 1600, 480),
  verified: true,
  role: "owner",
  online: true,
  lastSeen: "Active now",
  friends: 842,
  followers: 1204,
  following: 318,
};

export const users: User[] = [
  currentUser,
  {
    id: "u-2",
    username: "aya.rahman",
    name: "Aya Rahman",
    email: "aya@facbook.app",
    bio: "Designer · city walks",
    about: "Product designer exploring color and type.",
    location: "Chattogram",
    website: "",
    joinedAt: "July 2019",
    avatar: avatar("aya"),
    cover: photo("cover-aya", 1600, 480),
    verified: true,
    role: "user",
    online: true,
    lastSeen: "Active now",
    friends: 512,
    followers: 890,
    following: 201,
  },
  {
    id: "u-3",
    username: "nabil.k",
    name: "Nabil Khan",
    email: "nabil@facbook.app",
    bio: "Films and weekend football",
    about: "Independent filmmaker.",
    location: "Sylhet",
    website: "",
    joinedAt: "Jan 2020",
    avatar: avatar("nabil"),
    cover: photo("cover-nabil", 1600, 480),
    verified: false,
    role: "moderator",
    online: false,
    lastSeen: "2h ago",
    friends: 301,
    followers: 440,
    following: 99,
  },
  {
    id: "u-4",
    username: "sara.n",
    name: "Sara Noor",
    email: "sara@facbook.app",
    bio: "Chef · home kitchen",
    about: "Sharing recipes from home.",
    location: "Khulna",
    website: "",
    joinedAt: "May 2021",
    avatar: avatar("sara"),
    cover: photo("cover-sara", 1600, 480),
    verified: false,
    role: "admin",
    online: true,
    lastSeen: "Active now",
    friends: 670,
    followers: 2100,
    following: 140,
  },
  {
    id: "u-5",
    username: "reza",
    name: "Reza Ahmed",
    email: "reza@facbook.app",
    bio: "Trail running",
    about: "Outdoors when I can.",
    location: "Rajshahi",
    website: "",
    joinedAt: "Aug 2017",
    avatar: avatar("reza"),
    cover: photo("cover-reza", 1600, 480),
    verified: false,
    role: "user",
    online: false,
    lastSeen: "Yesterday",
    friends: 190,
    followers: 220,
    following: 80,
  },
];

export const posts: Post[] = [
  {
    id: "p-1",
    author: users[1],
    text: "Golden hour on the river. Sometimes you just have to stop scrolling and look up.",
    images: [photo("river-1", 900, 560)],
    feeling: "feeling grateful",
    location: "Buriganga River",
    privacy: "public",
    createdAt: "12m",
    likes: 248,
    comments: 36,
    shares: 11,
    reaction: "love",
    tagged: ["Mursalin"],
  },
  {
    id: "p-2",
    author: users[3],
    text: "Tonight’s kitchen experiment: coconut rice, grilled prawns, and a mango salad. Who’s hungry?",
    images: [photo("food-1", 600, 600), photo("food-2", 600, 600), photo("food-3", 600, 600)],
    privacy: "friends",
    createdAt: "1h",
    likes: 512,
    comments: 88,
    shares: 24,
  },
  {
    id: "p-3",
    author: users[2],
    text: "Poll: weekend plan?",
    images: [],
    privacy: "public",
    createdAt: "3h",
    likes: 91,
    comments: 40,
    shares: 2,
  },
  {
    id: "p-4",
    author: currentUser,
    text: "Shipping a new layout this week. Three-column desktop, drawer on tablet, bottom nav on phone. Feedback welcome.",
    images: [photo("desk-1", 1000, 540)],
    privacy: "public",
    createdAt: "5h",
    likes: 176,
    comments: 29,
    shares: 7,
  },
];

export const comments: Comment[] = [
  {
    id: "c-1",
    author: users[4],
    text: "This light is unreal. Where did you shoot?",
    createdAt: "8m",
    likes: 12,
    replies: [
      {
        id: "c-1-1",
        author: users[1],
        text: "Near the old port — around 5:40pm.",
        createdAt: "6m",
        likes: 4,
        replies: [],
      },
    ],
  },
  {
    id: "c-2",
    author: currentUser,
    text: "Saving this for the weekend hike.",
    createdAt: "4m",
    likes: 3,
    replies: [],
  },
];

export const stories: Story[] = users.map((u, i) => ({
  id: `s-${i}`,
  author: u,
  type: i % 3 === 0 ? "text" : i % 2 === 0 ? "video" : "image",
  media: photo(`story-${i}`, 720, 1280),
  text: i % 3 === 0 ? "Good morning, OneBook." : undefined,
  views: 40 + i * 17,
  createdAt: `${i + 1}h`,
}));

export const conversations: Conversation[] = [
  {
    id: "m-1",
    name: "Aya Rahman",
    avatar: users[1].avatar,
    lastMessage: "Can you review the cover crop?",
    time: "2m",
    unread: 2,
    online: true,
    group: false,
  },
  {
    id: "m-2",
    name: "Product crew",
    avatar: avatar("crew"),
    lastMessage: "Nabil: standup notes are in",
    time: "18m",
    unread: 0,
    online: false,
    group: true,
  },
  {
    id: "m-3",
    name: "Sara Noor",
    avatar: users[3].avatar,
    lastMessage: "You: the photos look great",
    time: "1h",
    unread: 0,
    online: true,
    group: false,
  },
];

export const messages: Message[] = [
  { id: "msg-1", fromMe: false, text: "Hey — saw the new feed. The skeletons feel right.", time: "10:12", read: true },
  { id: "msg-2", fromMe: true, text: "Thanks. Still tuning the reaction picker.", time: "10:14", read: true },
  { id: "msg-3", fromMe: false, text: "Can you review the cover crop?", time: "10:16", read: false },
];

export const groups: Group[] = [
  { id: "g-1", name: "Dhaka Photographers", cover: photo("g1", 800, 320), privacy: "public", members: 12400, posts: 890, description: "Share frames, critique kindly." },
  { id: "g-2", name: "Weekend Trail Club", cover: photo("g2", 800, 320), privacy: "private", members: 860, posts: 210, description: "Hikes around the city." },
  { id: "g-3", name: "Home Cooks BD", cover: photo("g3", 800, 320), privacy: "public", members: 22100, posts: 3400, description: "Recipes, markets, leftovers." },
];

export const pages: PageEntity[] = [
  { id: "pg-1", name: "Northlight Studio", category: "Creative studio", cover: photo("pg1", 1200, 400), avatar: avatar("studio"), likes: 48000, followers: 51200, verified: true, bio: "Brand films and stills." },
  { id: "pg-2", name: "Cafe Linden", category: "Coffee shop", cover: photo("pg2", 1200, 400), avatar: avatar("cafe"), likes: 9100, followers: 10200, verified: false, bio: "Pour-overs and quiet tables." },
];

export const products: Product[] = [
  { id: "pr-1", title: "Vintage film camera", price: "৳12,500", location: "Dhanmondi", image: photo("cam", 600, 600), seller: "Aya Rahman" },
  { id: "pr-2", title: "Oak desk + lamp", price: "৳8,900", location: "Gulshan", image: photo("desk2", 600, 600), seller: "Reza Ahmed" },
  { id: "pr-3", title: "Road bike, size M", price: "৳21,000", location: "Uttara", image: photo("bike", 600, 600), seller: "Nabil Khan" },
];

export const events: EventItem[] = [
  { id: "e-1", title: "Riverfront Jazz Night", date: "Sat, 19 Sep · 7:00 PM", location: "Hatirjheel", cover: photo("jazz", 900, 400), going: 320, interested: 890 },
  { id: "e-2", title: "Open Source Meetup", date: "Thu, 24 Sep · 6:30 PM", location: "Banani", cover: photo("meetup", 900, 400), going: 74, interested: 210 },
];

export const jobs: Job[] = [
  { id: "j-1", title: "Frontend Engineer", company: "Northlight Studio", location: "Dhaka · Hybrid", type: "Full-time", salary: "৳90k–120k" },
  { id: "j-2", title: "Community Moderator", company: "OneBook", location: "Remote", type: "Contract", salary: "৳40k–55k" },
];

export const notifications: NotificationItem[] = [
  { id: "n-1", text: "Aya Rahman reacted Love to your post.", time: "2m", unread: true, type: "reaction", avatar: users[1].avatar },
  { id: "n-2", text: "Sara Noor accepted your friend request.", time: "20m", unread: true, type: "friend", avatar: users[3].avatar },
  { id: "n-3", text: "Nabil Khan commented on your photo.", time: "1h", unread: false, type: "comment", avatar: users[2].avatar },
  { id: "n-4", text: "Live: Cafe Linden started a broadcast.", time: "3h", unread: false, type: "live", avatar: avatar("cafe") },
];

export const friendSuggestions = users.filter((u) => u.id !== currentUser.id);

export const loginHistory = [
  { id: "l-1", device: "Chrome · Windows", location: "Dhaka, BD", time: "Today, 4:12 PM", current: true },
  { id: "l-2", device: "OneBook iOS", location: "Dhaka, BD", time: "Yesterday, 9:01 AM", current: false },
  { id: "l-3", device: "Safari · Mac", location: "Chattogram, BD", time: "11 Sep, 8:44 PM", current: false },
];

export const reports = [
  { id: "r-1", target: "Post p-2", reason: "Spam", status: "Open", reporter: "Reza Ahmed" },
  { id: "r-2", target: "User @nabil.k", reason: "Harassment", status: "In review", reporter: "Aya Rahman" },
  { id: "r-3", target: "Group Home Cooks BD", reason: "Misleading", status: "Resolved", reporter: "Sara Noor" },
];

export const ads = [
  { id: "a-1", name: "Autumn coffee drop", status: "Active", impressions: "124k", clicks: "3.1k", ctr: "2.5%", budget: "৳18,000" },
  { id: "a-2", name: "Studio hiring", status: "Paused", impressions: "22k", clicks: "410", ctr: "1.8%", budget: "৳6,500" },
];
