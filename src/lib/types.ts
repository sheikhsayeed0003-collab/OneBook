export type Role = "owner" | "admin" | "moderator" | "user";
export type Privacy = "public" | "friends" | "only_me" | "custom";
export type Reaction = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  bio: string;
  about: string;
  location: string;
  website: string;
  joinedAt: string;
  avatar: string;
  cover: string;
  verified: boolean;
  role: Role;
  online: boolean;
  lastSeen: string;
  friends: number;
  followers: number;
  following: number;
};

export type Post = {
  id: string;
  author: User;
  text: string;
  images: string[];
  video?: string;
  feeling?: string;
  location?: string;
  privacy: Privacy;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  reaction?: Reaction;
  tagged?: string[];
  sharedFrom?: {
    id: string;
    author: User;
    text: string;
    images: string[];
  };
};

export type Comment = {
  id: string;
  author: User;
  text: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
};

export type Story = {
  id: string;
  author: User;
  type: "image" | "video" | "text";
  media: string;
  text?: string;
  views: number;
  createdAt: string;
};

export type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  group: boolean;
};

export type Message = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  read: boolean;
  status?: "Pending" | "Sending" | "Sent" | "Delivered" | "Read";
};

export type Group = {
  id: string;
  name: string;
  cover: string;
  privacy: "public" | "private";
  members: number;
  posts: number;
  description: string;
};

export type PageEntity = {
  id: string;
  name: string;
  category: string;
  cover: string;
  avatar: string;
  likes: number;
  followers: number;
  verified: boolean;
  bio: string;
};

export type Product = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  seller: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  cover: string;
  going: number;
  interested: number;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
};

export type NotificationItem = {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  type: string;
  avatar: string;
};
