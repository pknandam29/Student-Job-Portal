import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// Set up server-side body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database file path for state persistence
const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize database with premium boilerplate data if it doesn't exist
const initialDb = {
  users: [
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@portal.com',
      password: 'admin123',
      role: 'Admin',
      date_joined: '2026-01-15T12:00:00Z',
    },
    {
      id: 'usr_poster',
      username: 'InnovateCorp',
      email: 'poster@company.com',
      password: 'poster123',
      role: 'Poster',
      date_joined: '2026-03-10T14:30:00Z',
    },
    {
      id: 'usr_student',
      username: 'alex_dev',
      email: 'student@college.edu',
      password: 'student123',
      role: 'Student',
      date_joined: '2026-04-01T09:15:00Z',
    },
  ],
  studentProfiles: {
    usr_student: {
      name: 'Alex Rivera',
      email: 'student@college.edu',
      phone: '555-0199',
      collegeName: 'State Tech University',
      degree: 'B.S. in Computer Science',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Python'],
      resumeText: 'Alex Rivera\nEmail: student@college.edu\nPhone: 555-0199\nEducation: B.S. in Computer Science at State Tech University\nSkills: React, TypeScript, Tailwind CSS, JavaScript, HTML/CSS, Node.js, Python, Flask.\n\nProjects:\n- Job Finder Mobile Application (Built with React Native & integrated REST APIs for real-time postings)\n- Student Expense Tracker Dashboard (Designed a complex state analytics interface using Tailwind and Recharts)\n\nAchievements:\n- 1st Place in Local Hackathon 2025\n- Dean\'s List (All terms)',
      profilePic: '',
      savedJobs: [],
    },
  },
  jobs: [
    {
      id: 'job_1',
      title: 'Frontend Developer Intern',
      company: 'InnovateCorp',
      description: 'We are seeking a motivated Frontend Developer Intern to join our digital solutions team. You will participate in designing responsive user interfaces, implementing components with React and Tailwind CSS, and working closely with our product designers.\n\nRequirements:\n- Proficient in HTML, CSS, JavaScript.\n- Basic understanding of React and modern state management.\n- Enthusiastic about writing clean, modular component structures.',
      location: 'San Francisco, CA (Hybrid)',
      salary: '$30 - $45 / hour',
      jobType: 'Internship',
      requiredSkills: ['React', 'CSS', 'JavaScript'],
      deadline: '2026-07-20',
      contactInfo: 'careers@innovatecorp.com',
      createdBy: 'usr_poster',
      createdByName: 'InnovateCorp',
      status: 'Approved',
      createdAt: '2026-05-15T11:00:00Z',
      screeningQuestions: [
        "Explain your experience with Tailwind CSS.",
        "What React state management library do you prefer and why?"
      ],
    },
    {
      id: 'job_2',
      title: 'Graduate Software Engineer',
      company: 'InnovateCorp',
      description: 'Join InnovateCorp as a full-time Graduate Software Engineer. This is an accelerated path to learning enterprise systems. You will work on standard API architectures, relational databases, cloud microservices, and end-to-end system testing.\n\nWhat We Offer:\n- Mentorship from senior developers.\n- Generous education stipend.\n- Comprehensive health benefit plans.',
      location: 'Remote (US)',
      salary: '$85,000 - $105,000 / year',
      jobType: 'Remote',
      requiredSkills: ['Node.js', 'SQL', 'TypeScript'],
      deadline: '2026-08-15',
      contactInfo: 'hr@innovatecorp.com',
      createdBy: 'usr_poster',
      createdByName: 'InnovateCorp',
      status: 'Approved',
      createdAt: '2026-05-20T14:00:00Z',
    },
    {
      id: 'job_3',
      title: 'UI/UX Designer Apprentice',
      company: 'Creative Studio',
      description: 'Help us shape the interactive designs of tomorrow! We are looking for an apprentice focusing on wireframing, layout proportions, visual balance, and UX design flows.\n\nRequirements:\n- Figma knowledge.\n- Understanding of user-centered design paradigms.',
      location: 'New York, NY',
      salary: '$22 - $28 / hour',
      jobType: 'Part Time',
      requiredSkills: ['Figma', 'UI Design', 'Wireframing'],
      deadline: '2026-06-30',
      contactInfo: 'hire@creativestudio.com',
      createdBy: 'usr_poster',
      createdByName: 'InnovateCorp',
      status: 'Pending',
      createdAt: '2026-05-28T16:45:00Z',
    },
    {
      id: 'job_4',
      title: 'AI Engineering Specialist (Research)',
      company: 'Brainwave AI',
      description: 'Seeking a research contractor to assist in optimizing and fine-tuning prompt chains using Large Language Models and validating structural integrity in JSON outputs.\n\nRequirements:\n- Knowledge of Python and standard LLM APIs.\n- Understanding of token cost controls.',
      location: 'Remote (Global)',
      salary: '$60 - $80 / hour',
      jobType: 'Full Time',
      requiredSkills: ['Python', 'Gemini API', 'AI Engineering'],
      deadline: '2026-07-01',
      contactInfo: 'apply@brainwave.ai',
      createdBy: 'usr_poster',
      createdByName: 'InnovateCorp',
      status: 'Rejected',
      createdAt: '2026-05-25T10:00:00Z',
    },
  ],
  applications: [
    {
      id: 'app_1',
      jobId: 'job_1',
      studentId: 'usr_student',
      studentName: 'Alex Rivera',
      studentEmail: 'student@college.edu',
      studentProfile: {
        name: 'Alex Rivera',
        email: 'student@college.edu',
        phone: '555-0199',
        collegeName: 'State Tech University',
        degree: 'B.S. in Computer Science',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Python'],
        resumeText: 'Alex Rivera\nEmail: student@college.edu\nPhone: 555-0199\nEducation: B.S. in Computer Science at State Tech University\nSkills: React, TypeScript, Tailwind CSS, JavaScript, HTML/CSS, Node.js, Python, Flask.\n\nProjects:\n- Job Finder Mobile Application (Built with React Native & integrated REST APIs for real-time postings)\n- Student Expense Tracker Dashboard (Designed a complex state analytics interface using Tailwind and Recharts)\n\nAchievements:\n- 1st Place in Local Hackathon 2025\n- Dean\'s List (All terms)',
        profilePic: '',
        savedJobs: [],
      },
      resumeText: 'Alex Rivera\'s CS Resume. State Tech University Graduate.',
      appliedAt: '2026-05-29T11:24:00Z',
      status: 'Applied',
      answers: [
        { question: "Explain your experience with Tailwind CSS.", answer: "I have used Tailwind CSS across two projects, designing a fully custom dashboard using flex layouts, CSS variables, and modern Tailwind directives." },
        { question: "What React state management library do you prefer and why?", answer: "I prefer standard React Context for mid-sized apps, but for larger client applications, I use Zustand or Redux Toolkit." }
      ],
    },
  ],
  messages: [
    {
      id: 'msg_1',
      jobId: 'job_1',
      applicationId: 'app_1',
      senderId: 'usr_poster',
      senderRole: 'Poster',
      senderName: 'InnovateCorp Recruiter',
      message: 'Hello Alex, thank you for applying to the Frontend Developer Intern position! Your React projects look highly impressive. When are you available for a introductory call next week?',
      timestamp: '2026-05-29T14:30:00Z',
    },
    {
      id: 'msg_2',
      jobId: 'job_1',
      applicationId: 'app_1',
      senderId: 'usr_student',
      senderRole: 'Student',
      senderName: 'Alex Rivera',
      message: 'Hello! Thank you so much for reaching out. I am available anytime on Monday or Wednesday afternoon (after 1:00 PM EST). Looking forward to discussing how I can contribute!',
      timestamp: '2026-05-29T15:15:00Z',
    },
  ],
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, using fresh template', err);
    return initialDb;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB', err);
  }
}

