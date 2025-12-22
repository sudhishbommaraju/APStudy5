import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Generate from './pages/Generate';
import Exam from './pages/Exam';
import Progress from './pages/Progress';
import Notes from './pages/Notes';
import Flashcards from './pages/Flashcards';
import SeedData from './pages/SeedData';
import Tutor from './pages/Tutor';
import About from './pages/About';
import Pricing from './pages/Pricing';
import MistakeReplay from './pages/MistakeReplay';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "Home": Home,
    "Dashboard": Dashboard,
    "Practice": Practice,
    "Generate": Generate,
    "Exam": Exam,
    "Progress": Progress,
    "Notes": Notes,
    "Flashcards": Flashcards,
    "SeedData": SeedData,
    "Tutor": Tutor,
    "About": About,
    "Pricing": Pricing,
    "MistakeReplay": MistakeReplay,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};