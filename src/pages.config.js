import AIStudyPlanner from './pages/AIStudyPlanner';
import AdminUsers from './pages/AdminUsers';
import Analytics from './pages/Analytics';
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
import Tutor from './pages/Tutor';
import CourseBuilder from './pages/CourseBuilder';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIStudyPlanner": AIStudyPlanner,
    "AdminUsers": AdminUsers,
    "Analytics": Analytics,
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
    "Tutor": Tutor,
    "CourseBuilder": CourseBuilder,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};