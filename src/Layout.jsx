import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Sparkles, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  User,
  TrendingUp,
  FileText,
  Brain,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UpgradeModal from '@/components/monetization/UpgradeModal';
const NAV_ITEMS = [
  { name: 'About', icon: Info, page: 'About' },
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Practice', icon: BookOpen, page: 'Practice' },
  { name: 'Exam', icon: Clock, page: 'Exam' },
  { name: 'Tutor', icon: Brain, page: 'Tutor' },
  { name: 'Generate', icon: Sparkles, page: 'Generate' },
  { name: 'Notes', icon: FileText, page: 'Notes' },
  { name: 'Flashcards', icon: Brain, page: 'Flashcards' },
  { name: 'Progress', icon: TrendingUp, page: 'Progress' },
  { name: 'Pricing', icon: Zap, page: 'Pricing' },
];

const EXAM_NAMES = {
  ap_calculus: 'AP Calculus',
  sat_math: 'SAT Math',
  act_math: 'ACT Math',
  psat_math: 'PSAT Math',
};

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Pages that don't need the full layout
  const noLayoutPages = ['Home', 'Onboarding'];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        // Not authenticated
      }
    };
    loadUser();
  }, []);

  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 galaxy-gradient-subtle border-b border-slate-700/30 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14">
                  {/* Logo */}
                  <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)' }}>
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <span className="font-bold text-lg text-black hidden sm:block">Proofly</span>
                  </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-black rounded-lg hover:bg-white/10 transition-all"
                  style={{ 
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* Upgrade Button for Free Users */}
              {user?.plan === 'free' && (
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:scale-105 animate-pulse"
                  style={{ 
                    background: 'linear-gradient(135deg, #A855F7, #C084FC)',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Upgrade
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-300 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-900">{user?.full_name || 'Student'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('About')} className="cursor-pointer">
                      About Proofly
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/30 bg-slate-900/95 backdrop-blur-lg">
            <nav className="px-4 py-2 space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/10 transition-all"
                  style={{ 
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Upgrade Modal */}
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
      </div>
      );
      }