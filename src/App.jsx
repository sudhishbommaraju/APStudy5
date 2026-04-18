import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import StudyMaterialsGenerator from './pages/StudyMaterialsGenerator';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import StudyPlanGenerator from './pages/StudyPlanGenerator';
import StudyAssistant from './pages/StudyAssistant';
import LandingPage from './pages/LandingPage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Roadmap from './pages/Roadmap';
import Store from './pages/Store';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AudioLessons from './pages/AudioLessons';
import APStudyHub from './pages/APStudyHub';
import BulkNotesGenerator from './pages/BulkNotesGenerator';
import ImprovementEngine from './pages/ImprovementEngine';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/study-generator" element={
        <LayoutWrapper currentPageName="StudyMaterialsGenerator">
          <StudyMaterialsGenerator />
        </LayoutWrapper>
      } />
      <Route path="/study-assistant" element={<StudyAssistant />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/Roadmap" element={<Roadmap />} />
      <Route path="/Store" element={<Store />} />
      <Route path="/ap-study-hub" element={
        <LayoutWrapper currentPageName="APStudyHub">
          <APStudyHub />
        </LayoutWrapper>
      } />
      <Route path="/bulk-notes-generator" element={
        <LayoutWrapper currentPageName="BulkNotesGenerator">
          <BulkNotesGenerator />
        </LayoutWrapper>
      } />
      <Route path="/audio-lessons" element={
        <LayoutWrapper currentPageName="AudioLessons">
          <AudioLessons />
        </LayoutWrapper>
      } />
      <Route path="/analytics-dashboard" element={
        <LayoutWrapper currentPageName="AnalyticsDashboard">
          <AnalyticsDashboard />
        </LayoutWrapper>
      } />
      <Route path="/study-plan-generator" element={
        <LayoutWrapper currentPageName="StudyPlanGenerator">
          <StudyPlanGenerator />
        </LayoutWrapper>
      } />
      <Route path="/improvement-engine" element={
        <LayoutWrapper currentPageName="ImprovementEngine">
          <ImprovementEngine />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App