// Ensure database file is generated immediately
readDb();

// ----------------------------------------------------
// server-side lazy initialized Gemini client
// ----------------------------------------------------
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is missing from environment. Add it via settings.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. App Statistics
app.get('/api/stats', (req, res) => {
  const db = readDb();
  const totalUsers = db.users.length;
  const totalJobs = db.jobs.length;
  const pendingJobs = db.jobs.filter((j: any) => j.status === 'Pending').length;
  const approvedJobs = db.jobs.filter((j: any) => j.status === 'Approved').length;
  const rejectedJobs = db.jobs.filter((j: any) => j.status === 'Rejected').length;
  const totalApplications = db.applications.length;

  res.json({
    totalUsers,
    totalJobs,
    pendingJobs,
    approvedJobs,
    rejectedJobs,
    totalApplications,
  });
});

// 2. Auth - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      date_joined: user.date_joined,
    },
  });
});

// 3. Auth - Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Please populate all fields.' });
  }

  const db = readDb();
  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    username,
    email,
    password,
    role,
    date_joined: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Initialize student profile if role is Student
  if (role === 'Student') {
    db.studentProfiles[newUser.id] = {
      name: username,
      email: email,
      phone: '',
      collegeName: '',
      degree: '',
      skills: [],
      resumeText: '',
      profilePic: '',
      savedJobs: [],
    };
  }

  writeDb(db);

  res.status(201).json({
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      date_joined: newUser.date_joined,
    },
  });
});

