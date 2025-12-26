import AdminUsers from './pages/AdminUsers';
import Dashboard from './pages/Dashboard';
import Exam from './pages/Exam';
import Flashcards from './pages/Flashcards';
import Generate from './pages/Generate';
import Home from './pages/Home';
import MistakeReplay from './pages/MistakeReplay';
import Notes from './pages/Notes';
import Onboarding from './pages/Onboarding';
import Practice from './pages/Practice';
import Pricing from './pages/Pricing';
import Progress from './pages/Progress';
import SeedData from './pages/SeedData';
import Settings from './pages/Settings';
import StudyPlans from './pages/StudyPlans';
import Tutor from './pages/Tutor';
import Analytics from './pages/Analytics';
import Rewards from './pages/Rewards';
import StudyGroups from './pages/StudyGroups';
import AIStudyPlanner from './pages/AIStudyPlanner';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminUsers": AdminUsers,
    "Dashboard": Dashboard,
    "Exam": Exam,
    "Flashcards": Flashcards,
    "Generate": Generate,
    "Home": Home,
    "MistakeReplay": MistakeReplay,
    "Notes": Notes,
    "Onboarding": Onboarding,
    "Practice": Practice,
    "Pricing": Pricing,
    "Progress": Progress,
    "SeedData": SeedData,
    "Settings": Settings,
    "StudyPlans": StudyPlans,
    "Tutor": Tutor,
    "Analytics": Analytics,
    "Rewards": Rewards,
    "StudyGroups": StudyGroups,
    "AIStudyPlanner": AIStudyPlanner,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};