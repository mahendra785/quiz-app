"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { getUserByEmailAction } from "./actions/users";
import {
  Zap,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { data } = useSession();
  const email = data?.user?.email;
  const [role, setRole] = useState<"admin" | "creator" | "learner" | undefined>(
    undefined
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (email) {
      getUserByEmailAction(email)
        .then((userobj) => {
          if (mounted) setRole(userobj?.role);
        })
        .catch(() => {
          if (mounted) setRole(undefined);
        });
    } else {
      setRole(undefined);
    }
    return () => {
      mounted = false;
    };
  }, [email]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Grading",
      description: "Automatic evaluation with real-time feedback for students",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Access",
      description: "Role-based permissions for admins, creators, and learners",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics",
      description: "Track performance and identify learning patterns",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                QuizLab
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {data?.user ? (
                <>
                  {(role === "admin" || role === "creator") && (
                    <>
                      <Link
                        href="/creator"
                        className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                      >
                        Create Quiz
                      </Link>
                      <Link
                        href="/quiz"
                        className="py-3 text-gray-700 font-medium hover:text-indigo-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Quizzes
                      </Link>
                    </>
                  )}
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  {role === "learner" && (
                    <Link
                      href="/quiz"
                      className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                    >
                      My Quizzes
                    </Link>
                  )}
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <span className="text-sm text-gray-600">
                      {data.user.email?.split("@")[0]}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <a
                  href="/api/auth/signin/google"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Get Started
                </a>
              )}
            </div>

            <button
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-4">
            {data?.user ? (
              <>
                {(role === "admin" || role === "creator") && (
                  <Link
                    href="/creator"
                    className="py-3 text-gray-700 font-medium hover:text-indigo-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Quiz
                  </Link>
                )}

                {/* Show quizzes link for all signed-in users (label changes for learners) */}
                <Link
                  href="/quiz"
                  className="py-3 text-gray-700 font-medium hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Quizzes
                </Link>

                {role === "admin" && (
                  <Link
                    href="/admin"
                    className="py-3 text-gray-700 font-medium hover:text-indigo-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    {data.user.email}
                  </p>
                  <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <a
                href="/api/auth/signin/google"
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-center"
              >
                Get Started
              </a>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            🚀 Modern Quiz Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent leading-tight">
            Create & Take Quizzes
            <br />
            The Smart Way
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Build engaging quizzes, track performance, and provide instant
            feedback with our intuitive platform
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <a
              href="/api/auth/signin/google"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all flex items-center gap-2"
            >
              Start Free
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { value: "10K+", label: "Quizzes Created" },
              { value: "50K+", label: "Students" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features for educators and learners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-indigo-200 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose QuizLab?
            </h2>
            <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
              Join thousands of educators creating better learning experiences
            </p>

            <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto mb-12">
              {[
                "Create unlimited quizzes with custom questions",
                "Automatic grading saves hours of manual work",
                "Real-time analytics and performance tracking",
                "Secure role-based access control",
                "Mobile-friendly for learning on the go",
                "Export results and generate reports",
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            <a
              href="/api/auth/signin/google"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-medium hover:shadow-2xl transition-all"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">QuizLab</span>
          </div>
          <p className="text-gray-600 mb-6">
            Modern quiz platform for educators
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 QuizLab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
