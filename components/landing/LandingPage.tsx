'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MiniBarChart from '@/components/MiniBarChart';
import PlatformShowcaseSlide, { type ShowcaseVariant } from '@/components/landing/PlatformShowcaseSlide';

const C = {
  primary: '#22C55E',
  dark: '#0B1F14',
  bg: '#F4F7F5',
  card: '#FFFFFF',
  muted: '#6B7280',
  heading: '#0F172A',
  border: '#E5E7EB',
};

const LOGO =
  'https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png';

const NAV = ['Features', 'Modules', 'Analytics', 'Roles', 'Contact'] as const;

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return v;
}

function Section({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function GlowButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300';
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
      : variant === 'outline'
        ? 'border border-[#E5E7EB] bg-white/70 backdrop-blur-md text-[#0F172A] hover:border-emerald-400/60 hover:shadow-md'
        : 'text-emerald-600 hover:text-emerald-700 hover:underline';

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

const attendanceData = [
  { day: 'Mon', value: 42 },
  { day: 'Tue', value: 58 },
  { day: 'Wed', value: 51 },
  { day: 'Thu', value: 67 },
  { day: 'Fri', value: 72 },
  { day: 'Sat', value: 38 },
  { day: 'Sun', value: 29 },
];

const reportTrend = [
  { m: 'Jan', reports: 120 },
  { m: 'Feb', reports: 145 },
  { m: 'Mar', reports: 168 },
  { m: 'Apr', reports: 192 },
  { m: 'May', reports: 210 },
  { m: 'Jun', reports: 238 },
];

const performanceData = [
  { m: 'W1', score: 72 },
  { m: 'W2', score: 78 },
  { m: 'W3', score: 81 },
  { m: 'W4', score: 88 },
  { m: 'W5', score: 91 },
];

const FEATURES = [
  { title: 'Attendance Tracking', desc: 'Geo-tagged photos, timestamps, and proof-of-session records.', icon: '✓' },
  { title: 'Daily Reports', desc: 'Structured class logs with topics, summaries, and notes.', icon: '📄' },
  { title: 'Analytics Dashboard', desc: 'Real-time KPIs, trends, and operational visibility.', icon: '📊' },
  { title: 'Meeting Management', desc: 'Join links, PPTs, schedules, and click tracking.', icon: '🔗' },
  { title: 'School & User Management', desc: 'Roles, schools, assignments, and access control.', icon: '🏫' },
  { title: 'Combined Sheets', desc: 'Unified attendance + report views for audits.', icon: '📋' },
  { title: 'Performance Monitoring', desc: 'Engagement scores, completion, and batch insights.', icon: '📈' },
  { title: 'Mobile / PWA Support', desc: 'Field-ready workflows on phones and tablets.', icon: '📱' },
];

const ROLES = [
  {
    role: 'ADMIN',
    title: 'Administrator',
    desc: 'Full operational control across schools, users, and analytics.',
    features: ['User & school management', 'Global analytics', 'Meeting links', 'Late requests'],
    chart: [3, 5, 4, 7, 8, 9, 6],
  },
  {
    role: 'TEACHER',
    title: 'School View',
    desc: 'School-scoped dashboards, meetings, and progress tracking.',
    features: ['Attendance overview', 'Meeting links & PPTs', 'Reports & assignments', 'Performance view'],
    chart: [2, 4, 6, 5, 7, 8, 7],
  },
  {
    role: 'TRAINER',
    title: 'Trainer',
    desc: 'Mark attendance, submit reports, and join sessions on the go.',
    features: ['Mark attendance', 'Daily class reports', 'Combined sheet', 'Trainer analytics'],
    chart: [4, 6, 5, 8, 7, 9, 8],
  },
];

const WORKFLOW = [
  { step: '01', title: 'Trainer Marks Attendance', desc: 'Photo + location proof captured in seconds.' },
  { step: '02', title: 'Upload Daily Report', desc: 'Topics, summary, and session notes logged.' },
  { step: '03', title: 'School View Reviews Progress', desc: 'Meetings, reports, and class performance.' },
  { step: '04', title: 'Admin Tracks Analytics', desc: 'Cross-school KPIs and operational dashboards.' },
  { step: '05', title: 'Generate Insights', desc: 'Trends, exports, and audit-ready records.' },
];

const SCREENSHOTS: { label: string; variant: ShowcaseVariant; description: string }[] = [
  { label: 'Admin Dashboard', variant: 'admin', description: 'Schools, users, and global analytics in one view.' },
  { label: 'School View Dashboard', variant: 'teacher', description: 'Meetings, attendance, and class progress for your school.' },
  { label: 'Trainer Dashboard', variant: 'trainer', description: 'Mark attendance, submit reports, and track sessions on the go.' },
  { label: 'Attendance', variant: 'attendance', description: 'Photo and location proof for every training session.' },
  { label: 'Analytics', variant: 'analytics', description: 'Trends, charts, and operational KPIs at a glance.' },
];

const WHY = [
  'Designed for schools',
  'Built for trainers',
  'Real-time attendance proof',
  'Centralized management',
  'Mobile-first workflow',
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const trustRef = useRef(null);
  const trustInView = useInView(trustRef, { once: true });

  const schools = useCountUp(100, trustInView);
  const attendance = useCountUp(10000, trustInView);
  const trainers = useCountUp(500, trustInView);
  const uptime = useCountUp(99, trustInView);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SCREENSHOTS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Navbar outside overflow-x-hidden wrapper — ancestor overflow clips fixed layers on mobile and blocks taps */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] shadow-sm' : 'bg-transparent'
        }`}
      >
        <motion.div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <img src={LOGO} alt="Robochamps ERP" className="h-8 sm:h-9 object-contain" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-sm font-medium text-[#6B7280] hover:text-emerald-600 transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <GlowButton href="/login" variant="outline">
              Login
            </GlowButton>
            <GlowButton href="/signup">Get Started</GlowButton>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 rounded-xl border border-[#E5E7EB] bg-white/80"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </motion.div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="landing-mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 pointer-events-auto"
            >
              {NAV.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => scrollTo(item.toLowerCase())}
                  className="block w-full text-left py-2 text-sm font-medium text-[#374151]"
                >
                  {item}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <GlowButton href="/login" variant="outline" className="w-full">
                  Login
                </GlowButton>
                <GlowButton href="/signup" className="w-full">
                  Get Started
                </GlowButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <motion.div
        className="min-h-screen w-full overflow-x-hidden text-[#0F172A] antialiased"
        style={{ background: C.bg }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <motion.div
          className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-emerald-400/20 blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-w-0">
            <div className="min-w-0">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4"
              >
                Smart Robotics Training Management Platform
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-[#0F172A] leading-[1.1] tracking-tight"
              >
                The Complete ERP for Robotics Training Programs
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-lg text-[#6B7280] leading-relaxed max-w-xl"
              >
                Manage schools, trainers, attendance, reports, analytics, meetings, and operations from one
                intelligent platform.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <GlowButton href="/signup">Get Started</GlowButton>
                <GlowButton href="/login" variant="outline">
                  Login
                </GlowButton>
              </motion.div>
            </div>

            {/* Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="relative min-w-0"
            >
              <div className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-2xl shadow-emerald-500/10 overflow-hidden">
                <motion.div className="flex min-w-0 w-full" style={{ background: 'linear-gradient(180deg, #07130D 0%, #0B1F14 100%)' }}>
                  <div className="w-14 shrink-0 py-4 px-2 space-y-2 border-r border-white/10">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-2 rounded ${i === 1 ? 'bg-emerald-400/80 w-8' : 'bg-white/10 w-6'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0 p-4 sm:p-5" style={{ background: C.bg }}>
                    <motion.div className="flex gap-2 mb-4">
                      <div className="h-2 w-24 rounded bg-[#E5E7EB]" />
                      <div className="h-2 w-16 rounded bg-emerald-200" />
                    </motion.div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {[
                        { t: 'Attendance', v: '94%', c: '#22C55E' },
                        { t: 'Trainers', v: '128', c: '#3B82F6' },
                        { t: 'Reports', v: '1.2k', c: '#8B5CF6' },
                        { t: 'Schools', v: '86', c: '#F59E0B' },
                      ].map((card, i) => (
                        <motion.div
                          key={card.t}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          className="rounded-2xl bg-white border border-[#E5E7EB] p-3 shadow-sm"
                        >
                          <p className="text-[10px] text-[#6B7280] font-medium">{card.t}</p>
                          <p className="text-lg font-bold text-[#0F172A]">{card.v}</p>
                          <MiniBarChart data={[2, 4, 3, 5, 6, 4, 7]} color={card.c} height={28} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-3 h-24 min-h-0 rounded-2xl bg-white border border-[#E5E7EB] p-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceData}>
                          <defs>
                            <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#22C55E" fill="url(#heroGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              </div>

              {[
                { label: 'Attendance Rate', value: '94%', top: '-12px', left: '-8px', delay: 0.5 },
                { label: 'Active Trainers', value: '500+', top: '20%', right: '-12px', delay: 0.65 },
                { label: 'Reports Submitted', value: '10k+', bottom: '28%', left: '-16px', delay: 0.8 },
                { label: 'Schools Connected', value: '100+', bottom: '-8px', right: '8px', delay: 0.95 },
              ].map((fc) => (
                <motion.div
                  key={fc.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                  transition={{
                    opacity: { delay: fc.delay },
                    scale: { delay: fc.delay },
                    y: { duration: 4, repeat: Infinity, delay: fc.delay },
                  }}
                  style={{ top: fc.top, left: fc.left, right: fc.right, bottom: fc.bottom }}
                  className="absolute hidden sm:block rounded-2xl border border-[#E5E7EB] bg-white/95 backdrop-blur-md px-3 py-2 shadow-lg shadow-emerald-500/10"
                >
                  <p className="text-[10px] text-[#6B7280] font-medium">{fc.label}</p>
                  <p className="text-sm font-bold text-emerald-600">{fc.value}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section ref={trustRef} className="border-y border-[#E5E7EB] bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Schools', value: `${schools}+` },
              { label: 'Attendance Records', value: `${attendance.toLocaleString()}+` },
              { label: 'Trainers', value: `${trainers}+` },
              { label: 'Operational Tracking', value: `${uptime}.9%` },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={trustInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{m.value}</p>
                <p className="text-sm text-[#6B7280] mt-1">{m.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <GlowButton href="/signup" className="text-sm py-2.5 px-5">
              Start Free
            </GlowButton>
            <Link href="/login" className="text-sm font-semibold text-emerald-600 hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <Section id="features" className="py-20 lg:py-28">
        <motion.div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">Everything your robotics program needs</h2>
            <p className="mt-4 text-[#6B7280]">
              An ERP for schools, trainers, School View accounts, and admins — attendance, reports, analytics, and more.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-shadow"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg mb-4 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-shadow">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{f.desc}</p>
                <MiniBarChart data={[2, 5, 3, 6, 4, 7, 5]} color={C.primary} height={32} />
                <motion.div className="mt-4 flex gap-2">
                  <button type="button" className="text-xs font-semibold text-emerald-600 hover:underline">
                    Learn More →
                  </button>
                  <Link href="/login" className="text-xs font-semibold text-[#6B7280] hover:text-[#0F172A]">
                    Login
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Modules anchor = features grid above; duplicate id for nav */}
      <div id="modules" className="h-0" aria-hidden />

      {/* Roles */}
      <Section id="roles" className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Role-Based Access</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">Built for every stakeholder</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.role}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {r.role}
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] mt-4">{r.title}</h3>
                <p className="text-sm text-[#6B7280] mt-2">{r.desc}</p>
                <ul className="mt-4 space-y-2">
                  {r.features.map((f) => (
                    <li key={f} className="text-sm text-[#374151] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <MiniBarChart data={r.chart} color={C.primary} height={36} />
                </div>
                <div className="mt-6 flex gap-2">
                  <GlowButton href="/login" variant="outline" className="flex-1 text-xs py-2.5">
                    Login
                  </GlowButton>
                  <GlowButton href="/signup" className="flex-1 text-xs py-2.5">
                    Get Started
                  </GlowButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Analytics */}
      <Section id="analytics" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Analytics</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">Data-driven operations at a glance</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-6 min-w-0">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm min-w-0 overflow-hidden">
              <h3 className="font-bold text-[#0F172A] mb-4">Weekly Attendance</h3>
              <motion.div className="h-56 min-w-0 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}` }} />
                    <Bar dataKey="value" fill={C.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm min-w-0 overflow-hidden">
              <h3 className="font-bold text-[#0F172A] mb-4">Report Trends</h3>
              <div className="h-56 min-w-0 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}` }} />
                    <Line type="monotone" dataKey="reports" stroke={C.primary} strokeWidth={3} dot={{ fill: C.primary }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm lg:col-span-2 min-w-0 overflow-hidden">
              <div className="grid sm:grid-cols-2 gap-6 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0F172A] mb-4">Performance Score</h3>
                  <div className="h-48 min-w-0 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="score" stroke="#22C55E" fill="url(#perfGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-4">
                  {[
                    { label: 'Trainer sessions', value: '2,400+' },
                    { label: 'Avg. completion', value: '91%' },
                    { label: 'Live meetings', value: '340/wk' },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between items-center rounded-2xl bg-[#F4F7F5] px-4 py-3 border border-[#E5E7EB]">
                      <span className="text-sm text-[#6B7280]">{s.label}</span>
                      <span className="font-bold text-emerald-600">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <GlowButton href="/login" variant="outline">
              Access Dashboard
            </GlowButton>
            <GlowButton href="/signup">Create Account</GlowButton>
          </div>
        </div>
      </Section>

      {/* Workflow */}
      <Section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">How it works</h2>
            <p className="mt-4 text-[#6B7280]">From field attendance to executive insights in five steps.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {WORKFLOW.map((w, i) => (
                <motion.div
                  key={w.step}
                  whileHover={{ y: -4 }}
                  className="relative rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm text-center"
                >
                  <span className="inline-flex w-10 h-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                    {w.step}
                  </span>
                  <h3 className="font-bold text-[#0F172A] mt-4 text-sm">{w.title}</h3>
                  <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{w.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <GlowButton href="/signup">Start Using ERP</GlowButton>
            <Link href="/login" className="text-sm font-semibold text-emerald-600 self-center hover:underline">
              Login to your account
            </Link>
          </div>
        </div>
      </Section>

      {/* Platform showcase */}
      <Section className="py-20 lg:py-28 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Product tour</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">See the platform in action</h2>
            <p className="mt-4 text-[#6B7280]">
              Explore admin, School View, and trainer workspaces — the same premium UI you get after signing in.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {SCREENSHOTS.map((s, i) => (
              <button
                key={s.variant}
                type="button"
                onClick={() => setSlide(i)}
                className={`rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                  i === slide
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-emerald-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSlide((s) => (s - 1 + SCREENSHOTS.length) % SCREENSHOTS.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-2 sm:-translate-x-4 w-10 h-10 rounded-full border border-[#E5E7EB] bg-white shadow-lg text-[#0F172A] hover:bg-[#F4F7F5] hidden sm:flex items-center justify-center text-xl"
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setSlide((s) => (s + 1) % SCREENSHOTS.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-2 sm:translate-x-4 w-10 h-10 rounded-full border border-[#E5E7EB] bg-white shadow-lg text-[#0F172A] hover:bg-[#F4F7F5] hidden sm:flex items-center justify-center text-xl"
              aria-label="Next slide"
            >
              ›
            </button>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-4 sm:p-6 shadow-xl shadow-emerald-500/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="text-center text-sm text-[#6B7280] mb-4">{SCREENSHOTS[slide].description}</p>
                  <PlatformShowcaseSlide variant={SCREENSHOTS[slide].variant} />
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-2 mt-5">
                {SCREENSHOTS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-emerald-500' : 'w-2 bg-[#E5E7EB]'}`}
                    aria-label={`Go to ${SCREENSHOTS[i].label}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <GlowButton href="/signup">Get Started</GlowButton>
            <GlowButton href="/login" variant="outline">
              Login
            </GlowButton>
          </div>
        </div>
      </Section>

      {/* Why */}
      <Section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">
                Built specifically for robotics training programs
              </h2>
              <ul className="mt-8 space-y-4">
                {WHY.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#374151]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">✓</span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <motion.div whileHover={{ y: -4 }} className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <h3 className="font-bold text-[#0F172A]">Create your account</h3>
                <p className="text-sm text-[#6B7280] mt-2 mb-6">Join schools and trainers already on Robochamps ERP.</p>
                <GlowButton href="/signup" className="w-full">
                  Sign Up Free
                </GlowButton>
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                className="rounded-3xl p-6 shadow-lg text-white"
                style={{ background: 'linear-gradient(135deg, #0B1F14 0%, #143A28 100%)' }}
              >
                <h3 className="font-bold">Welcome back</h3>
                <p className="text-sm text-emerald-100/80 mt-2 mb-6">Access your dashboard and continue where you left off.</p>
                <GlowButton href="/login" variant="outline" className="w-full !text-white !border-white/30 !bg-white/10">
                  Login to Dashboard
                </GlowButton>
              </motion.div>
            </div>
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #07130D 0%, #0B1F14 50%, #143A28 100%)' }} />
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/20 blur-[80px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Transform Your Robotics Training Operations
          </h2>
          <p className="mt-4 text-emerald-100/70 text-lg max-w-2xl mx-auto">
            An ERP system designed for robotics training programs, schools, trainers, School View accounts, and admins.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <GlowButton href="/signup" className="!shadow-emerald-500/40">
              Create Free Account
            </GlowButton>
            <GlowButton href="/login" variant="outline" className="!border-white/30 !text-white !bg-white/10 hover:!bg-white/20">
              Login to Dashboard
            </GlowButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="text-white" style={{ background: 'linear-gradient(180deg, #07130D 0%, #0B1F14 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <img src={LOGO} alt="Robochamps" className="h-10 object-contain mb-4 brightness-0 invert" />
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Robochamps ERP — Smart robotics training management with attendance, reports, analytics, and operational
                oversight.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Product</p>
              <ul className="space-y-2 text-sm text-gray-400">
                {['Features', 'Modules', 'Analytics', 'Roles'].map((l) => (
                  <li key={l}>
                    <button type="button" onClick={() => scrollTo(l.toLowerCase())} className="hover:text-white transition-colors">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <motion.div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Account</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-gray-400 hover:text-white">
                    Signup
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                    Get Started
                  </Link>
                </li>
              </ul>
            </motion.div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Contact</p>
              <p className="text-sm text-gray-400">
                <a href="mailto:pd@robowunder.com" className="hover:text-white transition-colors">
                  pd@robowunder.com
                </a>
              </p>
              <p className="text-sm text-gray-400 mt-2">Robotics training programs worldwide</p>
            </div>
          </motion.div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Robochamps ERP. All rights reserved.</p>
            <motion.div className="flex gap-4">
              <Link href="/login" className="hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="hover:text-white">
                Signup
              </Link>
            </motion.div>
          </div>
        </div>
      </footer>
      </motion.div>
    </>
  );
}
