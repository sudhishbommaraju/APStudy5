import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User, LogOut, BookOpen } from 'lucide-react';
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
    { label: 'Pricing', path: createPageUrl('Pricing') },
  ];

  // App pages nav items
  const appNavItems = [
    { label: 'Practice', path: createPageUrl('Practice') },
    { label: 'Exam', path: createPageUrl('Exam') },
    { label: 'Tutor', path: createPageUrl('Tutor') },
    { label: 'Notes', path: createPageUrl('Notes') },
    { label: 'Flashcards', path: createPageUrl('Flashcards') },
    { label: 'Progress', path: createPageUrl('Progress') },
    { label: 'Pricing', path: createPageUrl('Pricing') },
  ];

  const navItems = user ? appNavItems : marketingNavItems;

  const currentPageName = 'Proofly';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      {/* Floating Pill Container */}
      <nav className="relative">
        {/* Cosmic Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-violet-500/20 rounded-full blur-xl" />
        
        {/* Main Navbar Pill */}
        <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-full px-6 py-3 shadow-2xl">
          <div className="flex items-center gap-8">
            {/* Logo / Current Page */}
            <Link to={createPageUrl(user ? 'Dashboard' : 'Home')} className="flex items-center gap-2 text-white font-bold text-base group">
              <BookOpen className="w-5 h-5 group-hover:text-violet-300 transition-colors duration-300" />
              <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover:from-violet-200 group-hover:to-indigo-200 transition-all duration-300">
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
                    location.pathname === item.path
                      ? "text-white bg-white/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                      : "text-slate-300 hover:text-white hover:bg-white/5 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)]"
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
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all duration-300">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                          <span className="text-xs font-semibold text-white">
                            {user.full_name?.[0] || user.email?.[0] || 'U'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-300">{user?.full_name || 'Student'}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                      <div className="px-3 py-2 border-b border-slate-700/50">
                        <p className="text-sm font-medium text-slate-100">{user?.full_name || 'Student'}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Settings')} className="cursor-pointer text-slate-100 focus:text-white">
                          <User className="w-4 h-4 mr-2" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700/50" />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-rose-400 focus:text-rose-400">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="px-4 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-full hover:bg-white/5 transition-all duration-300"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleGetStarted}
                      className="relative px-5 py-1.5 text-sm font-semibold text-white rounded-full overflow-hidden group"
                    >
                      {/* Celestial Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 group-hover:from-indigo-500 group-hover:via-violet-500 group-hover:to-indigo-500 transition-all duration-300" />
                      {/* Inner Luminous Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-400/20 to-violet-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Outer Cosmic Glow */}
                      <div className="absolute inset-0 shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all duration-300 rounded-full" />
                      <span className="relative">Get Started</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-300 hover:text-white transition-colors ml-4"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden absolute top-full mt-2 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-2 text-sm font-medium rounded-lg transition-all",
                      location.pathname === item.path
                        ? "text-white bg-white/10"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-slate-700/50 my-2 pt-2">
                  {user ? (
                    <>
                      <Link
                        to={createPageUrl('Settings')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all mb-2"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Account Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-white/5 rounded-lg transition-all"
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
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all mb-2"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          handleGetStarted();
                          setMobileMenuOpen(false);
                        }}
                        className="relative w-full px-4 py-2 text-sm font-semibold text-white rounded-lg overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />
                        <span className="relative">Get Started</span>
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