import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User, LogOut, BookOpen, BarChart3, Award, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function GlobalNav() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

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
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  // Marketing pages nav items
  const marketingNavItems = [
    { label: 'Home', path: createPageUrl('Home') },
    { label: 'Demo', path: createPageUrl('Demo') },
    { label: 'About', path: createPageUrl('About') },
    { label: 'Pricing', path: createPageUrl('Pricing') },
  ];

  // App pages nav items
  const appNavItems = [
    { label: 'Practice', path: createPageUrl('Practice') },
    { label: 'SAT', path: createPageUrl('SATPractice') },
    { label: 'ACT', path: createPageUrl('ACTPractice') },
    { label: 'Notes', path: createPageUrl('Notes') },
    { label: 'Flashcards', path: createPageUrl('Flashcards') },
    { label: 'Documents', path: createPageUrl('DocumentAssistant') },
    { label: 'Workspace', path: createPageUrl('PracticeWorkspace') },
    { label: 'Exam', path: createPageUrl('Exam') },
    { label: 'Teacher', path: createPageUrl('TeacherMode') },
    { label: 'Tutor', path: createPageUrl('Tutor') },
    { label: 'Leaderboards', path: createPageUrl('Leaderboards') },
  ];

  const navItems = user ? appNavItems : marketingNavItems;

  const currentPageName = 'Proofly';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      {/* Floating Pill Container */}
      <nav className="relative">
        {/* Main Navbar Pill */}
        <div className="relative bg-[#171717] backdrop-blur-xl border border-[#2A2A2A] rounded-full px-6 py-3 shadow-2xl">
          <div className="flex items-center gap-8">
            {/* Logo / Current Page */}
            <Link to={createPageUrl(user ? 'Dashboard' : 'Home')} className="flex items-center gap-2 font-semibold text-base group">
              <BookOpen className="w-5 h-5 text-[#D6B98C] group-hover:text-[#C9A96A] transition-colors duration-300" />
              <span className="text-[#F5F5F5] group-hover:text-[#D6B98C] transition-all duration-300">
                {currentPageName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300",
                    location.pathname === item.path || new URL(location.pathname, 'http://localhost').pathname === new URL(item.path, 'http://localhost').pathname
                      ? "text-[#0C0C0C] bg-[#D6B98C]"
                      : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#1E1E1E]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            {!isLoading && (
              <div className="hidden lg:flex items-center gap-3">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#1E1E1E] transition-all duration-300">
                        <div className="w-7 h-7 rounded-full bg-[#D6B98C] flex items-center justify-center">
                          <span className="text-xs font-semibold text-[#0C0C0C]">
                            {user.full_name?.[0] || user.email?.[0] || 'U'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[#F5F5F5]">{user?.full_name || 'Student'}</span>
                        <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#171717] backdrop-blur-xl border-[#2A2A2A]">
                      <div className="px-3 py-2 border-b border-[#2A2A2A]">
                        <p className="text-sm font-medium text-[#F5F5F5]">{user?.full_name || 'Student'}</p>
                        <p className="text-xs text-[#8A8A8A]">{user?.email}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Analytics')} className="cursor-pointer text-[#F5F5F5] focus:text-[#D6B98C]">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Rewards')} className="cursor-pointer text-[#F5F5F5] focus:text-[#D6B98C]">
                          <Award className="w-4 h-4 mr-2" />
                          Rewards
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Settings')} className="cursor-pointer text-[#F5F5F5] focus:text-[#D6B98C]">
                          <User className="w-4 h-4 mr-2" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('QuestionValidation')} className="cursor-pointer text-[#D6B98C] focus:text-[#C9A96A]">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Question Validation
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#DC2626] focus:text-[#DC2626]">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="px-4 py-1.5 text-sm font-medium text-[#B5B5B5] hover:text-[#F5F5F5] rounded-full hover:bg-[#1E1E1E] transition-all duration-300"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleGetStarted}
                      className="px-5 py-1.5 text-sm font-semibold bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] rounded-full transition-all duration-300"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#B5B5B5] hover:text-[#F5F5F5] transition-colors ml-4"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden absolute top-full mt-2 left-0 right-0 bg-[#171717] backdrop-blur-xl border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-2 text-sm font-medium rounded-lg transition-all",
                      location.pathname === item.path
                        ? "text-[#0C0C0C] bg-[#D6B98C]"
                        : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#1E1E1E]"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-[#2A2A2A] my-2 pt-2">
                  {user ? (
                    <>
                      <Link
                        to={createPageUrl('Analytics')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded-lg transition-all mb-2"
                      >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Analytics
                      </Link>
                      <Link
                        to={createPageUrl('Rewards')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded-lg transition-all mb-2"
                      >
                        <Award className="w-4 h-4 inline mr-2" />
                        Rewards
                      </Link>
                      <Link
                        to={createPageUrl('Settings')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded-lg transition-all mb-2"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Account Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-[#DC2626] hover:text-[#DC2626] hover:bg-[#1E1E1E] rounded-lg transition-all"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleLogin();
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded-lg transition-all mb-2"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          handleGetStarted();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-sm font-semibold bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] rounded-lg"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}