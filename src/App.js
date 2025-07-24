import React, { useState, useEffect, createContext, useContext } from 'react';
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
  X,
  Menu,
  Send
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, onSnapshot, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
// getAnalytics is not used in the app logic, so it's not imported here to keep imports clean.

// --- Firebase Configuration ---
// Your new web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBvcKc2CbSzIIKTEU6qAXZGRENoda-cKQ",
  authDomain: "young-star-b58af.firebaseapp.com",
  projectId: "young-star-b58af",
  storageBucket: "young-star-b58af.firebasestorage.app",
  messagingSenderId: "744836451531",
  appId: "1:744836451531:web:97afd6f97a98900e69df4e",
  measurementId: "G-3DZW1FDSGQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Context for User and Data ---
const AuthContext = createContext();
const DataContext = createContext();
const MessageContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { uid, email, role, name }
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { showMessage } = useContext(MessageContext);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role and name from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
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
        } catch (error) {
          console.error("Error fetching user document:", error.message);
          showMessage('Data Fetch Error', `Failed to load user data: ${error.message}. Please check your internet connection and Firebase Firestore rules.`, 'error');
          setUser(null); // Ensure user is null if data fetch fails
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [showMessage]);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener will handle setting the user state
      return true;
    } catch (error) {
      console.error("Login error:", error.message);
      showMessage('Login Failed', error.message, 'error'); // Show error in modal
      return false;
    }
  };

  // Modified registerAndCreateUserDoc to always create as 'student'
  const registerAndCreateUserDoc = async (email, password, name) => {
    try {
      const userCredentialResult = await createUserWithEmailAndPassword(auth, email, password);
      const userUid = userCredentialResult.user.uid;

      // Set display name for the Firebase Auth user
      await updateProfile(userCredentialResult.user, { displayName: name });

      await setDoc(doc(db, 'users', userUid), {
        name,
        email,
        role: 'student', // Always 'student' for direct registration
        createdAt: serverTimestamp(),
      });
      return { success: true }; // Return success object
    } catch (error) {
      console.error("Registration error:", error.message);
      return { success: false, message: error.message }; // Return error message
    }
  };

  // New function for instructor application
  const applyForInstructor = async (email, password, name) => {
    try {
      const userCredentialResult = await createUserWithEmailAndPassword(auth, email, password);
      const userUid = userCredentialResult.user.uid;

      // Set display name for the Firebase Auth user
      await updateProfile(userCredentialResult.user, { displayName: name });

      await setDoc(doc(db, 'users', userUid), {
        name,
        email,
        role: 'pending', // Role is 'pending' for instructor applications
        createdAt: serverTimestamp(),
      });
      // Optionally, add an entry to a separate collection for easier instructor review
      await addDoc(collection(db, 'instructorApplications'), {
        userId: userUid,
        name,
        email,
        status: 'pending',
        appliedAt: serverTimestamp(),
      });
      showMessage('Application Sent', 'Your instructor application has been sent for review. You will be notified upon approval.', 'success');
      return { success: true };
    } catch (error) {
      console.error("Instructor application error:", error.message);
      showMessage('Application Failed', error.message, 'error');
      return { success: false, message: error.message };
    }
  };


  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create user document if it doesn't exist, always as 'student' for Google sign-in
        await setDoc(userDocRef, {
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          role: 'student', // Default role for new Google sign-ins is student
          createdAt: serverTimestamp(),
        });
      }
      showMessage('Success', 'Signed in with Google successfully!', 'success');
      return true;
    } catch (error) {
      console.error("Google Sign-In error:", error.message);
      showMessage('Google Sign-In Failed', error.message, 'error');
      return false;
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      showMessage('Logged Out', 'You have been successfully logged out.', 'info'); // Show info in modal
    } catch (error) {
      console.error("Logout error:", error.message);
      showMessage('Logout Failed', error.message, 'error'); // Show error in modal
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loadingAuth, registerAndCreateUserDoc, signInWithGoogle, applyForInstructor }}>
      {children}
    </AuthContext.Provider>
  );
};

