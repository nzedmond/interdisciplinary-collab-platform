export type Role = "student" | "faculty" | "admin";

export type UserProfile = {
  id: string;
  name: string;
  role: Role;
  department: string;
  majorOrTitle: string;
  graduationYear?: number;
  skills: string[];
  interests: string[];
  portfolioUrl?: string;
  githubUrl?: string;
};

export type ProjectStatus = "open" | "reviewing" | "filled";

export type Project = {
  id: string;
  title: string;
  owner: string;
  ownerRole: "Faculty" | "Student" | "Staff";
  departments: string[];
  category: string;
  description: string;
  requiredSkills: string[];
  helpfulSkills: string[];
  commitment: string;
  duration: string;
  goals: string[];
  status: ProjectStatus;
  applicants: number;
  matchScore: number;
  recommendationReason: string;
};

export type Application = {
  id: string;
  projectTitle: string;
  applicantName: string;
  status: "submitted" | "interview" | "accepted" | "declined";
  submittedAt: string;
};