// 4. Jobs Portal - GET Jobs (Filters based on role)
app.get('/api/jobs', (req, res) => {
  const { role, userId } = req.query;
  const db = readDb();
  
  // Rules:
  // - Students only see APPROVED jobs.
  // - Job Posters see all jobs they created.
  // - Admin sees ALL jobs.
  if (role === 'Admin') {
    return res.json(db.jobs);
  } else if (role === 'Poster' && userId) {
    const posterJobs = db.jobs.filter((j: any) => j.createdBy === userId);
    return res.json(posterJobs);
  } else {
    // Student, guest, or unauthenticated -> only approved jobs
    const approvedJobs = db.jobs.filter((j: any) => j.status === 'Approved');
    return res.json(approvedJobs);
  }
});

// 5. Jobs Portal - Create Job
app.post('/api/jobs', (req, res) => {
  const { title, company, description, location, salary, jobType, requiredSkills, deadline, contactInfo, createdBy, createdByName, screeningQuestions } = req.body;

  if (!title || !company || !description || !location || !salary || !jobType || !deadline) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  const db = readDb();
  const newJob = {
    id: 'job_' + Date.now(),
    title,
    company,
    description,
    location,
    salary,
    jobType,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    deadline,
    contactInfo,
    createdBy,
    createdByName: createdByName || company,
    status: 'Pending', // Verified workflow starts at Pending
    createdAt: new Date().toISOString(),
    screeningQuestions: Array.isArray(screeningQuestions) ? screeningQuestions : [],
  };

  db.jobs.push(newJob);
  writeDb(db);

  res.status(201).json(newJob);
});

// 6. Jobs Portal - Edit Job
app.put('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const { title, company, description, location, salary, jobType, requiredSkills, deadline, contactInfo, screeningQuestions } = req.body;

  const db = readDb();
  const index = db.jobs.findIndex((j: any) => j.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Update details and set status back to Pending so admin verifies the edits!
  db.jobs[index] = {
    ...db.jobs[index],
    title,
    company,
    description,
    location,
    salary,
    jobType,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    deadline,
    contactInfo,
    status: 'Pending', // Edits require re-approval!
    screeningQuestions: Array.isArray(screeningQuestions) ? screeningQuestions : [],
  };

  writeDb(db);
  res.json(db.jobs[index]);
});

