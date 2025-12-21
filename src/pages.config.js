import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Generate from './pages/Generate';
import Exam from './pages/Exam';
import Progress from './pages/Progress';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "Home": Home,
    "Dashboard": Dashboard,
    "Practice": Practice,
    "Generate": Generate,
    "Exam": Exam,
    "Progress": Progress,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};