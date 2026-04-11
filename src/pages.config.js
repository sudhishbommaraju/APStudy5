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
import ACTAdaptivePractice from './pages/ACTAdaptivePractice';
import ACTFullTest from './pages/ACTFullTest';
import ACTPractice from './pages/ACTPractice';
import AIStudyPlanner from './pages/AIStudyPlanner';
import APCreate from './pages/APCreate';
import APFRQSimulator from './pages/APFRQSimulator';
import APFullTest from './pages/APFullTest';
import APPractice from './pages/APPractice.jsx';
import APProgress from './pages/APProgress';
import APQuestionGenerator from './pages/APQuestionGenerator';
import APStudyKit from './pages/APStudyKit';
import APUpload from './pages/APUpload';
import APYoutube from './pages/APYoutube';
import About from './pages/About';
import AdminHealth from './pages/AdminHealth';
import AdminUsers from './pages/AdminUsers';
import Analytics from './pages/Analytics';
import CourseBuilder from './pages/CourseBuilder';
import Courses from './pages/Courses';
import CreateNotes from './pages/CreateNotes';
import Dashboard from './pages/Dashboard';
import Demo from './pages/Demo';
import Diagnostic from './pages/Diagnostic';
import Engine from './pages/Engine';
import EngineAnalytics from './pages/EngineAnalytics';
import EngineBenchmarks from './pages/EngineBenchmarks';
import EngineHome from './pages/EngineHome';
import EngineMistakes from './pages/EngineMistakes';
import EngineNotes from './pages/EngineNotes';
import EnginePracticeBuilder from './pages/EnginePracticeBuilder';
import EnginePracticeSession from './pages/EnginePracticeSession';
import EngineResults from './pages/EngineResults';
import EngineTimedQuiz from './pages/EngineTimedQuiz';
import Flashcards from './pages/Flashcards';
import Generate from './pages/Generate';
import GroupDetail from './pages/GroupDetail';
import Home from './pages/Home';
import MistakeReplay from './pages/MistakeReplay';
import NotionSetupGuide from './pages/NotionSetupGuide';
import NotionSync from './pages/NotionSync';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import QuestionValidation from './pages/QuestionValidation';
import Results from './pages/Results';
import Rewards from './pages/Rewards';
import SATAdaptivePractice from './pages/SATAdaptivePractice';
import SATFullTest from './pages/SATFullTest';
import SATPractice from './pages/SATPractice';
import SeedData from './pages/SeedData';
import SeedTaxonomy from './pages/SeedTaxonomy';
import Settings from './pages/Settings';
import StudyGroups from './pages/StudyGroups';
import StudyPlans from './pages/StudyPlans';
import Tier from './pages/Tier';
import Upload from './pages/Upload';
import ValidationDashboard from './pages/ValidationDashboard';
import Youtube from './pages/Youtube';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ACTAdaptivePractice": ACTAdaptivePractice,
    "ACTFullTest": ACTFullTest,
    "ACTPractice": ACTPractice,
    "AIStudyPlanner": AIStudyPlanner,
    "APCreate": APCreate,
    "APFRQSimulator": APFRQSimulator,
    "APFullTest": APFullTest,
    "APPractice": APPractice,
    "APProgress": APProgress,
    "APQuestionGenerator": APQuestionGenerator,
    "APStudyKit": APStudyKit,
    "APUpload": APUpload,
    "APYoutube": APYoutube,
    "About": About,
    "AdminHealth": AdminHealth,
    "AdminUsers": AdminUsers,
    "Analytics": Analytics,
    "CourseBuilder": CourseBuilder,
    "Courses": Courses,
    "CreateNotes": CreateNotes,
    "Dashboard": Dashboard,
    "Demo": Demo,
    "Diagnostic": Diagnostic,
    "Engine": Engine,
    "EngineAnalytics": EngineAnalytics,
    "EngineBenchmarks": EngineBenchmarks,
    "EngineHome": EngineHome,
    "EngineMistakes": EngineMistakes,
    "EngineNotes": EngineNotes,
    "EnginePracticeBuilder": EnginePracticeBuilder,
    "EnginePracticeSession": EnginePracticeSession,
    "EngineResults": EngineResults,
    "EngineTimedQuiz": EngineTimedQuiz,
    "Flashcards": Flashcards,
    "Generate": Generate,
    "GroupDetail": GroupDetail,
    "Home": Home,
    "MistakeReplay": MistakeReplay,
    "NotionSetupGuide": NotionSetupGuide,
    "NotionSync": NotionSync,
    "Onboarding": Onboarding,
    "Pricing": Pricing,
    "Profile": Profile,
    "Progress": Progress,
    "QuestionValidation": QuestionValidation,
    "Results": Results,
    "Rewards": Rewards,
    "SATAdaptivePractice": SATAdaptivePractice,
    "SATFullTest": SATFullTest,
    "SATPractice": SATPractice,
    "SeedData": SeedData,
    "SeedTaxonomy": SeedTaxonomy,
    "Settings": Settings,
    "StudyGroups": StudyGroups,
    "StudyPlans": StudyPlans,
    "Tier": Tier,
    "Upload": Upload,
    "ValidationDashboard": ValidationDashboard,
    "Youtube": Youtube,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "Privacy": Privacy,
    "Terms": Terms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};