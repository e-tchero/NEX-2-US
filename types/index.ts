// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  githubUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  title?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

// Portfolio Types
export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  url?: string;
  repoUrl?: string;
  imageUrl?: string;
  tags: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
}

// Business Engine Types
export interface Gig {
  id: string;
  userId: string;
  platform: "fiverr" | "upwork" | "other";
  title: string;
  description: string;
  price: number;
  deliveryTime: number;
  tags: string[];
  status: "draft" | "active" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  userId: string;
  gigId?: string;
  clientName: string;
  projectTitle: string;
  content: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Hack Lab Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  points: number;
  solution?: string;
  hints: string[];
  createdAt: Date;
}

export interface BugBounty {
  id: string;
  userId: string;
  platform: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "submitted" | "accepted" | "rejected" | "fixed";
  reward?: number;
  submittedAt: Date;
  resolvedAt?: Date;
}

// Learning Hub Types
export interface BlogPost {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  lessons: Lesson[];
  enrolled: number;
  rating: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
}

// Analytics Types
export interface Analytics {
  id: string;
  userId: string;
  pageViews: number;
  uniqueVisitors: number;
  projectClicks: number;
  downloadResume: number;
  date: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
