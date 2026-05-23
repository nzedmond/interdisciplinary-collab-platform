import type { Application, Project, UserProfile } from "@/lib/types";

export const currentUser: UserProfile = {
  id: "user-1",
  name: "Maya Johnson",
  role: "student",
  department: "Computer Science",
  majorOrTitle: "Data Science major, Studio Art minor",
  graduationYear: 2027,
  skills: ["Python", "Data visualization", "Interview research", "React", "Storytelling"],
  interests: ["Climate justice", "Public humanities", "Creative coding", "Community archives"],
  portfolioUrl: "https://example.edu/maya",
  githubUrl: "https://github.com/example"
};

export const projects: Project[] = [
  {
    id: "p-001",
    title: "Mapping Urban Heat and Community Memory",
    owner: "Prof. Amina Okafor",
    ownerRole: "Faculty",
    departments: ["Environmental Studies", "History", "Computer Science"],
    category: "Research + Public Scholarship",
    description:
      "Build an interactive map that pairs neighborhood heat-island data with oral histories from residents.",
    requiredSkills: ["GIS", "Python", "Interview research"],
    helpfulSkills: ["Data visualization", "Public history", "Web design"],
    commitment: "5-7 hrs/week",
    duration: "Spring semester",
    goals: ["Prototype public map", "Analyze sensor data", "Publish community-facing exhibit"],
    status: "open",
    applicants: 6,
    matchScore: 94,
    recommendationReason:
      "Strong overlap with Python, data visualization, storytelling, and community archive interests."
  },
  {
    id: "p-002",
    title: "AI Studio for Accessible Music Pedagogy",
    owner: "Dr. Leo Marin",
    ownerRole: "Faculty",
    departments: ["Music", "Education", "Computer Science"],
    category: "Creative Technology",
    description:
      "Design assistive tools that help beginning musicians practice rhythm, notation, and ear training.",
    requiredSkills: ["React", "UX research", "Music theory"],
    helpfulSkills: ["Audio processing", "Accessibility testing", "TypeScript"],
    commitment: "3-5 hrs/week",
    duration: "10 weeks",
    goals: ["Run student interviews", "Build accessible prototype", "Evaluate learning outcomes"],
    status: "reviewing",
    applicants: 11,
    matchScore: 86,
    recommendationReason:
      "Recommended for React experience and interest in creative coding with human-centered research."
  },
  {
    id: "p-003",
    title: "Food Systems Dashboard for Campus Dining",
    owner: "Campus Sustainability Lab",
    ownerRole: "Staff",
    departments: ["Economics", "Environmental Studies", "Statistics"],
    category: "Civic Data",
    description:
      "Create a dashboard that tracks food sourcing, waste, cost, and student feedback across dining halls.",
    requiredSkills: ["Statistics", "Dashboard design", "Survey analysis"],
    helpfulSkills: ["SQL", "Data storytelling", "Policy writing"],
    commitment: "4 hrs/week",
    duration: "Academic year",
    goals: ["Model waste patterns", "Visualize sourcing data", "Recommend procurement changes"],
    status: "open",
    applicants: 4,
    matchScore: 78,
    recommendationReason:
      "Good fit for data visualization and climate justice interests, with room to build policy experience."
  },
  {
    id: "p-004",
    title: "Digital Archive of Student Activism",
    owner: "Rina Patel",
    ownerRole: "Student",
    departments: ["Sociology", "Library", "Media Studies"],
    category: "Archive + Storytelling",
    description:
      "Collect, preserve, and present student-led movements through a searchable multimedia archive.",
    requiredSkills: ["Archival research", "Content strategy", "Consent workflows"],
    helpfulSkills: ["Web publishing", "Audio editing", "Metadata design"],
    commitment: "2-4 hrs/week",
    duration: "Rolling",
    goals: ["Design intake process", "Catalog submissions", "Launch public collection"],
    status: "open",
    applicants: 8,
    matchScore: 82,
    recommendationReason:
      "Matches public humanities, storytelling, and community archive interests."
  }
];

export const applications: Application[] = [
  {
    id: "a-001",
    projectTitle: "Mapping Urban Heat and Community Memory",
    applicantName: "Maya Johnson",
    status: "interview",
    submittedAt: "2026-05-14"
  },
  {
    id: "a-002",
    projectTitle: "Digital Archive of Student Activism",
    applicantName: "Maya Johnson",
    status: "submitted",
    submittedAt: "2026-05-19"
  }
];

export const departments = [
  "All departments",
  "Computer Science",
  "Environmental Studies",
  "History",
  "Music",
  "Education",
  "Media Studies",
  "Sociology",
  "Statistics"
];

export const categories = [
  "All categories",
  "Research + Public Scholarship",
  "Creative Technology",
  "Civic Data",
  "Archive + Storytelling"
];