// 7. Jobs Portal - Delete Job
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialCount = db.jobs.length;
  db.jobs = db.jobs.filter((j: any) => j.id !== id);

  if (db.jobs.length === initialCount) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  db.applications = db.applications.filter((a: any) => a.jobId !== id);
  db.messages = db.messages.filter((m: any) => m.jobId !== id);

  writeDb(db);
  res.json({ success: true, message: 'Job deleted successfully' });
});

// 8. Admin Job Actions (Approve/Reject)
app.patch('/api/jobs/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' | 'Rejected' | 'Pending'

  if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status option.' });
  }

  const db = readDb();
  const index = db.jobs.findIndex((j: any) => j.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  db.jobs[index].status = status;
  writeDb(db);
  res.json(db.jobs[index]);
});

// 9. Student Profile - GET
app.get('/api/student/profile/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = readDb();

  let profile = db.studentProfiles[studentId];
  if (!profile) {
    const user = db.users.find((u: any) => u.id === studentId);
    profile = {
      name: user ? user.username : 'Student',
      email: user ? user.email : '',
      phone: '',
      collegeName: '',
      degree: '',
      skills: [],
      resumeText: '',
      profilePic: '',
    };
    db.studentProfiles[studentId] = profile;
    writeDb(db);
  }

  res.json(profile);
});

// 10. Student Profile - UPDATE
app.put('/api/student/profile/:studentId', (req, res) => {
  const { studentId } = req.params;
  const { name, email, phone, collegeName, degree, skills, resumeText, profilePic, savedJobs } = req.body;

  const db = readDb();
  const existingProfile = db.studentProfiles[studentId] || {};
  db.studentProfiles[studentId] = {
    name,
    email,
    phone,
    collegeName,
    degree,
    skills: Array.isArray(skills) ? skills : [],
    resumeText: resumeText || '',
    profilePic: profilePic || '',
    savedJobs: Array.isArray(savedJobs) ? savedJobs : (existingProfile.savedJobs || []),
  };

  writeDb(db);
  res.json(db.studentProfiles[studentId]);
});

// 11. Applications - Apply
app.post('/api/applications', (req, res) => {
  const { jobId, studentId, resumeText, answers } = req.body;

  if (!jobId || !studentId) {
    return res.status(400).json({ error: 'Missing jobId or studentId.' });
  }

  const db = readDb();
  const exists = db.applications.find((a: any) => a.jobId === jobId && a.studentId === studentId);
  if (exists) {
    return res.status(400).json({ error: 'You have already applied to this job.' });
  }

  const studentProfile = db.studentProfiles[studentId] || { name: 'Student', email: '' };
  
  const newApp = {
    id: 'app_' + Date.now(),
    jobId,
    studentId,
    studentName: studentProfile.name,
    studentEmail: studentProfile.email,
    studentProfile,
    resumeText: resumeText || studentProfile.resumeText || '',
    appliedAt: new Date().toISOString(),
    status: 'Applied',
    answers: Array.isArray(answers) ? answers : [],
  };

  db.applications.push(newApp);
  writeDb(db);

  res.status(201).json(newApp);
});

// 12. Applications - GET (Students see theirs, recruiters/posters see theirs for owned jobs, admin sees all)
app.get('/api/applications', (req, res) => {
  const { role, userId } = req.query;
  const db = readDb();

  if (role === 'Student') {
    const studentApps = db.applications.filter((a: any) => a.studentId === userId);
    // Enrich with Job details
    const enriched = studentApps.map((app: any) => {
      const job = db.jobs.find((j: any) => j.id === app.jobId);
      return { ...app, job };
    });
    return res.json(enriched);
  } else if (role === 'Poster') {
    // Get jobs created by this poster
    const posterJobs = db.jobs.filter((j: any) => j.createdBy === userId);
    const posterJobIds = posterJobs.map((j: any) => j.id);

    // Get applications to these jobs
    const applications = db.applications.filter((a: any) => posterJobIds.includes(a.jobId));
    const enriched = applications.map((app: any) => {
      const job = db.jobs.find((j: any) => j.id === app.jobId);
      return { ...app, job };
    });
    return res.json(enriched);
  } else if (role === 'Admin') {
    const enriched = db.applications.map((app: any) => {
      const job = db.jobs.find((j: any) => j.id === app.jobId);
      return { ...app, job };
    });
    return res.json(enriched);
  } else {
    res.json([]);
  }
});

