import About from './pages/About';
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
import Tutor from './pages/Tutor';
import AdminUsers from './pages/AdminUsers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
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
    "Tutor": Tutor,
    "AdminUsers": AdminUsers,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};