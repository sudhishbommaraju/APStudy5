import AIStudyPlanner from './pages/AIStudyPlanner';
import About from './pages/About';
import AdminUsers from './pages/AdminUsers';
import Analytics from './pages/Analytics';
import CourseBuilder from './pages/CourseBuilder';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Exam from './pages/Exam';
import Flashcards from './pages/Flashcards';
import Generate from './pages/Generate';
import GroupDetail from './pages/GroupDetail';
import Home from './pages/Home';
import MistakeReplay from './pages/MistakeReplay';
import Notes from './pages/Notes';
import Onboarding from './pages/Onboarding';
import Practice from './pages/Practice';
import Pricing from './pages/Pricing';
import Progress from './pages/Progress';
import Rewards from './pages/Rewards';
import SeedData from './pages/SeedData';
import Settings from './pages/Settings';
import StudyGroups from './pages/StudyGroups';
import StudyPlans from './pages/StudyPlans';
import TeacherMode from './pages/TeacherMode';
import Tutor from './pages/Tutor';
import QuestionValidation from './pages/QuestionValidation';
import Demo from './pages/Demo';
import PracticeWorkspace from './pages/PracticeWorkspace';
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
    "Exam": Exam,
    "Flashcards": Flashcards,
    "Generate": Generate,
    "GroupDetail": GroupDetail,
    "Home": Home,
    "MistakeReplay": MistakeReplay,
    "Notes": Notes,
    "Onboarding": Onboarding,
    "Practice": Practice,
    "Pricing": Pricing,
    "Progress": Progress,
    "Rewards": Rewards,
    "SeedData": SeedData,
    "Settings": Settings,
    "StudyGroups": StudyGroups,
    "StudyPlans": StudyPlans,
    "TeacherMode": TeacherMode,
    "Tutor": Tutor,
    "QuestionValidation": QuestionValidation,
    "Demo": Demo,
    "PracticeWorkspace": PracticeWorkspace,
    "ValidationDashboard": ValidationDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};