// 13. Applications - Review Status update
app.patch('/api/applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Applied' | 'Reviewing' | 'Accepted' | 'Rejected'

  const db = readDb();
  const index = db.applications.findIndex((a: any) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  db.applications[index].status = status;
  writeDb(db);
  res.json(db.applications[index]);
});

// 14. ADMIN - Manage Users List
app.get('/api/admin/users', (req, res) => {
  const db = readDb();
  // Don't leak passwords to client directly
  const safeUsers = db.users.map(({ password, ...u }: any) => u);
  res.json(safeUsers);
});

// 15. ADMIN - Remove Inappropriate User Call
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (id === 'usr_admin') {
    return res.status(400).json({ error: 'Admin root user cannot be deleted.' });
  }

  db.users = db.users.filter((u: any) => u.id !== id);
  db.jobs = db.jobs.filter((j: any) => j.createdBy !== id);
  db.applications = db.applications.filter((a: any) => a.studentId !== id);
  
  writeDb(db);
  res.json({ success: true, message: 'User and all associated data purged successfully.' });
});

// 16. CHAT MESSAGES - Read & Write
app.get('/api/chats', (req, res) => {
  const { applicationId } = req.query;
  const db = readDb();
  const chats = db.messages.filter((m: any) => m.applicationId === applicationId);
  res.json(chats);
});

app.post('/api/chats', (req, res) => {
  const { jobId, applicationId, senderId, senderRole, senderName, message } = req.body;

  if (!applicationId || !senderId || !message) {
    return res.status(400).json({ error: 'Missing body fields.' });
  }

  const db = readDb();
  const newMsg = {
    id: 'msg_' + Date.now(),
    jobId,
    applicationId,
    senderId,
    senderRole,
    senderName,
    message,
    timestamp: new Date().toISOString(),
  };

  db.messages.push(newMsg);
  writeDb(db);
  res.status(201).json(newMsg);
});

// 17. GEMINI AI: RESUME REVIEW
app.post('/api/ai/resume-review', async (req, res) => {
  const { resumeText, targetJobTitle, targetJobDesc } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Please submit details to audit first.' });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an expert technical resume reviewer and career coach.
      Review the student resume profile below. Suggest 3 key actionable improvements,
      highlight strengths, note any missing keywords, and suggest layout/project ideas that can enhance their profile.

      ${targetJobTitle ? `They are targeting the role: "${targetJobTitle}".` : ''}
      ${targetJobDesc ? `Job Description points: "${targetJobDesc}".` : ''}

      STUDENT RESUME TEXT:
      """
      ${resumeText}
      """

      Format your response clearly using high-visibility Markdown. Keep it encouraging, professional, and specific. Include headers, bullet-points, and code-like tags for important skills. Keep your feedback under 400 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const suggestionsText = response.text || "Unable to parse feedback from Gemini right now.";
    res.json({ review: suggestionsText });
  } catch (err: any) {
    console.error('Error with Gemini AI Resume review:', err);
    res.status(500).json({
      error: err.message || 'Gemini review service temporarily unavailable. Confirm GEMINI_API_KEY settings.'
    });
  }
});

// ----------------------------------------------------
// VITE SETUP / MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Job Portal server successfully bound to http://0.0.0.0:${PORT}`);
  });
}

startServer();
