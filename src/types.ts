export type UserRole = 'Student' | 'Admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  date_joined: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  phone: string;
  collegeName: string;
  degree: string;
  skills: string[];
  resumeText: string;
  profilePic?: string;
  savedJobs?: string[]; // Saved job IDs
}

export type JobType = 'Full Time' | 'Part Time' | 'Internship' | 'Remote';
export type JobStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string;
  jobType: JobType;
  requiredSkills: string[];
  deadline: string;
  contactInfo: string;
  createdBy: string; // User ID
  createdByName?: string;
  status: JobStatus;
  createdAt: string;
  screeningQuestions?: string[]; // Custom recruiter questions
}

export type ApplicationStatus = 'Applied' | 'Reviewing' | 'Accepted' | 'Rejected';

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentProfile: StudentProfile;
  resumeText: string; // Plain text or file name represented as text
  appliedAt: string;
  status: ApplicationStatus;
  answers?: { question: string; answer: string }[]; // Answers to screening questions
}

export interface ChatMessage {
  id: string;
  jobId: string;
  applicationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface AppStats {
  totalUsers: number;
  totalJobs: number;
  pendingJobs: number;
  approvedJobs: number;
  rejectedJobs: number;
  totalApplications: number;
}