const DataProvider = ({ children }) => {
  const { user, loadingAuth } = useContext(AuthContext);
  const { showMessage } = useContext(MessageContext);

  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [instructorApplications, setInstructorApplications] = useState([]);

  // Fetch all users (for instructor to assign tasks, message students)
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
      }, (error) => {
        console.error("Error fetching users:", error);
        showMessage('Data Fetch Error', `Failed to load users: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'users' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);

  // Fetch tasks
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(fetchedTasks);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        showMessage('Data Fetch Error', `Failed to load tasks: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'tasks' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);

  // Fetch submissions
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'submissions'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(fetchedSubmissions);
      }, (error) => {
        console.error("Error fetching submissions:", error);
        showMessage('Data Fetch Error', `Failed to load submissions: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'submissions' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);

  // Fetch meetings
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'meetings'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMeetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMeetings(fetchedMeetings);
      }, (error) => {
        console.error("Error fetching meetings:", error);
        showMessage('Data Fetch Error', `Failed to load meetings: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'meetings' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);

  // Fetch announcements
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'announcements'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(fetchedAnnouncements);
      }, (error) => {
        console.error("Error fetching announcements:", error);
        showMessage('Data Fetch Error', `Failed to load announcements: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'announcements' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);

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
      }, (error) => {
        console.error("Error fetching sent messages:", error);
        showMessage('Data Fetch Error', `Failed to load sent messages: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'messages' collection.`, 'error');
      });

      const unsubscribe2 = onSnapshot(q2, (snapshot) => {
        const receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(prev => {
          const combined = [...prev.filter(msg => msg.receiverId !== user.uid), ...receivedMessages];
          return Array.from(new Map(combined.map(item => [item.id, item])).values()).sort((a,b) => a.timestamp?.toDate() - b.timestamp?.toDate());
        });
      }, (error) => {
        console.error("Error fetching received messages:", error);
        showMessage('Data Fetch Error', `Failed to load received messages: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'messages' collection.`, 'error');
      });

      return () => {
        unsubscribe1();
        unsubscribe2();
      };
    }
  }, [user, loadingAuth, showMessage]);

  // Fetch notes relevant to the current user
  useEffect(() => {
    if (!loadingAuth && user) {
      const q = query(collection(db, 'notes'), where('studentId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(fetchedNotes);
      }, (error) => {
        console.error("Error fetching notes:", error);
        showMessage('Data Fetch Error', `Failed to load notes: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'notes' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);

  // Fetch instructor applications (only if user is an instructor)
  useEffect(() => {
    if (!loadingAuth && user && user.role === 'instructor') {
      const q = query(collection(db, 'instructorApplications'), where('status', '==', 'pending'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedApplications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInstructorApplications(fetchedApplications);
      }, (error) => {
        console.error("Error fetching instructor applications:", error);
        showMessage('Data Fetch Error', `Failed to load instructor applications: ${error.message}. Please check your internet connection and Firebase Firestore rules for the 'instructorApplications' collection.`, 'error');
      });
      return () => unsubscribe();
    }
  }, [user, loadingAuth, showMessage]);


  // CRUD Operations using Firestore
  const addStudent = async (email, password, name) => {
    // This function will be called during instructor's "Add New Student"
    // It will create a Firebase Auth user and a Firestore user doc.
    try {
      const userCredentialResult = await createUserWithEmailAndPassword(auth, email, password); // Creates auth user
      const userUid = userCredentialResult.user.uid;

      await updateProfile(userCredentialResult.user, { displayName: name }); // Set display name

      await setDoc(doc(db, 'users', userUid), {
        name,
        email,
        role: 'student',
        createdAt: serverTimestamp(),
      });
      showMessage('Success', 'Student added successfully!', 'success'); // Show success in modal
      return true;
    } catch (error) {
      console.error("Error adding student:", error.message);
      showMessage('Error', `Failed to add student: ${error.message}`, 'error'); // Show error in modal
      return false;
    }
  };

  // New function to delete student profile from Firestore (not Firebase Auth)
  const deleteStudentProfile = async (studentId) => {
    try {
      await deleteDoc(doc(db, 'users', studentId));
      console.log(`Student profile ${studentId} deleted from Firestore.`);
      showMessage('Success', `Student profile deleted from Firestore.`, 'success'); // Show success in modal
      // IMPORTANT: Deleting the Firebase Authentication user and all related data (submissions, notes, messages)
      // should ideally be handled by a Firebase Cloud Function for security and data integrity.
      // Directly deleting other users from client-side Firebase Auth is not supported or secure.
      // Manual cleanup in Firebase console or a backend solution is needed for full deletion.
      return { success: true };
    } catch (error) {
      console.error("Error deleting student profile:", error.message);
      showMessage('Error', `Failed to delete student profile: ${error.message}`, 'error'); // Show error in modal
      return { success: false, message: error.message };
    }
  };


  const createTask = async (newTask) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        createdAt: serverTimestamp(),
      });
      showMessage('Success', 'Task created successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error creating task:", error);
      showMessage('Error', `Failed to create task: ${error.message}`, 'error'); // Show error in modal
    }
  };

  const updateTask = async (taskId, updatedData) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), updatedData);
      showMessage('Success', 'Task updated successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error updating task:", error);
      showMessage('Error', `Failed to update task: ${error.message}`, 'error'); // Show error in modal
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
        showMessage('Success', 'Submission updated successfully!', 'success'); // Show success in modal
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
        showMessage('Success', 'Submission added successfully!', 'success'); // Show success in modal
      }
    } catch (error) {
      console.error("Error adding/updating submission:", error);
      showMessage('Error', `Failed to submit code: ${error.message}`, 'error'); // Show error in modal
    }
  };

  const updateSubmissionGradeAndFeedback = async (submissionId, grade, feedback) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        grade: Number(grade), // Ensure grade is a number
        feedback,
        status: 'graded',
      });
      showMessage('Success', 'Grade and feedback saved successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error updating submission grade/feedback:", error);
      showMessage('Error', `Failed to save grade/feedback: ${error.message}`, 'error'); // Show error in modal
    }
  };

  const scheduleMeeting = async (newMeeting) => {
    try {
      await addDoc(collection(db, 'meetings'), {
        ...newMeeting,
        createdAt: serverTimestamp(),
      });
      showMessage('Success', 'Meeting scheduled successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      showMessage('Error', `Failed to schedule meeting: ${error.message}`, 'error'); // Show error in modal
    }
  };

  const createAnnouncement = async (newAnnouncement) => {
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        date: new Date().toISOString().split('T')[0], // Keep date string for display
        createdAt: serverTimestamp(),
      });
      showMessage('Success', 'Announcement created successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error creating announcement:", error);
      showMessage('Error', `Failed to create announcement: ${error.message}`, 'error'); // Show error in modal
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
      showMessage('Success', 'Message sent successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error sending message:", error);
      showMessage('Error', `Failed to send message: ${error.message}`, 'error'); // Show error in modal
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
      showMessage('Success', 'Note added successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error adding note:", error);
      showMessage('Error', `Failed to add note: ${error.message}`, 'error'); // Show error in modal
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      showMessage('Success', 'Note deleted successfully!', 'success'); // Show success in modal
    } catch (error) {
      console.error("Error deleting note:", error);
      showMessage('Error', `Failed to delete note: ${error.message}`, 'error'); // Show error in modal
    }
  };

  // New functions for instructor application management
  const approveInstructorApplication = async (applicationId, userId) => {
    try {
      // 1. Update user's role in 'users' collection
      await updateDoc(doc(db, 'users', userId), {
        role: 'instructor',
      });
      // 2. Update application status in 'instructorApplications' collection
      await updateDoc(doc(db, 'instructorApplications', applicationId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });
      showMessage('Success', 'Instructor application approved successfully!', 'success');
      return { success: true };
    } catch (error) {
      console.error("Error approving instructor application:", error.message);
      showMessage('Error', `Failed to approve application: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const rejectInstructorApplication = async (applicationId) => {
    try {
      // For rejection, we'll just delete the application record.
      // Optionally, you might want to delete the Firebase Auth user too,
      // but that's usually handled by a Cloud Function for security.
      await deleteDoc(doc(db, 'instructorApplications', applicationId));
      showMessage('Success', 'Instructor application rejected and removed.', 'info');
      return { success: true };
    } catch (error) {
      console.error("Error rejecting instructor application:", error.message);
      showMessage('Error', `Failed to reject application: ${error.message}`, 'error');
      return { success: false, message: error.message };
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
        instructorApplications, // Provide applications
        addStudent,
        deleteStudentProfile, // Added new function
        createTask,
        updateTask,
        addSubmission,
        updateSubmissionGradeAndFeedback,
        scheduleMeeting,
        createAnnouncement,
        sendMessage,
        addNote,
        deleteNote,
        approveInstructorApplication, // New function
        rejectInstructorApplication, // New function
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// --- Reusable Components ---

const Navbar = ({ user, logout, navigate, role, toggleSidebar }) => (
  <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg flex justify-between items-center rounded-b-lg">
    <div className="flex items-center space-x-3">
      {/* Hamburger icon for mobile */}
      <button onClick={toggleSidebar} className="md:hidden text-white focus:outline-none">
        <Menu className="h-7 w-7" />
      </button>
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

const Sidebar = ({ navigate, role, currentPage, showSidebar, toggleSidebar }) => {
  const instructorNav = [
    { name: 'Dashboard', icon: Home, page: 'instructor-dashboard' },
    { name: 'Students', icon: Users, page: 'instructor-students' },
    { name: 'Tasks', icon: ClipboardList, page: 'instructor-tasks' },
    { name: 'Meetings', icon: Calendar, page: 'instructor-meetings' },
    { name: 'Announcements', icon: Megaphone, page: 'instructor-announcements' },
    { name: 'Messages', icon: MessageSquare, page: 'instructor-messages' },
    { name: 'Instructor Requests', icon: GraduationCap, page: 'instructor-requests' }, // New item
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

  // Conditional classes for responsive sidebar
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white p-6 shadow-xl flex-col h-full
    transform transition-transform duration-300 ease-in-out
    ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
    md:relative md:translate-x-0 md:flex md:rounded-r-lg
  `;

  return (
    <div className={sidebarClasses}>
      {/* Close button for mobile sidebar */}
      <button onClick={toggleSidebar} className="absolute top-4 right-4 md:hidden text-white focus:outline-none">
        <X className="h-7 w-7" />
      </button>

      <div className="mb-8 mt-8 md:mt-0"> {/* Adjusted top margin for mobile close button */}
        <h2 className="text-3xl font-extrabold text-blue-300">Menu</h2>
      </div>
      <ul className="space-y-4 flex-grow">
        {navItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => {
                navigate(item.page);
                toggleSidebar(); // Close sidebar on navigation for mobile
              }}
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
  const baseStyle = 'flex items-center justify-center px-5 py-2 rounded-full font-semibold transition duration-300 ease-in-out shadow-md text-sm sm:text-base'; // Adjusted font size
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
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base" // Adjusted font size
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
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-y text-sm sm:text-base" // Adjusted font size
    ></textarea>
  </div>
);

const Select = ({ label, value, onChange, options, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base" // Adjusted font size
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative"> {/* max-w-lg to prevent too wide on desktop, w-full for mobile */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

// New MessageModal component for in-app alerts
const MessageModal = ({ isOpen, onClose, title, content, type }) => {
  if (!isOpen) return null;

  let titleColor = 'text-gray-800';
  let borderColor = 'border-gray-300';
  let buttonColor = 'bg-blue-600 hover:bg-blue-700';

  if (type === 'success') {
    titleColor = 'text-green-600';
    borderColor = 'border-green-500';
    buttonColor = 'bg-green-600 hover:bg-green-700';
  } else if (type === 'error') {
    titleColor = 'text-red-600';
    borderColor = 'border-red-500';
    buttonColor = 'bg-red-600 hover:bg-red-700';
  } else if (type === 'info') {
    titleColor = 'text-blue-600';
    borderColor = 'border-blue-500';
    buttonColor = 'bg-blue-600 hover:bg-blue-700';
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative border-t-4 ${borderColor}`}> {/* max-w-sm for smaller message modals */}
        <h3 className={`text-xl font-bold mb-4 ${titleColor}`}>{title}</h3>
        <p className="text-gray-700 mb-6">{content}</p>
        <div className="flex justify-end">
          <Button onClick={onClose} className={buttonColor}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};


// --- Pages ---

// Login Page
const LoginPage = ({ login, registerAndCreateUserDoc, signInWithGoogle, applyForInstructor }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isApplyingInstructor, setIsApplyingInstructor] = useState(false);
  const [error, setError] = useState('');

  const { showMessage } = useContext(MessageContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegistering) {
      const result = await registerAndCreateUserDoc(email, password, name);
      if (result.success) {
        showMessage('Registration Successful', 'You have successfully registered as a student! Please log in.', 'success');
        setIsRegistering(false);
        setEmail('');
        setPassword('');
        setName('');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
        showMessage('Registration Failed', result.message || 'Registration failed. Please try again.', 'error');
      }
    } else {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password.');
      }
    }
  };

  const handleApplyInstructor = async () => {
    if (!name || !email || !password) {
      showMessage('Warning', 'Please fill all fields for instructor application.', 'warning');
      return;
    }
    const result = await applyForInstructor(email, password, name);
    if (result.success) {
      setIsApplyingInstructor(false);
      setEmail('');
      setPassword('');
      setName('');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Card className="max-w-md w-full p-8 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome to Young-Star</h2>
        <p className="text-center text-gray-600 mb-8">{isRegistering ? 'Create Your Student Account' : 'Login to Your Portal'}</p>
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <Input
              label="Your Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
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
            {isRegistering ? 'Register as Student' : 'Login'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm mb-2">Or sign in with:</p>
          <Button
            onClick={signInWithGoogle}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            icon={() => (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.675 11.802c0-.783-.069-1.536-.192-2.261H12v4.51h6.117c-.272 1.393-1.096 2.582-2.399 3.393v2.932h3.766c2.204-2.023 3.479-5.006 3.479-8.574z" fill="#4285F4"/>
                <path d="M12 23c3.239 0 5.942-1.07 7.925-2.909l-3.766-2.932c-1.047.697-2.35 1.107-4.159 1.107-3.181 0-5.877-2.144-6.83-5.02H1.583v3.02C3.644 20.947 7.55 23 12 23z" fill="#34A853"/>
                <path d="M4.97 14.001c-.23-.697-.36-1.432-.36-2.193s.13-1.496.36-2.193V6.69H1.583C.578 8.706 0 10.395 0 12c0 1.605.578 3.294 1.583 5.31l3.387-2.909z" fill="#FBBC05"/>
                <path d="M12 4.97c1.777 0 3.384.618 4.659 1.828l3.153-3.153C17.942 1.07 15.239 0 12 0 7.55 0 3.644 2.053 1.583 6.69l3.387 2.909C6.123 7.114 8.819 4.97 12 4.97z" fill="#EA4335"/>
              </svg>
            )}
          >
            Sign in with Google
          </Button>
        </div>
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
              Don't have a student account?{' '}
              <button onClick={() => setIsRegistering(true)} className="text-blue-600 hover:underline">
                Register as Student
              </button>
            </>
          )}
        </p>
        <p className="text-center text-gray-500 text-sm mt-2">
          Want to become an instructor?{' '}
          <button onClick={() => { setIsApplyingInstructor(true); setEmail(''); setPassword(''); setName(''); }} className="text-purple-600 hover:underline">
            Apply for Instructor Access
          </button>
        </p>
        {!isRegistering && (
          <p className="text-center text-gray-500 text-sm mt-2">
            Hint: Use `instructor@example.com` or `student1@example.com` with password `password` if you haven't registered.
          </p>
        )}
      </Card>

      {/* Instructor Application Modal */}
      <Modal isOpen={isApplyingInstructor} onClose={() => setIsApplyingInstructor(false)} title="Apply for Instructor Access">
        <p className="text-gray-700 mb-4">Fill out the form below to apply for an instructor account. Your application will be reviewed by an administrator.</p>
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Full Name" required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@example.com" required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a secure password" required />
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsApplyingInstructor(false)}>Cancel</Button>
          <Button onClick={handleApplyInstructor} icon={Plus}>Submit Application</Button>
        </div>
      </Modal>
    </div>
  );
};

// New Pending Approval Page
const PendingApprovalPage = () => {
  const { logout } = useContext(AuthContext);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
      <Card className="max-w-md w-full p-8 bg-white rounded-xl shadow-2xl text-center">
        <GraduationCap className="h-20 w-20 mx-auto text-yellow-600 mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Application Pending Review</h2>
        <p className="text-gray-700 mb-6">
          Thank you for applying to be an instructor! Your application is currently under review by the administrator.
          You will receive an email notification once your application has been approved or if more information is needed.
        </p>
        <p className="text-gray-600 mb-8">
          Please check back later or contact support if you have any questions.
        </p>
        <Button onClick={logout} className="w-full" icon={LogOut}>
          Logout
        </Button>
      </Card>
    </div>
  );
};


// --- Instructor Pages ---

const InstructorDashboard = ({ navigate }) => {
  const { users, tasks, submissions, meetings, announcements, instructorApplications } = useContext(DataContext);
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
    <div className="p-4 sm:p-8 space-y-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Instructor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Quick Stats">
          <p className="text-gray-700 text-base sm:text-lg mb-2">
            <span className="font-bold text-blue-600">{tasksNeedingGrading.length}</span> Submissions Needing Grading
          </p>
          <p className="text-gray-700 text-base sm:text-lg mb-2">
            <span className="font-bold text-blue-600">{students.length}</span> Total Students
          </p>
          <p className="text-gray-700 text-base sm:text-lg">
            <span className="font-bold text-blue-600">{upcomingMeetings.length}</span> Upcoming Meetings
          </p>
          {instructorApplications.length > 0 && (
            <p className="text-gray-700 text-base sm:text-lg mt-2">
              <span className="font-bold text-red-600">{instructorApplications.length}</span> Pending Instructor Requests
            </p>
          )}
        </Card>

        <Card title="Upcoming Meetings">
          {upcomingMeetings.length > 0 ? (
            <ul className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <li key={meeting.id} className="text-gray-700 text-sm sm:text-base">
                  <span className="font-semibold">{meeting.topic}</span> on {meeting.date} at {meeting.time}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-sm sm:text-base">No upcoming meetings.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('instructor-meetings')} icon={Calendar}>
            View All Meetings
          </Button>
        </Card>

        <Card title="Latest Announcements">
          {latestAnnouncements.length > 0 ? (
            <ul className="space-y-3">
              {latestAnnouncements.map((ann) => (
                <li key={ann.id} className="text-gray-700 text-sm sm:text-base">
                  <span className="font-semibold">{ann.title}</span> ({ann.date})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-sm sm:text-base">No announcements yet.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('instructor-announcements')} icon={Megaphone}>
            Manage Announcements
          </Button>
        </Card>
      </div>

      <Card title="Student Progress Reports">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
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
                    <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2.5">
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
        </div>
      </Card>
    </div>
  );
};

const InstructorStudentsPage = ({ navigate }) => {
  const { users, addStudent, deleteStudentProfile } = useContext(DataContext);
  const { showMessage } = useContext(MessageContext);

  const students = users.filter(u => u.role === 'student');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

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
      }
    } else {
      showMessage('Warning', 'Please fill all fields.', 'warning');
    }
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      const result = await deleteStudentProfile(studentToDelete.id);
      if (result.success) {
        // Message handled by deleteStudentProfile function via showMessage
      } else {
        // Message handled by deleteStudentProfile function via showMessage
      }
      setStudentToDelete(null);
      setIsConfirmDeleteModalOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Manage Students</h1>
      <Button onClick={() => setIsAddStudentModalOpen(true)} icon={Plus} className="mb-6">
        Add New Student
      </Button>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
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
                    <Button variant="secondary" size="sm" onClick={() => showMessage('Profile View', `Viewing profile for ${student.name}`, 'info')} icon={Eye}>
                      View Profile
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClick(student)} icon={Trash2}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Confirmation Modal for Deletion */}
      <Modal isOpen={isConfirmDeleteModalOpen} onClose={() => setIsConfirmDeleteModalOpen(false)} title="Confirm Deletion">
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete the profile for **{studentToDelete?.name}** ({studentToDelete?.email})?
          <br/><br/>
          **Important:** This will only delete their profile from the database. You will need to manually delete their user account from Firebase Authentication and any related data (submissions, notes, messages) in the Firebase Console for a complete removal.
        </p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsConfirmDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirmDelete} icon={Trash2}>
            Delete Profile
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const InstructorTasksPage = ({ navigate }) => {
  const { tasks, users, createTask, updateTask, submissions, updateSubmissionGradeAndFeedback } = useContext(DataContext);
  const { showMessage } = useContext(MessageContext);

  const students = users.filter(u => u.role === 'student');

  const [editingTask, setEditingTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('list');
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignedStudents, setFormAssignedStudents] = useState([]);

  const handleOpenCreateTask = () => {
    setEditingTask(null);
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
      showMessage('Warning', 'Please fill in all required fields for the task.', 'warning');
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
      <div className="p-4 sm:p-8">
        <Button variant="secondary" onClick={() => setCurrentView('list')} icon={ArrowLeft} className="mb-6">
          Back to Tasks
        </Button>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
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
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Manage Tasks</h1>
      <Button onClick={() => handleOpenCreateTask()} icon={Plus} className="mb-6">
        Create New Task
      </Button>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
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
        </div>
      </Card>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask ? 'Edit Task' : 'Create New Task'}>
        <Input label="Task Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Python Functions" required />
        <Textarea label="Description (Rich Text Editor Mock)" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Provide detailed instructions and requirements..." rows={8} required />
        <Input label="Due Date" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required />
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">Invite Students</label>
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
  const { showMessage } = useContext(MessageContext);

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
      showMessage('Warning', 'Please fill all required fields for the meeting.', 'warning');
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
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Manage Meetings</h1>
      <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="mb-6">
        Schedule New Meeting
      </Button>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
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
                    {/* <Button variant="danger" size="sm" onClick={() => showMessage('Delete Meeting', `Deleting ${meeting.topic}`, 'info')} icon={Trash2}>
                      Delete
                    </Button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const { showMessage } = useContext(MessageContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const handleCreateAnnouncement = async () => {
    if (!formTitle || !formContent) {
      showMessage('Warning', 'Please fill all fields for the announcement.', 'warning');
      return;
    }
    await createAnnouncement({ title: formTitle, content: formContent });
    setFormTitle('');
    setFormContent('');
    setIsModalOpen(false);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Manage Announcements</h1>
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
              <Button variant="danger" size="sm" onClick={() => showMessage('Delete Announcement', `Deleting ${ann.title}`, 'info')} icon={Trash2}>Delete</Button>
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
  const { showMessage } = useContext(MessageContext);

  const handleSend = () => {
    if (message.trim()) {
      onSend(recipientId, message);
      setMessage('');
    } else {
      showMessage('Warning', 'Message cannot be empty.', 'warning');
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        rows={1}
        className="flex-grow mb-0 text-sm sm:text-base"
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
    <div className="p-4 sm:p-8 flex flex-col md:flex-row h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
      <div className="w-full md:w-1/3 bg-white rounded-t-xl md:rounded-l-xl md:rounded-tr-none shadow-lg md:border-r border-b md:border-b-0 border-gray-200 overflow-y-auto mb-4 md:mb-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">Students</h2>
        <ul className="divide-y divide-gray-100">
          {students.map((student) => (
            <li key={student.id}>
              <button
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full text-left p-4 hover:bg-blue-50 transition duration-200 text-sm sm:text-base ${
                  selectedStudentId === student.id ? 'bg-blue-100 font-semibold' : ''
                }`}
              >
                {student.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full md:w-2/3 bg-white rounded-b-xl md:rounded-r-xl md:rounded-bl-none shadow-lg flex flex-col">
        {selectedStudentId ? (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">
              Chat with {users.find(u => u.id === selectedStudentId)?.name}
            </h2>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {currentConversation.length === 0 ? (
                <p className="text-gray-500 text-center mt-10 text-sm sm:text-base">No messages yet. Start a conversation!</p>
              ) : (
                currentConversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm sm:text-base ${
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
          <div className="flex-grow flex items-center justify-center text-gray-500 text-sm sm:text-base">
            Select a student to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

// New Instructor Requests Page
const InstructorRequestsPage = () => {
  const { instructorApplications, approveInstructorApplication, rejectInstructorApplication } = useContext(DataContext);
  const { showMessage } = useContext(MessageContext);

  const handleApprove = async (application) => {
    await approveInstructorApplication(application.id, application.userId);
  };

  const handleReject = async (applicationId) => {
    await rejectInstructorApplication(applicationId);
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Instructor Requests</h1>
      <Card>
        {instructorApplications.length === 0 ? (
          <p className="text-gray-600 text-sm sm:text-base">No pending instructor applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Applied At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {instructorApplications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.appliedAt?.toDate().toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="primary" size="sm" onClick={() => handleApprove(app)} icon={CheckCircle}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleReject(app.id)} icon={Trash2}>
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
    if (submission && submission.status === 'graded') return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && dueDate >= today;
  }).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

  const upcomingMeetings = meetings.filter(meet => meet.invitedStudents.includes(user.uid) && new Date(`${meet.date}T${meet.time}`) >= new Date()).sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const latestAnnouncements = [...announcements].sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)).slice(0, 3);

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="My Progress">
          <p className="text-gray-700 text-base sm:text-lg mb-2">Overall Task Completion:</p>
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
                <li key={task.id} className="text-gray-700 text-sm sm:text-base">
                  <span className="font-semibold">{task.title}</span> - Due {task.dueDate}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-sm sm:text-base">No tasks due in the next 7 days.</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('student-tasks')} icon={ClipboardList}>
            View All Tasks
          </Button>
        </Card>

        <Card title="Upcoming Meetings">
          {upcomingMeetings.length > 0 ? (
            <ul className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <li key={meeting.id} className="text-gray-700 text-sm sm:text-base">
                  <span className="font-semibold">{meeting.topic}</span> on {meeting.date} at {meeting.time}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-sm sm:text-base">No upcoming meetings.</p>
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
              <li key={ann.id} className="text-gray-700 text-sm sm:text-base">
                <span className="font-semibold">{ann.title}</span> ({ann.date})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm sm:text-base">No announcements yet.</p>
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
  const { showMessage } = useContext(MessageContext);

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
    showMessage('Submission Sent', 'Your code has been submitted! The instructor will review it.', 'success');
    setSelectedTask(null);
  };

  const handleRunCode = () => {
    // This is a mock function. In a real app, this would send code to a server-side executor.
    showMessage('Running Code (Mock)', 'Running code...\n\nHello, World! (Mock Output)\nYour Name: Alice (Mock Output)', 'info');
    setMockOutput('Running code...\n\nHello, World! (Mock Output)\nYour Name: Alice (Mock Output)');
  };

  if (selectedTask) {
    const studentSubmission = submissions.find(sub => sub.taskId === selectedTask.id && sub.studentId === user.uid);
    return (
      <div className="p-4 sm:p-8">
        <Button variant="secondary" onClick={() => setSelectedTask(null)} icon={ArrowLeft} className="mb-6">
          Back to My Tasks
        </Button>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Task: {selectedTask.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Task Details">
            <h4 className="font-semibold text-gray-700 mb-2 text-base sm:text-lg">Due Date: {selectedTask.dueDate}</h4>
            <div className="prose max-w-none text-gray-700 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: selectedTask.description.replace(/\n/g, '<br/>') }}></div>
          </Card>

          <Card title="Your Code & Submission">
            <Textarea
              label="Write your code here (Code Editor Mock)"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              rows={15}
              className="font-mono text-xs sm:text-sm bg-gray-100 border border-gray-300 rounded-lg p-3"
            />
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
              <Button onClick={handleRunCode} icon={Code} variant="secondary" className="w-full sm:w-auto">
                Run Code (Mock)
              </Button>
              <Button onClick={handleSubmitCode} icon={CheckCircle} className="w-full sm:w-auto">
                Submit Task
              </Button>
            </div>
            {mockOutput && (
              <div className="bg-gray-100 p-4 rounded-lg text-xs sm:text-sm mt-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Mock Output:</h4>
                <pre className="whitespace-pre-wrap">{mockOutput}</pre>
              </div>
            )}
          </Card>
        </div>

        {studentSubmission && studentSubmission.status === 'graded' && (
          <Card title="Instructor Feedback & Grade" className="mt-8">
            <p className="text-base sm:text-lg font-bold text-gray-800 mb-3">Grade: <span className="text-blue-600">{studentSubmission.grade} / 100</span></p>
            <h4 className="font-semibold text-gray-700 mb-2 text-base sm:text-lg">Feedback:</h4>
            <p className="text-gray-700 text-sm sm:text-base">{studentSubmission.feedback}</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">My Tasks</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
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
        </div>
      </Card>
    </div>
  );
};

const StudentNotesPage = ({ user }) => {
  const { notes, addNote, deleteNote } = useContext(DataContext);
  const { showMessage } = useContext(MessageContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState('text');
  const [formFile, setFormFile] = useState(null);

  const myNotes = notes.filter(note => note.studentId === user.uid);

  const handleAddNote = async () => {
    if (!formTitle || (formType === 'text' && !formContent.trim()) || (formType === 'image' && !formFile)) {
      showMessage('Warning', 'Please fill all required fields for the note.', 'warning');
      return;
    }

    let imageUrl = null;
    if (formType === 'image' && formFile) {
      // In a real app, you'd upload formFile to Firebase Storage here
      // and get the download URL. For this demo, we'll use a placeholder.
      imageUrl = 'https://placehold.co/300x200/4CAF50/FFFFFF?text=Uploaded+Image';
      showMessage('Image Upload Simulated', 'Image upload simulated! In a real app, this would go to Firebase Storage.', 'info');
    }

    await addNote(user.uid, formTitle, formContent, formType, imageUrl);
    setFormTitle('');
    setFormContent('');
    setFormType('text');
    setFormFile(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">My Notes</h1>
      <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="mb-6">
        Add New Note
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myNotes.length === 0 ? (
          <p className="text-gray-600 col-span-full text-sm sm:text-base">You haven't added any notes yet.</p>
        ) : (
          myNotes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <div className="flex items-center mb-2">
                {note.type === 'text' ? <FileText className="h-5 w-5 mr-2 text-blue-600" /> : <Image className="h-5 w-5 mr-2 text-purple-600" />}
                <h3 className="text-xl font-semibold text-gray-800 flex-grow">{note.title}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">{note.createdAt?.toDate().toLocaleDateString()}</p>
              {note.type === 'text' ? (
                <p className="text-gray-700 flex-grow line-clamp-4 text-sm sm:text-base">{note.content}</p>
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
              className="w-full text-gray-700 border border-gray-300 rounded-lg p-2 text-sm sm:text-base"
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
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">My Meetings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myMeetings.length === 0 ? (
          <p className="text-gray-600 col-span-full text-sm sm:text-base">You have no scheduled meetings.</p>
        ) : (
          myMeetings.map((meeting) => (
            <Card key={meeting.id} className="flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{meeting.topic}</h3>
              <p className="text-gray-700 mb-1 text-sm sm:text-base">Date: {meeting.date}</p>
              <p className="text-gray-700 mb-3 text-sm sm:text-base">Time: {meeting.time}</p>
              {meeting.description && (
                <p className="text-gray-600 text-xs sm:text-sm mb-4 flex-grow">{meeting.description}</p>
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
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">Announcements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAnnouncements.length === 0 ? (
          <p className="text-gray-600 col-span-full text-sm sm:text-base">No announcements available.</p>
        ) : (
          sortedAnnouncements.map((ann) => (
            <Card key={ann.id} className="flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{ann.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{ann.date}</p>
              <p className="text-gray-700 flex-grow text-sm sm:text-base">{ann.content}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const StudentMessagesPage = ({ user }) => {
  const { messages, users, sendMessage } = useContext(DataContext);
  // eslint-disable-next-line no-unused-vars
  const instructor = users.find(u => u.role === 'instructor');

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
      <div className="p-4 sm:p-8 text-center text-gray-600 text-sm sm:text-base">
        <p>No instructor found to chat with. Please ask your administrator to create an instructor account.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col md:flex-row h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
      <div className="w-full md:w-1/3 bg-white rounded-t-xl md:rounded-l-xl md:rounded-tr-none shadow-lg md:border-r border-b md:border-b-0 border-gray-200 overflow-y-auto mb-4 md:mb-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">Conversations</h2>
        <ul className="divide-y divide-gray-100">
          <li>
            <button
              // No specific selection needed for single instructor, but keep for consistency
              className={`w-full text-left p-4 hover:bg-blue-50 transition duration-200 text-sm sm:text-base bg-blue-100 font-semibold`}
            >
              {instructor.name} (Instructor)
            </button>
          </li>
        </ul>
      </div>

      <div className="w-full md:w-2/3 bg-white rounded-b-xl md:rounded-r-xl md:rounded-bl-none shadow-lg flex flex-col">
        {/* Corrected: Wrapped adjacent elements in a JSX fragment */}
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">
            Chat with {instructor.name}
          </h2>
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {currentConversation.length === 0 ? (
              <p className="text-gray-500 text-center mt-10 text-sm sm:text-base">No messages yet. Start a conversation!</p>
            ) : (
              currentConversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm sm:text-base ${
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
  // Corrected: Added 'login' to the destructuring list
  const { user, login, logout, loadingAuth, registerAndCreateUserDoc, signInWithGoogle, applyForInstructor } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (user) {
        if (user.role === 'instructor') {
          setCurrentPage('instructor-dashboard');
        } else if (user.role === 'student') {
          setCurrentPage('student-dashboard');
        } else if (user.role === 'pending') {
          setCurrentPage('pending-approval');
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

  // Directly render the appropriate page based on user state and current page
  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {user && user.role && user.role !== 'pending' && <Navbar user={user} logout={logout} navigate={navigate} role={user.role} toggleSidebar={toggleSidebar} />}
      <div className="flex flex-col md:flex-row">
        {user && user.role && user.role !== 'pending' && <Sidebar navigate={navigate} role={user.role} currentPage={currentPage} showSidebar={showSidebar} toggleSidebar={toggleSidebar} />}
        {showSidebar && user && user.role !== 'pending' && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}
        <main className="flex-grow w-full">
          {(() => { // Using an IIFE to encapsulate the switch logic
            if (!user) {
              return <LoginPage login={login} registerAndCreateUserDoc={registerAndCreateUserDoc} signInWithGoogle={signInWithGoogle} applyForInstructor={applyForInstructor} />;
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
                case 'instructor-requests':
                  return <InstructorRequestsPage />;
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
            } else if (user.role === 'pending') {
              return <PendingApprovalPage />;
            }
            // Fallback in case user is defined but role is unexpected (shouldn't happen with current logic)
            return <LoginPage login={login} registerAndCreateUserDoc={registerAndCreateUserDoc} signInWithGoogle={signInWithGoogle} applyForInstructor={applyForInstructor} />;
          })()}
        </main>
      </div>
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
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalTitle, setMessageModalTitle] = useState('');
  const [messageModalContent, setMessageModalContent] = useState('');
  const [messageModalType, setMessageModalType] = useState('info');

  // eslint-disable-next-line no-unused-vars
  const showMessage = (title, content, type = 'info') => {
    setMessageModalTitle(title);
    setMessageModalContent(content);
    setMessageModalType(type);
    setMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setMessageModalOpen(false);
    setMessageModalTitle('');
    setMessageModalContent('');
    setMessageModalType('info');
  };

  return (
    <MessageContext.Provider value={{ showMessage }}>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
      <MessageModal
        isOpen={messageModalOpen}
        onClose={closeMessageModal}
        title={messageModalTitle}
        content={messageModalContent}
        type={messageModalType}
      />
    </MessageContext.Provider>
  );
}
