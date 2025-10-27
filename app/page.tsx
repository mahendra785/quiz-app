// ============================================
// 1. app/layout.tsx - Minimal Layout
// ============================================

// ============================================
// 2. app/page.tsx - Landing Page with Nav
// ============================================

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { getUserByEmailAction } from "./actions/users";
import {
  Cloud,
  Users,
  Zap,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Play,
} from "lucide-react";

export default function LandingPage() {
  const { data } = useSession();
  const email = data?.user?.email;
  const [role, setRole] = useState<"admin" | "creator" | "learner" | undefined>(
    undefined
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud-Native Architecture",
      description:
        "Built for scale with serverless infrastructure that handles thousands of concurrent users effortlessly.",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Role-Based Security",
      description:
        "Granular access control with admin, creator, and student roles. Your data stays protected at every layer.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Evaluation",
      description:
        "Instant feedback with automatic grading. Students get results immediately after submission.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Performance Analytics",
      description:
        "Comprehensive insights into student performance, question difficulty, and learning patterns.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Unlimited Scalability",
      description:
        "From 10 to 10,000 users - our infrastructure scales automatically to meet your needs.",
      color: "from-rose-500 to-pink-500",
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Seamless Integration",
      description:
        "OAuth authentication, API access, and integrations with your existing learning management systems.",
      color: "from-violet-500 to-purple-500",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "< 100ms", label: "Response Time" },
    { value: "1M+", label: "Quizzes Delivered" },
    { value: "50K+", label: "Active Users" },
  ];

  const benefits = [
    "Handle massive traffic spikes during exam periods",
    "Secure role-based access for administrators and educators",
    "Instant automated grading and feedback",
    "Real-time performance dashboards",
    "Cloud-native scalability without infrastructure management",
    "SOC 2 compliant data security",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
            : "bg-white border-b border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-indigo-600 tracking-tight"
            >
              QuizLab
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors"
              >
                Benefits
              </a>
              {(role === "admin" || role === "creator") && (
                <Link
                  href="/creator"
                  className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors"
                >
                  Create Quiz
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </div>

            <div className="flex-1" />

            <div className="hidden md:flex items-center gap-3">
              {data?.user ? (
                <>
                  <span className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 font-medium">
                    {data.user.email?.split("@")[0]}
                    {role && (
                      <span className="ml-2 text-gray-500">• {role}</span>
                    )}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/api/auth/signin"
                    className="px-4 py-2 text-gray-700 font-medium text-sm hover:text-indigo-600 transition-colors"
                  >
                    Sign In
                  </a>
                  <a
                    href="/api/auth/signin/google"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </a>
                </>
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
            <a
              href="#features"
              className="text-gray-700 hover:text-indigo-600 font-medium py-2"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-gray-700 hover:text-indigo-600 font-medium py-2"
            >
              Benefits
            </a>
            {data?.user ? (
              <>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    {data.user.email}
                  </p>
                  {role && (
                    <p className="text-xs text-gray-500 mb-4">Role: {role}</p>
                  )}
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <a
                href="/api/auth/signin/google"
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium text-center hover:bg-indigo-700"
              >
                Get Started
              </a>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-sm font-medium">
                🚀 Cloud-Native Quiz Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                Scale Your
                <span className="text-indigo-600"> Assessments </span>
                to Millions
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Enterprise-grade quiz platform with role-based security,
                real-time evaluation, and unlimited scalability. Built for
                modern educational institutions.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/api/auth/signin/google"
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </a>
                <button className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-indigo-600">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 font-medium">
                    Live Activity
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-emerald-600 font-medium">
                      Online
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      quiz: "Cloud Computing Fundamentals",
                      users: 234,
                      color: "bg-indigo-500",
                    },
                    {
                      quiz: "Database Design Mastery",
                      users: 189,
                      color: "bg-violet-500",
                    },
                    {
                      quiz: "Security Best Practices",
                      users: 156,
                      color: "bg-emerald-500",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {item.quiz}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.users} active
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${(item.users / 250) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Everything You Need to{" "}
              <span className="text-indigo-600">Scale</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Purpose-built features that solve real problems faced by
              educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group bg-white border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  activeFeature === i
                    ? "border-indigo-500 shadow-lg"
                    : "border-gray-200"
                }`}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Solve Traditional Quiz Platform Limitations
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Say goodbye to server crashes, manual grading, and security
                vulnerabilities. Our cloud-native platform handles it all.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-emerald-200 transition-colors">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "Traditional Platforms",
                  value: 35,
                  color: "bg-red-500",
                },
                { label: "QuizLab", value: 98, color: "bg-emerald-500" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">
                      {item.label}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {item.value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color} transition-all duration-1000`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Ready to Transform Your Assessments?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of institutions using QuizLab to deliver secure,
              scalable quiz experiences.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/api/auth/signin/google"
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>
              <button className="px-8 py-4 border border-gray-300 text-gray-700 bg-white rounded-xl font-medium hover:bg-gray-50 transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">QuizLab</span>
              </div>
              <p className="text-gray-600 text-sm">
                Enterprise quiz platform for modern education
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security", "Roadmap"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Resources",
                links: ["Documentation", "API", "Support", "Status"],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4 text-gray-900">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a
                        href="#"
                        className="text-gray-600 hover:text-indigo-600 transition-colors text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2025 QuizLab. All rights reserved.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Cookies"].map((link, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-gray-600 hover:text-indigo-600 transition-colors text-sm"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
