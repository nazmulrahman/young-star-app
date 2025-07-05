import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  Home,
  Users,
  ClipboardList,
  Calendar,
  Megaphone,
  MessageSquare,
  Book,
  LogOut,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  FileText,
  Image,
  ArrowLeft,
  GraduationCap,
  Code,
  ScrollText,
  Send,
  Bell,
  User,
  Settings,
  X,
  FileUp
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, onSnapshot, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore'; // Added deleteDoc

// --- Firebase Configuration ---
// IMPORTANT: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDUzJaV9K6IW2_O2HrVSm1_QTBkuBVl1Co",
  authDomain: "young-star-platform.firebaseapp.com",
  projectId: "young-star-platform",
  storageBucket: "young-star-platform.firebasestorage.app",
  messagingSenderId: "965704830662",
  appId: "1:965704830662:web:edc7fecf83f2ede880d1c7",
  measurementId: "G-6WPNWP94Q0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Context for User and Data ---
const AuthContext = createContext();
const DataContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { uid, email, role, name }
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role and name from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userDocSnap.data(), // Includes role and name
          });
        } else {
          // This case should ideally not happen if user creation is handled correctly on signup
          // For now, default to student if user doc doesn't exist (e.g., anonymous sign-in or new user)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'student', // Default role if no doc
            name: firebaseUser.email.split('@')[0], // Default name
          });
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener will handle setting the user state
      return true;
    } catch (error) {
      console.error("Login error:", error.message);
      return false;
    }
  };

  const registerAndCreateUserDoc = async (email, password, name, role) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userUid = userCredential.user.uid;

      await setDoc(doc(db, 'users', userUid), {
        name,
        email,
        role,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Registration error:", error.message);
      return false;
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loadingAuth, registerAndCreateUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
};

const DataProvider = ({ children }) => {
  const { user, loadingAuth } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);

  // Fetch all users (for instructor to assign tasks, message students)
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
      }, (error) => console.error("Error fetching users:", error));
      return () => unsubscribe();
    }
  }, [user, loadingAuth]);

  // Fetch tasks
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(fetchedTasks);
      }, (error) => console.error("Error fetching tasks:", error));
      return () => unsubscribe();
    }
  }, [user, loadingAuth]);

  // Fetch submissions
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'submissions'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(fetchedSubmissions);
      }, (error) => console.error("Error fetching submissions:", error));
      return () => unsubscribe();
    }
  }, [user, loadingAuth]);

  // Fetch meetings
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'meetings'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMeetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMeetings(fetchedMeetings);
      }, (error) => console.error("Error fetching meetings:", error));
      return () => unsubscribe();
    }
  }, [user, loadingAuth]);

  // Fetch announcements
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'announcements'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(fetchedAnnouncements);
      }, (error) => console.error("Error fetching announcements:", error));
      return () => unsubscribe();
    }
  }, [user, loadingAuth]);

  // Fetch messages relevant to the current user
  useEffect(() => {
    if (!loadingAuth && user) {
      const q1 = query(collection(db, 'messages'), where('senderId', '==', user.uid));
      const q2 = query(collection(db, 'messages'), where('receiverId', '==', user.uid));

      const unsubscribe1 = onSnapshot(q1, (snapshot) => {
        const sentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(prev => {
          const combined = [...prev.filter(msg => msg.senderId !== user.uid), ...sentMessages];
          return Array.from(new Map(combined.map(item => [item.id, item])).values()).sort((a,b) => a.timestamp?.toDate() - b.timestamp?.toDate());
        });
      }, (error) => console.error("Error fetching sent messages:", error));

      const unsubscribe2 = onSnapshot(q2, (snapshot) => {
        const receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(prev => {
          const combined = [...prev.filter(msg => msg.receiverId !== user.uid), ...receivedMessages];
          return Array.from(new Map(combined.map(item => [item.id, item])).values()).sort((a,b) => a.timestamp?.toDate() - b.timestamp?.toDate());
        });
      }, (error) => console.error("Error fetching received messages:", error));

      return () => {
        unsubscribe1();
        unsubscribe2();
      };
    }
  }, [user, loadingAuth]);

  // Fetch notes relevant to the current user
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'notes'), where('studentId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(fetchedNotes);
      }, (error) => console.error("Error fetching notes:", error));
      return () => unsubscribe();
    }
  }, [user, loadingAuth]);


  // CRUD Operations using Firestore
  const addStudent = async (email, password, name) => {
    // This function will be called during instructor's "Add New Student"
    // It will create a Firebase Auth user and a Firestore user doc.
    try {
      await createUserWithEmailAndPassword(auth, email, password); // Creates auth user
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // Sign in to get UID
      const userUid = userCredential.user.uid;
      await setDoc(doc(db, 'users', userUid), {
        name,
        email,
        role: 'student',
        createdAt: serverTimestamp(),
      });
      await signOut(auth); // Sign out the newly created user
      return true;
    } catch (error) {
      console.error("Error adding student:", error.message);
      alert(`Error adding student: ${error.message}`);
      return false;
    }
  };


  const createTask = async (newTask) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const updateTask = async (taskId, updatedData) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), updatedData);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const addSubmission = async (taskId, studentId, code) => {
    try {
      // Check if a submission already exists for this task and student
      const q = query(collection(db, 'submissions'),
                      where('taskId', '==', taskId),
                      where('studentId', '==', studentId));
      const existingSubmissions = await getDocs(q);

      if (!existingSubmissions.empty) {
        // Update existing submission
        const submissionDoc = existingSubmissions.docs[0];
        await updateDoc(doc(db, 'submissions', submissionDoc.id), {
          code,
          submittedAt: serverTimestamp(),
          status: 'submitted', // Reset status if resubmitting
          // grade and feedback are kept unless instructor changes them
        });
      } else {
        // Create new submission
        await addDoc(collection(db, 'submissions'), {
          taskId,
          studentId,
          code,
          submittedAt: serverTimestamp(),
          status: 'submitted',
          grade: null,
          feedback: null,
        });
      }
    } catch (error) {
      console.error("Error adding/updating submission:", error);
    }
  };

  const updateSubmissionGradeAndFeedback = async (submissionId, grade, feedback) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        grade: Number(grade), // Ensure grade is a number
        feedback,
        status: 'graded',
      });
    } catch (error) {
      console.error("Error updating submission grade/feedback:", error);
    }
  };

  const scheduleMeeting = async (newMeeting) => {
    try {
      await addDoc(collection(db, 'meetings'), {
        ...newMeeting,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
    }
  };

  const createAnnouncement = async (newAnnouncement) => {
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        date: new Date().toISOString().split('T')[0], // Keep date string for display
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  const sendMessage = async (senderId, receiverId, content) => {
    try {
      await addDoc(collection(db, 'messages'), {
        senderId,
        receiverId,
        content,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const addNote = async (studentId, title, content, type, imageUrl = null) => {
    try {
      await addDoc(collection(db, 'notes'), {
        studentId,
        title,
        content,
        type,
        imageUrl,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        users, // All users (students + instructor)
        students: users.filter(u => u.role === 'student'), // Filtered students
        tasks,
        submissions,
        meetings,
        announcements,
        messages,
        notes,
        addStudent,
        createTask,
        updateTask,
        addSubmission,
        updateSubmissionGradeAndFeedback,
        scheduleMeeting,
        createAnnouncement,
        sendMessage,
        addNote,
        deleteNote,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// --- Reusable Components ---

const Navbar = ({ user, logout, navigate, role }) => (
  <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg flex justify-between items-center rounded-b-lg">
    <div className="flex items-center space-x-3">
      <GraduationCap className="h-8 w-8" />
      <span className="text-2xl font-bold tracking-wide">Young-Star</span>
    </div>
    <div className="flex items-center space-x-4">
      {user && (
        <span className="text-lg font-medium hidden md:block">Welcome, {user.name}!</span>
      )}
      <button
        onClick={logout}
        className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md transition duration-300 ease-in-out"
      >
        <LogOut className="h-5 w-5" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  </nav>
);

const Sidebar = ({ navigate, role, currentPage }) => {
  const instructorNav = [
    { name: 'Dashboard', icon: Home, page: 'instructor-dashboard' },
    { name: 'Students', icon: Users, page: 'instructor-students' },
    { name: 'Tasks', icon: ClipboardList, page: 'instructor-tasks' },
    { name: 'Meetings', icon: Calendar, page: 'instructor-meetings' },
    { name: 'Announcements', icon: Megaphone, page: 'instructor-announcements' },
    { name: 'Messages', icon: MessageSquare, page: 'instructor-messages' },
  ];

  const studentNav = [
    { name: 'Dashboard', icon: Home, page: 'student-dashboard' },
    { name: 'My Tasks', icon: ClipboardList, page: 'student-tasks' },
    { name: 'My Notes', icon: Book, page: 'student-notes' },
    { name: 'Meetings', icon: Calendar, page: 'student-meetings' },
    { name: 'Announcements', icon: Megaphone, page: 'student-announcements' },
    { name: 'Messages', icon: MessageSquare, page: 'student-messages' },
  ];

  const navItems = role === 'instructor' ? instructorNav : studentNav;

  return (
    <div className="w-64 bg-gray-800 text-white p-6 shadow-xl rounded-r-lg flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-blue-300">Menu</h2>
      </div>
      <ul className="space-y-4 flex-grow">
        {navItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => navigate(item.page)}
              className={`flex items-center w-full px-4 py-3 rounded-lg text-lg font-medium transition duration-300 ease-in-out
                ${currentPage === item.page ? 'bg-blue-700 text-white shadow-md' : 'hover:bg-gray-700 hover:text-blue-200'}`}
            >
              <item.icon className="h-6 w-6 mr-3" />
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Card = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg ${className}`}>
    {title && <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>}
    {children}
  </div>
);

const Button = ({ children, onClick, className = '', variant = 'primary', icon: Icon = null }) => {
  const baseStyle = 'flex items-center justify-center px-5 py-2 rounded-full font-semibold transition duration-300 ease-in-out shadow-md';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2" />}
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder = '', className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
    />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder = '', className = '', rows = 5 }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-y"
    ></textarea>
  </div>
);

const Select = ({ label, value, onChange, options, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

// --- Pages ---

// Login Page
const LoginPage = ({ login, registerAndCreateUserDoc }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // Default to student for new registrations
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegistering) {
      const success = await registerAndCreateUserDoc(email, password, name, role);
      if (success) {
        alert('Registration successful! Please log in.');
        setIsRegistering(false); // Switch back to login form
        setEmail('');
        setPassword('');
        setName('');
        setRole('student');
      } else {
        setError('Registration failed. Please try again.');
      }
    } else {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password.');
      }
      // If success, AuthProvider's onAuthStateChanged will handle redirection
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Card className="max-w-md w-full p-8 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome to Young-Star</h2>
        <p className="text-center text-gray-600 mb-8">{isRegistering ? 'Create Your Account' : 'Login to Your Portal'}</p>
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <Input
                label="Your Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
              <Select
                label="Register As"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'instructor', label: 'Instructor (Requires Admin Approval)' } // Note for real app
                ]}
              />
            </>
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button type="submit" className="w-full mt-4" icon={isRegistering ? Plus : LogOut}>
            {isRegistering ? 'Register' : 'Login'}
          </Button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-6">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsRegistering(false)} className="text-blue-600 hover:underline">
                Login here
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsRegistering(true)} className="text-blue-600 hover:underline">
                Register here
              </button>
            </>
          )}
        </p>
        {!isRegistering && (
          <p className="text-center text-gray-500 text-sm mt-2">
            Hint: Use `instructor@example.com` or `student1@example.com` with password `password` if you haven't registered.
          </p>
        )}
      </Card>
    </div>
  );
};

// --- Instructor Pages ---

const InstructorDashboard = ({ navigate }) => {
  const { users, tasks, submissions, meetings, announcements } = useContext(DataContext);
  const students = users.filter(u => u.role === 'student');

  const tasksNeedingGrading = submissions.filter(sub => sub.status === 'submitted' && sub.grade === null);

  const upcomingMeetings = meetings.filter(meet => {
    const meetDateTime = new Date(`${meet.date}T${meet.time}`);
    return meetDateTime >= new Date();
  }).sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  const latestAnnouncements = [...announcements].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)).slice(0, 3);

  // Calculate student reports
  const studentReports = students.map(student => {
    const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
    const completedTasksCount = studentSubmissions.filter(sub => sub.status === 'graded').length;
    const totalPoints = studentSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    const assignedTasksCount = tasks.filter(task => task.assignedTo.includes(student.id)).length;
    const overallProgress = assignedTasksCount > 0 ? Math.round((completedTasksCount / assignedTasksCount) * 100) : 0;

    return {
      ...student,
      completedTasksCount,
      assignedTasksCount,
      totalPoints,
      overallProgress,
    };
  });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Instructor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Quick Stats">
          <p className="text-gray-700 text-lg mb-2">
            <span className="font-bold text-blue-600">{tasksNeedingGrading.length}</span> Submissions Needing Grading
          </p>
          <p className="text-gray-700 text-lg mb-2">
            <span className="font-bold text-blue-600">{students.length}</span> Total Students
          </p>
          <p className="text-gray-700 text-lg">
            <span className="font-bold text-blue-600">{upcomingMeetings.length}</span> Upcoming Meetings
          </p>
        </Card>

        <Card title="Upcoming Meetings">
          {upcomingMeetings.length > 0 ? (
            <ul className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <li key={meeting.id} className="text-gray-700">
                  <span className="font-semibold">{meeting.topic}</span> on {meeting.date} at {meeting.time}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No upcoming meetings.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('instructor-meetings')} icon={Calendar}>
            View All Meetings
          </Button>
        </Card>

        <Card title="Latest Announcements">
          {latestAnnouncements.length > 0 ? (
            <ul className="space-y-3">
              {latestAnnouncements.map((ann) => (
                <li key={ann.id} className="text-gray-700">
                  <span className="font-semibold">{ann.title}</span> ({ann.date})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No announcements yet.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('instructor-announcements')} icon={Megaphone}>
            Manage Announcements
          </Button>
        </Card>
      </div>

      <Card title="Student Progress Reports">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Completed Tasks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Overall Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {studentReports.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.completedTasksCount} / {student.assignedTasksCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.totalPoints}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${student.overallProgress}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs">{student.overallProgress}%</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button variant="secondary" size="sm" onClick={() => alert(`Viewing detailed report for ${student.name}`)} icon={Eye}>
                    View Report
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const InstructorStudentsPage = ({ navigate }) => {
  const { users, addStudent } = useContext(DataContext);
  const students = users.filter(u => u.role === 'student');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');

  const handleAddStudent = async () => {
    if (newStudentName && newStudentEmail && newStudentPassword) {
      const success = await addStudent(newStudentEmail, newStudentPassword, newStudentName);
      if (success) {
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentPassword('');
        setIsAddStudentModalOpen(false);
        alert('Student added successfully!');
      } else {
        alert('Failed to add student. Check console for errors.');
      }
    } else {
      alert('Please fill all fields.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Manage Students</h1>
      <Button onClick={() => setIsAddStudentModalOpen(true)} icon={Plus} className="mb-6">
        Add New Student
      </Button>

      <Card>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Firebase UID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => alert(`Viewing profile for ${student.name}`)} icon={Eye}>
                    View Profile
                  </Button>
                  {/* Deleting users/students from Firebase Auth and Firestore is a more complex operation
                      that should ideally be handled via a secure backend function, not directly from frontend.
                      So, keeping delete button commented out.
                  <Button variant="danger" size="sm" onClick={() => alert(`Deleting ${student.name}`)} icon={Trash2}>
                    Delete
                  </Button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} title="Add New Student">
        <Input label="Student Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="John Doe" />
        <Input label="Student Email" type="email" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} placeholder="john.doe@example.com" />
        <Input label="Temporary Password" type="password" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} placeholder="Set initial password" />
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsAddStudentModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStudent} icon={Plus}>Add Student</Button>
        </div>
      </Modal>
    </div>
  );
};

const InstructorTasksPage = ({ navigate }) => {
  const { tasks, users, createTask, updateTask, submissions, updateSubmissionGradeAndFeedback } = useContext(DataContext);
  const students = users.filter(u => u.role === 'student');

  const [editingTask, setEditingTask] = useState(null); // null for new, object for edit
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'grade'
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState(null); // Full submission object

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignedStudents, setFormAssignedStudents] = useState([]);

  const handleOpenCreateTask = () => {
    setEditingTask(null); // Clear for new task
    setFormTitle('');
    setFormDescription('');
    setFormDueDate('');
    setFormAssignedStudents([]);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormDueDate(task.dueDate);
    setFormAssignedStudents(task.assignedTo || []);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle || !formDescription || !formDueDate) {
      alert('Please fill in all required fields.');
      return;
    }

    const taskData = {
      title: formTitle,
      description: formDescription,
      dueDate: formDueDate,
      assignedTo: formAssignedStudents,
    };

    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask(taskData);
    }
    setIsTaskModalOpen(false);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmissionForGrading(submission);
    setCurrentView('grade');
  };

  const currentTaskForGrading = selectedSubmissionForGrading ? tasks.find(t => t.id === selectedSubmissionForGrading.taskId) : null;
  const studentForGrading = selectedSubmissionForGrading ? users.find(u => u.id === selectedSubmissionForGrading.studentId) : null;

  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (selectedSubmissionForGrading) {
      setGrade(selectedSubmissionForGrading.grade || '');
      setFeedback(selectedSubmissionForGrading.feedback || '');
    }
  }, [selectedSubmissionForGrading]);

  const handleSaveGradeAndFeedback = async () => {
    if (selectedSubmissionForGrading) {
      await updateSubmissionGradeAndFeedback(selectedSubmissionForGrading.id, grade, feedback);
      setCurrentView('list');
      setSelectedSubmissionForGrading(null);
    }
  };

  if (currentView === 'grade' && selectedSubmissionForGrading) {
    return (
      <div className="p-8">
        <Button variant="secondary" onClick={() => setCurrentView('list')} icon={ArrowLeft} className="mb-6">
          Back to Tasks
        </Button>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
          Grade Task: "{currentTaskForGrading?.title}" for {studentForGrading?.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Student's Submission">
            <h4 className="font-semibold text-gray-700 mb-2">Submitted Code:</h4>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto border border-gray-200">
              <code className="language-python">{selectedSubmissionForGrading?.code || 'No code submitted.'}</code>
            </pre>
            {/* Mock for autograder output */}
            <h4 className="font-semibold text-gray-700 mt-4 mb-2">Mock Output/Test Results:</h4>
            <div className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto border border-gray-200 text-green-700">
              <p>Running tests...</p>
              <p>Test 1: Passed</p>
              <p>Test 2: Failed - Expected 'Hello, World! Alice', got 'Hello, World!'</p>
              <p>Overall: 1/2 tests passed.</p>
            </div>
          </Card>

          <Card title="Provide Feedback">
            <Input
              label="Grade (e.g., 90)"
              type="number"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mb-4"
            />
            <Textarea
              label="Feedback (Rich Text Editor Mock)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback here..."
              rows={10}
            />
            <Button onClick={handleSaveGradeAndFeedback} icon={CheckCircle} className="mt-4 w-full">
              Save Grade & Feedback
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Manage Tasks</h1>
      <Button onClick={handleOpenCreateTask} icon={Plus} className="mb-6">
        Create New Task
      </Button>

      <Card>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Task Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => {
              const taskSubmissions = submissions.filter(sub => sub.taskId === task.id);
              const submittedCount = taskSubmissions.length;
              const needingGradeCount = taskSubmissions.filter(sub => sub.status === 'submitted' && sub.grade === null).length;

              return (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {task.assignedTo.length === users.filter(u => u.role === 'student').length ? 'All Students' : task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {submittedCount} / {task.assignedTo.length} submitted
                    <br />
                    {needingGradeCount > 0 && <span className="text-red-500">{needingGradeCount} needing grade</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenEditTask(task)} icon={Edit}>
                      Edit
                    </Button>
                    {needingGradeCount > 0 && (
                      <Button variant="primary" size="sm" onClick={() => handleGradeSubmission(taskSubmissions.find(sub => sub.status === 'submitted' && sub.grade === null))} icon={GraduationCap}>
                        Grade
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask ? 'Edit Task' : 'Create New Task'}>
        <Input label="Task Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Python Functions" required />
        <Textarea label="Description (Rich Text Editor Mock)" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Provide detailed instructions and requirements..." rows={8} required />
        <Input label="Due Date" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required />
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">Assign to Students</label>
          <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`assign-${student.id}`}
                  checked={formAssignedStudents.includes(student.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormAssignedStudents((prev) => [...prev, student.id]);
                    } else {
                      setFormAssignedStudents((prev) => prev.filter((id) => id !== student.id));
                    }
                  }}
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`assign-${student.id}`} className="text-gray-700 text-sm">{student.name}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTask} icon={Plus}>
            {editingTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const InstructorMeetingsPage = ({ navigate }) => {
  const { meetings, users, scheduleMeeting } = useContext(DataContext);
  const students = users.filter(u => u.role === 'student');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInvitedStudents, setFormInvitedStudents] = useState([]);

  const handleScheduleMeeting = async () => {
    if (!formTopic || !formDate || !formTime || !formLink) {
      alert('Please fill all required fields.');
      return;
    }
    await scheduleMeeting({
      topic: formTopic,
      date: formDate,
      time: formTime,
      googleMeetLink: formLink,
      description: formDescription,
      invitedStudents: formInvitedStudents,
    });
    setFormTopic('');
    setFormDate('');
    setFormTime('');
    setFormLink('');
    setFormDescription('');
    setFormInvitedStudents([]);
    setIsModalOpen(false);
  };

  const sortedMeetings = [...meetings].sort((a, b) => (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0));

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Manage Meetings</h1>
      <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="mb-6">
        Schedule New Meeting
      </Button>

      <Card>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedMeetings.map((meeting) => (
              <tr key={meeting.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meeting.topic}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{meeting.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{meeting.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {meeting.invitedStudents.length === students.length ? 'All Students' : meeting.invitedStudents.map(id => users.find(u => u.id === id)?.name).join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => window.open(meeting.googleMeetLink, '_blank')} icon={Calendar}>
                    Join
                  </Button>
                  {/* <Button variant="danger" size="sm" onClick={() => alert(`Deleting ${meeting.topic}`)} icon={Trash2}>
                    Delete
                  </Button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Meeting">
        <Input label="Topic" value={formTopic} onChange={(e) => setFormTopic(e.target.value)} placeholder="e.g., Debugging Session" required />
        <Input label="Date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
        <Input label="Time" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
        <Input label="Google Meet Link" value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://meet.google.com/xyz-abcd-efg" required />
        <Textarea label="Description (Optional)" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Agenda or preparation notes..." rows={4} />
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">Invite Students</label>
          <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`invite-${student.id}`}
                  checked={formInvitedStudents.includes(student.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormInvitedStudents((prev) => [...prev, student.id]);
                    } else {
                      setFormInvitedStudents((prev) => prev.filter((id) => id !== student.id));
                    }
                  }}
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`invite-${student.id}`} className="text-gray-700 text-sm">{student.name}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduleMeeting} icon={Plus}>Schedule Meeting</Button>
        </div>
      </Modal>
    </div>
  );
};

const InstructorAnnouncementsPage = ({ navigate }) => {
  const { announcements, createAnnouncement } = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const handleCreateAnnouncement = async () => {
    if (!formTitle || !formContent) {
      alert('Please fill all fields.');
      return;
    }
    await createAnnouncement({ title: formTitle, content: formContent });
    setFormTitle('');
    setFormContent('');
    setIsModalOpen(false);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Manage Announcements</h1>
      <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="mb-6">
        Create New Announcement
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAnnouncements.map((ann) => (
          <Card key={ann.id} className="flex flex-col">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{ann.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{ann.date}</p>
            <p className="text-gray-700 flex-grow">{ann.content}</p>
            {/* <div className="mt-4 flex space-x-2">
              <Button variant="secondary" size="sm" icon={Edit}>Edit</Button>
              <Button variant="danger" size="sm" icon={Trash2}>Delete</Button>
            </div> */}
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Announcement">
        <Input label="Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Important Course Update" required />
        <Textarea label="Content (Rich Text Editor Mock)" value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Type your announcement here..." rows={8} required />
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAnnouncement} icon={Plus}>Publish Announcement</Button>
        </div>
      </Modal>
    </div>
  );
};

const MessageComposer = ({ recipientId, onSend, initialMessage = '' }) => {
  const [message, setMessage] = useState(initialMessage);

  const handleSend = () => {
    if (message.trim()) {
      onSend(recipientId, message);
      setMessage('');
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        rows={1}
        className="flex-grow mb-0"
      />
      <Button onClick={handleSend} icon={Send} className="shrink-0">
        Send
      </Button>
    </div>
  );
};

const InstructorMessagesPage = ({ user }) => {
  const { messages, users, sendMessage } = useContext(DataContext);
  const students = users.filter(u => u.role === 'student');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || null);

  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  const currentConversation = messages
    .filter(
      (msg) =>
        (msg.senderId === user.uid && msg.receiverId === selectedStudentId) ||
        (msg.senderId === selectedStudentId && msg.receiverId === user.uid)
    )
    .sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));

  const handleSendMessage = (recipientId, content) => {
    sendMessage(user.uid, recipientId, content);
  };

  return (
    <div className="p-8 flex h-[calc(100vh-160px)]"> {/* Adjust height based on navbar/padding */}
      <div className="w-1/3 bg-white rounded-l-xl shadow-lg border-r border-gray-200 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">Students</h2>
        <ul className="divide-y divide-gray-100">
          {students.map((student) => (
            <li key={student.id}>
              <button
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full text-left p-4 hover:bg-blue-50 transition duration-200 ${
                  selectedStudentId === student.id ? 'bg-blue-100 font-semibold' : ''
                }`}
              >
                {student.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-2/3 bg-white rounded-r-xl shadow-lg flex flex-col">
        {selectedStudentId ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">
              Chat with {users.find(u => u.id === selectedStudentId)?.name}
            </h2>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {currentConversation.length === 0 ? (
                <p className="text-gray-500 text-center mt-10">No messages yet. Start a conversation!</p>
              ) : (
                currentConversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg shadow-sm ${
                        msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className={`block text-xs mt-1 ${msg.senderId === user.uid ? 'text-blue-200' : 'text-gray-500'}`}>
                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <MessageComposer recipientId={selectedStudentId} onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500">
            Select a student to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Student Pages ---

const StudentDashboard = ({ user, navigate }) => {
  const { tasks, submissions, meetings, announcements } = useContext(DataContext);

  const myTasks = tasks.filter(task => task.assignedTo.includes(user.uid));
  const mySubmissions = submissions.filter(sub => sub.studentId === user.uid);

  const completedTasksCount = mySubmissions.filter(sub => sub.status === 'graded').length;
  const assignedTasksCount = myTasks.length;
  const overallProgress = assignedTasksCount > 0 ? Math.round((completedTasksCount / assignedTasksCount) * 100) : 0;

  const tasksDueSoon = myTasks.filter(task => {
    const submission = mySubmissions.find(sub => sub.taskId === task.id);
    if (submission && submission.status === 'graded') return false; // Already graded
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && dueDate >= today; // Due in next 7 days and not past due
  }).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

  const upcomingMeetings = meetings.filter(meet => meet.invitedStudents.includes(user.uid) && new Date(`${meet.date}T${meet.time}`) >= new Date()).sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const latestAnnouncements = [...announcements].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)).slice(0, 3);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="My Progress">
          <p className="text-gray-700 text-lg mb-2">Overall Task Completion:</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <span className="text-sm font-semibold text-gray-700">{overallProgress}% Completed</span>
        </Card>

        <Card title="Tasks Due Soon">
          {tasksDueSoon.length > 0 ? (
            <ul className="space-y-3">
              {tasksDueSoon.slice(0, 3).map((task) => (
                <li key={task.id} className="text-gray-700">
                  <span className="font-semibold">{task.title}</span> - Due {task.dueDate}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No tasks due in the next 7 days.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('student-tasks')} icon={ClipboardList}>
            View All Tasks
          </Button>
        </Card>

        <Card title="Upcoming Meetings">
          {upcomingMeetings.length > 0 ? (
            <ul className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <li key={meeting.id} className="text-gray-700">
                  <span className="font-semibold">{meeting.topic}</span> on {meeting.date} at {meeting.time}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No upcoming meetings.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('student-meetings')} icon={Calendar}>
            View All Meetings
          </Button>
        </Card>
      </div>

      <Card title="Latest Announcements">
        {latestAnnouncements.length > 0 ? (
          <ul className="space-y-3">
            {latestAnnouncements.map((ann) => (
              <li key={ann.id} className="text-gray-700">
                <span className="font-semibold">{ann.title}</span> ({ann.date})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No announcements yet.</p>
        )}
        <Button variant="outline" className="mt-4" onClick={() => navigate('student-announcements')} icon={Megaphone}>
          View All Announcements
        </Button>
      </Card>
    </div>
  );
};

const StudentTasksPage = ({ user, navigate }) => {
  const { tasks, submissions, addSubmission } = useContext(DataContext);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [mockOutput, setMockOutput] = useState('');

  const myTasks = tasks.filter(task => task.assignedTo.includes(user.uid));

  const handleViewTask = (task) => {
    setSelectedTask(task);
    const existingSubmission = submissions.find(sub => sub.taskId === task.id && sub.studentId === user.uid);
    setCurrentCode(existingSubmission?.code || '');
    setMockOutput('');
  };

  const handleSubmitCode = async () => {
    if (!selectedTask) return;
    await addSubmission(selectedTask.id, user.uid, currentCode);
    alert('Code submitted! Instructor will review it.');
    setSelectedTask(null); // Go back to task list
  };

  const handleRunCode = () => {
    // This is a mock function. In a real app, this would send code to a server-side executor.
    setMockOutput('Running code...\n\nHello, World! (Mock Output)\nYour Name: Alice (Mock Output)');
  };

  if (selectedTask) {
    const studentSubmission = submissions.find(sub => sub.taskId === selectedTask.id && sub.studentId === user.uid);
    return (
      <div className="p-8">
        <Button variant="secondary" onClick={() => setSelectedTask(null)} icon={ArrowLeft} className="mb-6">
          Back to My Tasks
        </Button>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Task: {selectedTask.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Task Details">
            <h4 className="font-semibold text-gray-700 mb-2">Due Date: {selectedTask.dueDate}</h4>
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selectedTask.description.replace(/\n/g, '<br/>') }}></div>
            {/* Simple mock for rich text rendering */}
          </Card>

          <Card title="Your Code & Submission">
            <Textarea
              label="Write your code here (Code Editor Mock)"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              rows={15}
              className="font-mono text-sm bg-gray-100 border border-gray-300 rounded-lg p-3"
            />
            <div className="flex space-x-3 mt-4">
              <Button onClick={handleRunCode} icon={Code} variant="secondary">
                Run Code (Mock)
              </Button>
              <Button onClick={handleSubmitCode} icon={CheckCircle}>
                Submit Task
              </Button>
            </div>
            {mockOutput && (
              <div className="bg-gray-100 p-4 rounded-lg text-sm mt-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Mock Output:</h4>
                <pre className="whitespace-pre-wrap">{mockOutput}</pre>
              </div>
            )}
          </Card>
        </div>

        {studentSubmission && studentSubmission.status === 'graded' && (
          <Card title="Instructor Feedback & Grade" className="mt-8">
            <p className="text-lg font-bold text-gray-800 mb-3">Grade: <span className="text-blue-600">{studentSubmission.grade} / 100</span></p>
            <h4 className="font-semibold text-gray-700 mb-2">Feedback:</h4>
            <p className="text-gray-700">{studentSubmission.feedback}</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">My Tasks</h1>

      <Card>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Task Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {myTasks.map((task) => {
              const submission = submissions.find(sub => sub.taskId === task.id && sub.studentId === user.uid);
              const status = submission ? submission.status : 'Not Started';
              const grade = submission ? (submission.grade !== null ? `${submission.grade}/100` : '-') : '-';
              return (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      status === 'graded' ? 'bg-green-100 text-green-800' :
                      status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="secondary" size="sm" onClick={() => handleViewTask(task)} icon={Eye}>
                      View Task
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const StudentNotesPage = ({ user }) => {
  const { notes, addNote, deleteNote } = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState('text'); // 'text' or 'image'
  const [formFile, setFormFile] = useState(null); // For image file object

  const myNotes = notes.filter(note => note.studentId === user.uid);

  const handleAddNote = async () => {
    if (!formTitle || (formType === 'text' && !formContent.trim()) || (formType === 'image' && !formFile)) {
      alert('Please fill all required fields.');
      return;
    }

    let imageUrl = null;
    if (formType === 'image' && formFile) {
      // In a real app, you'd upload formFile to Firebase Storage here
      // and get the download URL. For this demo, we'll use a placeholder.
      imageUrl = 'https://placehold.co/300x200/4CAF50/FFFFFF?text=Uploaded+Image';
      alert('Image upload simulated! In a real app, this would go to Firebase Storage.');
    }

    await addNote(user.uid, formTitle, formContent, formType, imageUrl);
    setFormTitle('');
    setFormContent('');
    setFormType('text');
    setFormFile(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">My Notes</h1>
      <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="mb-6">
        Add New Note
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myNotes.length === 0 ? (
          <p className="text-gray-600 col-span-full">You haven't added any notes yet.</p>
        ) : (
          myNotes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <div className="flex items-center mb-2">
                {note.type === 'text' ? <FileText className="h-5 w-5 mr-2 text-blue-600" /> : <Image className="h-5 w-5 mr-2 text-purple-600" />}
                <h3 className="text-xl font-semibold text-gray-800 flex-grow">{note.title}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">{note.createdAt?.toDate().toLocaleDateString()}</p>
              {note.type === 'text' ? (
                <p className="text-gray-700 flex-grow line-clamp-4">{note.content}</p>
              ) : (
                note.imageUrl && (
                  <img src={note.imageUrl} alt={note.title} className="w-full h-auto rounded-lg object-cover mb-3" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x200/CCCCCC/000000?text=Image+Load+Error"; }} />
                )
              )}
              <div className="mt-4 flex space-x-2 justify-end">
                {/* <Button variant="secondary" size="sm" icon={Edit}>Edit</Button> */}
                <Button variant="danger" size="sm" onClick={() => deleteNote(note.id)} icon={Trash2}>Delete</Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Note">
        <Input label="Note Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Important Concepts" required />
        <Select
          label="Note Type"
          value={formType}
          onChange={(e) => { setFormType(e.target.value); setFormContent(''); setFormFile(null); }}
          options={[{ value: 'text', label: 'Text Note' }, { value: 'image', label: 'Image Note' }]}
        />
        {formType === 'text' ? (
          <Textarea label="Note Content (Rich Text Editor Mock)" value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Type your notes here..." rows={8} required />
        ) : (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Upload Image of Note</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormFile(e.target.files[0])}
              className="w-full text-gray-700 border border-gray-300 rounded-lg p-2"
            />
            {formFile && <p className="text-sm text-green-600 mt-2">File selected: {formFile.name}</p>}
          </div>
        )}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} icon={Plus}>Add Note</Button>
        </div>
      </Modal>
    </div>
  );
};

const StudentMeetingsPage = ({ user }) => {
  const { meetings, users } = useContext(DataContext);
  const myMeetings = meetings.filter(meet => meet.invitedStudents.includes(user.uid))
    .sort((a, b) => (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0));

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">My Meetings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myMeetings.length === 0 ? (
          <p className="text-gray-600 col-span-full">You have no scheduled meetings.</p>
        ) : (
          myMeetings.map((meeting) => (
            <Card key={meeting.id} className="flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{meeting.topic}</h3>
              <p className="text-gray-700 mb-1">Date: {meeting.date}</p>
              <p className="text-gray-700 mb-3">Time: {meeting.time}</p>
              {meeting.description && (
                <p className="text-gray-600 text-sm mb-4 flex-grow">{meeting.description}</p>
              )}
              <Button
                onClick={() => window.open(meeting.googleMeetLink, '_blank')}
                icon={Calendar}
                className="mt-auto w-full"
              >
                Join Meeting
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const StudentAnnouncementsPage = () => {
  const { announcements } = useContext(DataContext);
  const sortedAnnouncements = [...announcements].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Announcements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAnnouncements.length === 0 ? (
          <p className="text-gray-600 col-span-full">No announcements available.</p>
        ) : (
          sortedAnnouncements.map((ann) => (
            <Card key={ann.id} className="flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{ann.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{ann.date}</p>
              <p className="text-gray-700 flex-grow">{ann.content}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const StudentMessagesPage = ({ user }) => {
  const { messages, users, sendMessage } = useContext(DataContext);
  const instructor = users.find(u => u.role === 'instructor'); // Assuming one instructor

  const currentConversation = messages
    .filter(
      (msg) =>
        (msg.senderId === user.uid && msg.receiverId === instructor?.id) ||
        (msg.senderId === instructor?.id && msg.receiverId === user.uid)
    )
    .sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));

  const handleSendMessage = (recipientId, content) => {
    sendMessage(user.uid, recipientId, content);
  };

  if (!instructor) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>No instructor found to chat with. Please ask your administrator to create an instructor account.</p>
      </div>
    );
  }

  return (
    <div className="p-8 flex h-[calc(100vh-160px)]">
      <div className="w-1/3 bg-white rounded-l-xl shadow-lg border-r border-gray-200 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">Conversations</h2>
        <ul className="divide-y divide-gray-100">
          <li>
            <button
              // No specific selection needed for single instructor, but keep for consistency
              className={`w-full text-left p-4 hover:bg-blue-50 transition duration-200 bg-blue-100 font-semibold`}
            >
              {instructor.name} (Instructor)
            </button>
          </li>
        </ul>
      </div>

      <div className="w-2/3 bg-white rounded-r-xl shadow-lg flex flex-col">
        <>
          <h2 className="text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">
            Chat with {instructor.name}
          </h2>
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {currentConversation.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">No messages yet. Start a conversation!</p>
            ) : (
              currentConversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg shadow-sm ${
                      msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className={`block text-xs mt-1 ${msg.senderId === user.uid ? 'text-blue-200' : 'text-gray-500'}`}>
                      {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <MessageComposer recipientId={instructor.id} onSend={handleSendMessage} />
        </>
      </div>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const { user, login, logout, loadingAuth, registerAndCreateUserDoc } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(''); // State to manage current page view

  useEffect(() => {
    if (!loadingAuth) {
      if (user) {
        if (user.role === 'instructor') {
          setCurrentPage('instructor-dashboard');
        } else if (user.role === 'student') {
          setCurrentPage('student-dashboard');
        }
      } else {
        setCurrentPage('login');
      }
    }
  }, [user, loadingAuth]);

  const navigate = (page) => {
    setCurrentPage(page);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Loading authentication...</div>
      </div>
    );
  }

  const renderPage = () => {
    if (!user) {
      return <LoginPage login={login} registerAndCreateUserDoc={registerAndCreateUserDoc} />;
    }

    if (user.role === 'instructor') {
      switch (currentPage) {
        case 'instructor-dashboard':
          return <InstructorDashboard navigate={navigate} />;
        case 'instructor-students':
          return <InstructorStudentsPage navigate={navigate} />;
        case 'instructor-tasks':
          return <InstructorTasksPage navigate={navigate} />;
        case 'instructor-meetings':
          return <InstructorMeetingsPage navigate={navigate} />;
        case 'instructor-announcements':
          return <InstructorAnnouncementsPage navigate={navigate} />;
        case 'instructor-messages':
          return <InstructorMessagesPage user={user} />;
        default:
          return <InstructorDashboard navigate={navigate} />;
      }
    } else if (user.role === 'student') {
      switch (currentPage) {
        case 'student-dashboard':
          return <StudentDashboard user={user} navigate={navigate} />;
        case 'student-tasks':
          return <StudentTasksPage user={user} navigate={navigate} />;
        case 'student-notes':
          return <StudentNotesPage user={user} />;
        case 'student-meetings':
          return <StudentMeetingsPage user={user} />;
        case 'student-announcements':
          return <StudentAnnouncementsPage />;
        case 'student-messages':
          return <StudentMessagesPage user={user} />;
        default:
          return <StudentDashboard user={user} navigate={navigate} />;
      }
    }
    return <LoginPage login={login} registerAndCreateUserDoc={registerAndCreateUserDoc} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {user && <Navbar user={user} logout={logout} navigate={navigate} role={user.role} />}
      <div className="flex">
        {user && <Sidebar navigate={navigate} role={user.role} currentPage={currentPage} />}
        <main className="flex-grow p-4">
          {renderPage()}
        </main>
      </div>
      {/* Tailwind CSS CDN is removed as it's now properly integrated via PostCSS */}
      {/* <script src="https://cdn.tailwindcss.com"></script> */}
      <style>
        {`
          /* Font import is now in src/index.css */
        `}
      </style>
    </div>
  );
}

// Wrapper to provide contexts - This is now the ONLY default export
export default function AppWrapper() {
  return (
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  );
}
