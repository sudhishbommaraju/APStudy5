/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIStudyPlanner from './pages/AIStudyPlanner';
import About from './pages/About';
import AdminUsers from './pages/AdminUsers';
import Analytics from './pages/Analytics';
import CourseBuilder from './pages/CourseBuilder';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Demo from './pages/Demo';
import Exam from './pages/Exam';
import Flashcards from './pages/Flashcards';
import Generate from './pages/Generate';
import GroupDetail from './pages/GroupDetail';
import Home from './pages/Home';
import MistakeReplay from './pages/MistakeReplay';
import Notes from './pages/Notes';
import Onboarding from './pages/Onboarding';
import Practice from './pages/Practice';
import PracticeWorkspace from './pages/PracticeWorkspace';
import Pricing from './pages/Pricing';
import Progress from './pages/Progress';
import QuestionValidation from './pages/QuestionValidation';
import Rewards from './pages/Rewards';
import SeedData from './pages/SeedData';
import Settings from './pages/Settings';
import StudyGroups from './pages/StudyGroups';
import StudyPlans from './pages/StudyPlans';
import TeacherMode from './pages/TeacherMode';
import Tutor from './pages/Tutor';
import ValidationDashboard from './pages/ValidationDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIStudyPlanner": AIStudyPlanner,
    "About": About,
    "AdminUsers": AdminUsers,
    "Analytics": Analytics,
    "CourseBuilder": CourseBuilder,
    "Courses": Courses,
    "Dashboard": Dashboard,
    "Demo": Demo,
    "Exam": Exam,
    "Flashcards": Flashcards,
    "Generate": Generate,
    "GroupDetail": GroupDetail,
    "Home": Home,
    "MistakeReplay": MistakeReplay,
    "Notes": Notes,
    "Onboarding": Onboarding,
    "Practice": Practice,
    "PracticeWorkspace": PracticeWorkspace,
    "Pricing": Pricing,
    "Progress": Progress,
    "QuestionValidation": QuestionValidation,
    "Rewards": Rewards,
    "SeedData": SeedData,
    "Settings": Settings,
    "StudyGroups": StudyGroups,
    "StudyPlans": StudyPlans,
    "TeacherMode": TeacherMode,
    "Tutor": Tutor,
    "ValidationDashboard": ValidationDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};