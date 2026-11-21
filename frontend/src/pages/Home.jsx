import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, ArrowUpRight, BrainCircuit, CalendarDays, Camera, Code2, Cpu, Mail, MapPin, Menu, X, Sparkles, Users, ChevronLeft, ChevronRight, IndianRupee, LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRound, LogOut, Sun, Moon, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";

const faculty = [
  {
    name: "Dr. Namrata Tapaswi",
    role: "Head of Department",
    image: "/faculties/drnamratahod.png",
  },
  {
    name: "Prof. Jaya Dubey",
    role: "Club Coordinator",
    image: "/faculties/profjayadubey.png",
  },
];

const studentTeam = [
  {
    name: "Devansh Burman",
    role: "Chairperson",
    image: "/team/devansh.jpeg",
  },
  {
    name: "Soumya Soni",
    role: "Vice Chairperson",
    image: "/team/soumya.jpeg",
  },
  {
    name: "Kush Yadav",
    role: "Secretary",
    image: "/team/kush.jpeg",
  },
  {
    name: "Nandani Chandoriya",
    role: "Treasurer",
    image: "/team/nandani.jpeg",
  },

  {
    name: "Rishikesh Karkhanis",
    role: "Technical Head",
    image: "/team/hrishikesh.jpeg",
  },
  {
    name: "Siddh Agrawal",
    role: "Technical Coordinator",
    image: "/team/siddh.jpeg",
  },
  {
    name: "Yuvraj Singh Jadhav",
    role: "Social & PR Head",
    image: "/team/yuvraj.jpeg",
  },
  {
    name: "Sachin Verma",
    role: "Designing Head",
    image: "/team/sachin.png",
  },
  {
    name: "Riya Khandelwal",
    role: "Designing Coordinator",
    image: "/team/riyak.png",
  },
  {
    name: "Aditi Purohit",
    role: "Documentation Head",
    image: "/team/aditi.jpeg",
  },
  {
    name: "Varad Dubey",
    role: "Master of Ceremonies / Anchoring Coordinator",
    image: "/team/varad.png",
  },
  {
    name: "Riya Dixit",
    role: "Master of Ceremonies / Anchoring Coordinator",
    image: "/team/riyad.png",
  },
  {
    name: "Vani Chhatlore",
    role: "Master of Ceremonies / Anchoring Coordinator",
    image: "/team/vani.png",
  },
  {
    name: "Jay Soni",
    role: "Behind the Camera & Photography",
    image: "/team/jay.png",
  },
  {
    name: "Aman Sahu",
    role: "Behind the Camera & Photography",
    image: "/team/aman.jpeg",
  },
];

const activities = [
  {
    icon: BrainCircuit,
    title: "Artificial Intelligence",
    description: "Explore AI, machine learning and intelligent technologies through practical learning.",
  },
  {
    icon: Code2,
    title: "Development",
    description: "Turn ideas into working projects, collaborate with peers and sharpen your coding skills.",
  },
  {
    icon: Cpu,
    title: "Innovation",
    description: "Experiment with emerging technologies and build solutions to real-world problems.",
  },
];

const lifeAtNexusEvents = [
  {
    id: "portfolio-sprint-2026",
    eventName: "Portfolio Sprint 2026",
    description: "A collaborative event to build and showcase student portfolios.",
    images: [
      {
        src: "/events/portfolio-sprint-2026/1.jpeg",
        alt: "Participants at Portfolio Sprint",
      },
      {
        src: "/events/portfolio-sprint-2026/2.jpeg",
        alt: "Students collaborating during the event",
      },
      {
        src: "/events/portfolio-sprint-2026/3.jpeg",
        alt: "Participants showcasing their portfolios",
      },
      {
        src: "/events/portfolio-sprint-2026/4.jpeg",
        alt: "Event participants posing for a group photo",
      },
      {
        src: "/events/portfolio-sprint-2026/5.jpeg",
        alt: "Students enjoying the event",
      },
      {
        src: "/events/portfolio-sprint-2026/6.jpeg",
        alt: "Event attendees networking",
      },
      {
        src: "/events/portfolio-sprint-2026/7.jpeg",
        alt: "Students sharing their experiences",
      },
      {
        src: "/events/portfolio-sprint-2026/8.jpeg",
        alt: "Event organizers posing for a group photo",
      },
      {
        src: "/events/portfolio-sprint-2026/9.jpeg",
        alt: "Students posing for a group photo",
      },
      {
        src: "/events/portfolio-sprint-2026/10.jpeg",
        alt: "Event participants enjoying the session",
      },
    ],
  },
  {
    id: "intelli-ai-arena-2026",
    eventName: "Intelli AI Arena 2026",
    description: "A 6 hour hackathon where students built AI-powered solutions to real-world problems.",
    images: [
      {
        src: "/events/intelli-ai-arena-2026/1.jpeg",
        alt: "AI hackathon session",
      },
      {
        src: "/events/intelli-ai-arena-2026/2.jpeg",
        alt: "Students attending the hackathon",
      },
      {
        src: "/events/intelli-ai-arena-2026/3.jpeg",
        alt: "Participants showcasing their AI solutions",
      },
      {
        src: "/events/intelli-ai-arena-2026/4.jpeg",
        alt: "Event organizers posing for a group photo",
      },
      {
        src: "/events/intelli-ai-arena-2026/5.jpeg",
        alt: "Students sharing their experiences",
      },
    ],
  },
  {
    id: "code-and-compass-2024",
    eventName: "Code and Compass 2024",
    description: "A coding competition for students to showcase their programming skills.",
    images: [
      {
        src: "/events/code-and-compass-2024/1.jpeg",
        alt: "Participants at Code and Compass",
      },
      {
        src: "/events/code-and-compass-2024/2.jpeg",
        alt: "Students solving coding challenges",
      },
      {
        src: "/events/code-and-compass-2024/3.jpeg",
        alt: "Event participants posing for a group photo",
      },
      {
        src: "/events/code-and-compass-2024/4.jpeg",
        alt: "Students competing in the coding competition",
      },
    ],
  },
];

const galleryImages = ["index/logo.jpeg", "index/acropolis.jpeg", "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900", "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900"];

const navigation = [
  { label: "Home", href: "#home" },
  { label: "Events", href: "#events" },
  { label: "Team", href: "#team" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

function Navbar({ isLight, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#3B82D6]/30 bg-[#00001F]/95 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between gap-3 px-6 py-6 lg:px-12">
        <a href="#home" className="flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center text-3xl leading-none text-[#3B82D6]">
            <img src="/icons/favicon.ico" alt="AI Nexus Logo" className="h-8 w-8 object-cover" />
          </span>
          <span className="flex flex-col">
            <span className="text-xl tracking-[0.22em] text-[#E8E5DF]">AI NEXUS CLUB</span>
            <span className="mt-1 text-[5px] tracking-[0.28em] text-[#AEBBD0]">ACROPOLIS INSTITUTE OF TECHNOLOGY & RESEARCH, INDORE</span>
          </span>
        </a>

        <div className="hidden items-center gap-x-7 gap-y-3 text-sm text-[#AEBBD0] lg:flex">
          {navigation.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-[#E8E5DF]">
              {item.label}
            </a>
          ))}
        </div>

        <button type="button" onClick={onToggleTheme} aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"} title={isLight ? "Switch to dark theme" : "Switch to light theme"} className="hidden lg:inline-flex items-center justify-center rounded-full border border-[#3B82D6]/50 p-2.5 text-[#3B82D6] transition hover:bg-[#3B82D6]/10">
          {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="relative hidden lg:block">
          {!isAuthenticated ? (
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border border-[#3B82D6]/50 px-5 py-2 text-sm text-[#E8E5DF] transition hover:bg-[#080D24]">
              Login <ArrowUpRight size={16} />
            </Link>
          ) : (
            <>
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 rounded-full border border-[#3B82D6]/50 px-5 py-2 text-sm text-[#E8E5DF] transition hover:bg-[#080D24]">
                <UserRound size={17} className="text-[#3B82D6]" />
                <span>{user?.name?.split(" ")[0] || "Account"}</span>
                <span className={`text-[#AEBBD0] transition ${profileOpen ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-xl border border-[#3B82D6]/30 bg-[#080D24] p-2 shadow-xl">
                  <div className="border-b border-[#3B82D6]/20 px-3 py-3">
                    <p className="text-sm text-[#E8E5DF]">{user?.name}</p>
                    <p className="mt-1 truncate text-xs text-[#AEBBD0]">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#AEBBD0] transition hover:bg-white/5 hover:text-[#E8E5DF]">
                    <UserRound size={17} /> My Profile
                  </Link>
                  {user?.isAdmin === true && (
                    <Link to="/admin-login" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#3B82D6] transition hover:bg-white/5">
                      <ShieldCheck size={17} /> Admin Settings
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#D58C91] transition hover:bg-red-500/10">
                    <LogOut size={17} /> Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <button type="button" onClick={onToggleTheme} aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"} className="rounded-full border border-[#3B82D6]/50 p-2 text-[#3B82D6] transition hover:bg-[#3B82D6]/10">
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="text-[#E8E5DF]" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#3B82D6]/20 bg-[#00001F] px-6 py-5 lg:hidden">
          <div className="flex flex-col gap-5">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="text-sm text-[#AEBBD0] transition hover:text-[#E8E5DF]">
                {item.label}
              </a>
            ))}
            {!isAuthenticated ? (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="w-fit rounded-full border border-[#3B82D6]/50 px-5 py-2.5 text-sm text-[#E8E5DF]">
                Login / Register
              </Link>
            ) : (
              <>
                <div className="border-t border-[#3B82D6]/20 pt-4">
                  <p className="text-sm text-[#E8E5DF]">{user?.name}</p>
                  <p className="mt-1 text-xs text-[#AEBBD0]">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-sm text-[#AEBBD0] hover:text-[#E8E5DF]">
                  <UserRound size={17} /> My Profile
                </Link>
                {user?.isAdmin === true && (
                  <Link to="/admin-login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-sm text-[#3B82D6]">
                    <ShieldCheck size={17} /> Admin Settings
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-3 text-left text-sm text-[#D58C91]">
                  <LogOut size={17} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={`mb-12 max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82D6]">{eyebrow}</p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#E8E5DF] sm:text-4xl">{title}</h2>

      {description && <p className="mt-4 text-sm leading-7 text-[#AEBBD0] sm:text-base">{description}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 md:grid-cols-2 md:py-24 lg:px-12">
        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-4 text-xs tracking-[0.2em] text-[#3B82D6]">
            <span>✦ &nbsp; DEPARTMENT OF CSE (AI &amp; ML)</span>
            <span className="hidden h-px w-24 bg-[#3B82D6]/70 sm:block" />
          </div>

          <h1 className="max-w-xl text-6xl leading-[0.98] tracking-[-0.045em] text-[#E8E5DF] sm:text-7xl lg:text-8xl">
            Building
            <br />
            Beyond
            <br />
            <span className="text-[#6F91D8]">Boundaries.</span>
          </h1>
          <p className="mt-5 max-w-lg font-editorial text-3xl italic leading-tight text-[#AEBBD0] sm:text-4xl">A student-driven community at Acropolis Institute of Technology and Research.</p>
          <p className="mt-8 max-w-xl text-base leading-8 text-[#AEBBD0] sm:text-lg">We explore Artificial Intelligence, build technology and turn ambitious ideas into meaningful innovation.</p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#events" className="inline-flex items-center gap-4 bg-[#1E4F9A] px-7 py-4 text-sm text-[#E8E5DF] transition hover:bg-[#3B82D6]">
              Explore Events <ArrowRight size={17} />
            </a>
            <a href="#contact" className="inline-flex items-center border border-[#E8E5DF]/60 px-7 py-4 text-sm text-[#E8E5DF] transition hover:border-[#3B82D6] hover:text-[#3B82D6]">
              Contact Us
            </a>
          </div>
        </div>

        <div className="relative mx-auto h-[430px] w-full max-w-xl">
          <div className="blueprint absolute right-2 top-8 h-72 w-72 rounded-full border border-[#3B82D6]/60 opacity-80 sm:right-8 sm:h-80 sm:w-80">
            <div className="absolute inset-8 rounded-full border border-[#3B82D6]/50" />
            <div className="absolute inset-16 rounded-full border border-[#3B82D6]/40" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-[#3B82D6]/30" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-[#3B82D6]/30" />
          </div>

          <div className="photo-grain absolute left-2 top-3 z-10 flex h-52 w-[72%] -rotate-3 items-end overflow-hidden border-[7px] border-[#E8E5DF]/90 bg-[#080D24] shadow-2xl sm:left-4">
            <img src={galleryImages[0]} alt="AI Nexus community event" className="absolute inset-0 h-full w-full object-cover opacity-65 grayscale" />
            <div className="relative z-10 p-5">
              <p className="text-[10px] tracking-[0.25em] text-[#E8E5DF]/80">ACROPOLIS INSTITUTE</p>
              <p className="mt-1 text-2xl text-[#E8E5DF]">Ideas take shape here.</p>
            </div>
          </div>

          <div className="photo-grain absolute bottom-4 right-1 z-20 flex h-48 w-[70%] rotate-3 items-end overflow-hidden border-[7px] border-[#E8E5DF]/90 bg-[#080D24] shadow-2xl sm:right-0">
            <img src={galleryImages[1]} alt="Students collaborating on technology" className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale" />
            <div className="relative z-10 p-5">
              <p className="text-[10px] tracking-[0.25em] text-[#E8E5DF]/80">WORKSHOPS · BUILDS · PEOPLE</p>
              <p className="mt-1 text-2xl text-[#E8E5DF]">Built together.</p>
            </div>
          </div>

          <span className="absolute bottom-0 left-8 z-30 text-xs tracking-[0.25em] text-[#3B82D6]">FIG. 01 — THE COMMUNITY</span>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Who We Are" title="Where curiosity meets technology." />

          <div className="flex h-64 items-center justify-center rounded-2xl border border-[#3B82D6]/20 bg-[#080D24]">
            <BrainCircuit size={100} strokeWidth={1} className="text-[#3B82D6]/60" />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-base leading-8 text-[#AEBBD0]">AI Nexus is a student-driven technical community under the Department of Computer Science and Engineering (AI & ML) at Acropolis Institute of Technology and Research.</p>

          <p className="mt-5 text-base leading-8 text-[#AEBBD0]">We bring together students who are passionate about Artificial Intelligence, programming and emerging technologies. Through projects, workshops, technical sessions and collaborative events, we encourage learning by building.</p>

          <div className="mt-9 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#3B82D6]/20 bg-[#080D24] p-5">
              <BrainCircuit className="text-[#3B82D6]" size={25} />
              <h3 className="mt-4 font-semibold text-[#E8E5DF]">Our Vision</h3>
              <p className="mt-2 text-sm leading-6 text-[#8B929F]">Encourage curiosity and technological exploration.</p>
            </div>

            <div className="rounded-xl border border-[#3B82D6]/20 bg-[#080D24] p-5">
              <Users className="text-[#6F91D8]" size={25} />
              <h3 className="mt-4 font-semibold text-[#E8E5DF]">Our Community</h3>
              <p className="mt-2 text-sm leading-6 text-[#8B929F]">Learn, collaborate and grow together.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatWeDo() {
  return (
    <section className="border-y border-[#3B82D6]/20 bg-[#080D24] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow="Explore" title="Learn. Build. Innovate." description="We believe the best way to understand technology is to work with it. Explore the areas that drive our community." />

        <div className="grid gap-5 md:grid-cols-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <div key={activity.title} className="rounded-2xl border border-[#3B82D6]/20 bg-[#080D24] p-8 transition hover:border-[#3B82D6]/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#3B82D6]/10 text-[#3B82D6]">
                  <Icon size={28} strokeWidth={1.7} />
                </div>

                <p className="mt-8 text-xs font-semibold tracking-widest text-[#8B929F]">0{index + 1}</p>

                <h3 className="mt-3 text-xl font-semibold text-[#E8E5DF]">{activity.title}</h3>

                <p className="mt-4 text-sm leading-7 text-[#AEBBD0]">{activity.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function getThumbnailUrl(path) {
  if (!path) return null;

  // Direct external URL
  if (path.startsWith("http")) return path;

  // Local image inside the public directory
  if (path.startsWith("/")) return path;

  // Relative path inside Supabase Storage
  return `${SUPABASE_URL}/storage/v1/object/public/ainexus-assets/${path}`;
}

function formatEventDate(date) {
  if (!date) return "Date to be announced";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Events({ events, loading, error, onRegister }) {
  const scrollEvents = (direction) => {
    const container = document.getElementById("event-carousel");
    if (!container) return;

    container.scrollBy({
      left: direction * 340,
      behavior: "smooth",
    });
  };

  return (
    <section id="events" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="What's Happening" title="Events & Experiences." description="Discover workshops, hackathons and opportunities to learn, compete and collaborate." />

        {!loading && events.length > 0 && (
          <div className="mb-12 hidden gap-2 sm:flex">
            <button type="button" onClick={() => scrollEvents(-1)} aria-label="Previous events" className="border border-[#3B82D6]/40 p-3 text-[#AEBBD0] transition hover:bg-[#3B82D6]/10">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => scrollEvents(1)} aria-label="Next events" className="border border-[#3B82D6]/40 p-3 text-[#AEBBD0] transition hover:bg-[#3B82D6]/10">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#AEBBD0]">Loading upcoming events...</div>
      ) : error ? (
        <div className="border border-red-500/20 bg-[#080D24] px-6 py-12 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="border border-[#3B82D6]/20 bg-[#080D24] px-6 py-16 text-center">
          <CalendarDays size={38} className="mx-auto text-[#3B82D6]" />
          <h3 className="mt-6 text-xl font-semibold text-[#E8E5DF]">No upcoming events right now.</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#8B929F]">Stay connected with AI Nexus for upcoming workshops, competitions and community activities.</p>
        </div>
      ) : (
        <div id="event-carousel" className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5" style={{ scrollbarWidth: "thin" }}>
          {events.map((event) => {
            const thumbnail = getThumbnailUrl(event.thumbnailPath);
            const registrationOpen = event.registrationStatus === "OPEN";

            return (
              <article key={event.eventId} className="flex w-[280px] shrink-0 snap-start flex-col overflow-hidden border border-[#3B82D6]/20 bg-[#080D24] sm:w-[320px]">
                <div className="aspect-video overflow-hidden bg-[#18213A]">
                  {thumbnail ? (
                    <img src={thumbnail} alt={event.eventName} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CalendarDays size={48} className="text-[#3B82D6]/50" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#3B82D6]">{formatEventDate(event.eventDate)}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${registrationOpen ? "text-green-400" : "text-red-400"}`}>{event.registrationStatus || "STATUS UNAVAILABLE"}</span>
                  </div>

                  <h3 className="mt-4 line-clamp-2 min-h-[3.5rem] text-xl font-semibold text-[#E8E5DF]">{event.eventName}</h3>
                  <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#AEBBD0]">{event.description || "More details coming soon."}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-[#3B82D6]/20 pt-4">
                    <span className="flex items-center gap-1 text-sm text-[#AEBBD0]">
                      {event.registrationFee > 0 ? (
                        <>
                          <IndianRupee size={15} />
                          {event.registrationFee}
                        </>
                      ) : (
                        "Free"
                      )}
                    </span>
                    <span className="text-xs text-[#8B929F]">{event.collegeOnly ? "Acropolis Only" : "Open to All"}</span>
                  </div>

                  <button type="button" disabled={!registrationOpen} onClick={() => onRegister(event.eventId)} className="mt-6 w-full bg-[#1E4F9A] px-5 py-3.5 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
                    {registrationOpen ? "Register Now" : "Registration Closed"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ProfileCard({ member }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-[#3B82D6]/20 bg-[#080D24] transition hover:-translate-y-1 hover:border-[#3B82D6]/40">
      <div className="aspect-square overflow-hidden bg-[#18213A]">
        <img src={member.image} alt={member.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>

      <div className="p-4 text-center">
        <h3 className="text-sm font-semibold text-[#E8E5DF]">{member.name}</h3>
        <p className="mt-2 text-xs leading-5 text-[#3B82D6]">{member.role}</p>
      </div>
    </div>
  );
}

function Team() {
  return (
    <section id="team" className="border-y border-[#3B82D6]/20 bg-[#080D24] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow="The People Behind AI Nexus" title="Meet Our Team." description="A community is built by the people behind it. Meet the faculty and students who guide AI Nexus." centered />

        <div className="mb-20">
          <h3 className="mb-7 text-center text-xl font-semibold text-[#E8E5DF]">Faculty</h3>

          <div className="mx-auto grid max-w-xl grid-cols-2 gap-5">
            {faculty.map((member) => (
              <ProfileCard key={member.name} member={member} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-7 text-center text-xl font-semibold text-[#E8E5DF]">Our Team</h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {studentTeam.map((member) => (
              <ProfileCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const [activeEventId, setActiveEventId] = useState(lifeAtNexusEvents[0]?.id ?? null);

  const activeEvent = lifeAtNexusEvents.find((event) => event.id === activeEventId);

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <SectionHeading eyebrow="Moments & Memories" title="Life at AI Nexus." description="From competitions and hackathons to workshops and community gatherings — a look back at the moments we've built together." />

      {lifeAtNexusEvents.length > 0 && (
        <>
          {/* Horizontal event navigation */}
          <div className="mb-10 -mx-6 overflow-x-auto px-6 pb-3 lg:mx-0 lg:px-0">
            <div className="flex w-max gap-3">
              {lifeAtNexusEvents.map((event) => {
                const isActive = activeEventId === event.id;

                return (
                  <button key={event.id} type="button" onClick={() => setActiveEventId(event.id)} className={`whitespace-nowrap border px-5 py-3 text-sm transition ${isActive ? "border-[#3B82D6] bg-[#1E4F9A] text-[#E8E5DF]" : "border-[#3B82D6]/20 text-[#AEBBD0] hover:border-[#3B82D6]/60 hover:text-[#E8E5DF]"}`}>
                    {event.eventName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected event */}
          {activeEvent && (
            <div key={activeEvent.id}>
              <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#3B82D6]/20 pb-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">EVENT ARCHIVE</p>

                  <h3 className="mt-3 text-2xl font-semibold text-[#E8E5DF] sm:text-3xl">{activeEvent.eventName}</h3>

                  {activeEvent.description && <p className="mt-2 text-sm leading-6 text-[#AEBBD0]">{activeEvent.description}</p>}
                </div>

                <span className="text-xs text-[#8B929F]">{activeEvent.images.length} PHOTOGRAPHS</span>
              </div>

              {/* Preserve existing asymmetric image layout */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {activeEvent.images.map((image, imageIndex) => (
                  <div key={`${activeEvent.id}-${imageIndex}`} className={`group relative overflow-hidden border border-[#3B82D6]/20 bg-[#080D24] ${imageIndex === 0 ? "col-span-2 row-span-2" : ""}`}>
                    <img src={getThumbnailUrl(image.src)} alt={image.alt || activeEvent.eventName} loading="lazy" className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${imageIndex === 0 ? "min-h-64 md:min-h-[420px]" : "min-h-48"}`} />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#00001F]/30 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {lifeAtNexusEvents.length === 0 && <div className="py-16 text-center text-sm text-[#AEBBD0]">Event photographs will be added soon.</div>}
    </section>
  );
}

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="border-y border-[#3B82D6]/20 bg-[#080D24] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow="Get in Touch" title="Let's Start a Conversation." description="Have a question, an idea or want to collaborate with AI Nexus? Drop us a message." centered />

        <div className="mx-auto max-w-2xl rounded-2xl border border-[#3B82D6]/20 bg-[#080D24] p-6 sm:p-9">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#AEBBD0]">Your Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required className="w-full rounded-lg border border-[#3B82D6]/20 bg-[#080D24] px-4 py-3 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#AEBBD0]">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className="w-full rounded-lg border border-[#3B82D6]/20 bg-[#080D24] px-4 py-3 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#AEBBD0]">Your Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us what's on your mind..." rows={5} required className="w-full resize-none rounded-lg border border-[#3B82D6]/20 bg-[#080D24] px-4 py-3 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />
            </div>

            {status === "success" && <p className="text-sm text-green-400">Your message has been sent successfully!</p>}

            {status === "error" && <p className="text-sm text-red-400">Something went wrong. Please try again later.</p>}

            <button type="submit" disabled={status === "sending"} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E4F9A] px-6 py-3.5 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:opacity-60">
              {status === "sending" ? "Sending..." : "Send Message"}
              {status !== "sending" && <ArrowRight size={17} />}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#00001F]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <a href="#home" className="text-xl font-bold text-[#E8E5DF]">
              AI <span className="text-[#3B82D6]">NEXUS</span>
            </a>

            <p className="mt-4 text-sm leading-7 text-[#8B929F]">Building beyond boundaries through curiosity, collaboration and technology.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#E8E5DF]">Quick Links</h4>

            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3">
              {navigation.map((item) => (
                <a key={item.label} href={item.href} className="text-sm text-[#8B929F] transition hover:text-[#3B82D6]">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#3B82D6]/20 pt-6 text-xs text-[#8B929F] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} AI Nexus. All rights reserved.</p>
          <p>Acropolis Institute of Technology and Research</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [isLight, setIsLight] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError("");
        const data = await apiRequest("/api/events/upcoming");
        if (isMounted) setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Unable to fetch upcoming events:", error);
        if (isMounted) {
          setEventsError("Unable to load upcoming events. Please try again later.");
        }
      } finally {
        if (isMounted) setEventsLoading(false);
      }
    };

    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEventRegister = (eventId) => {
    if (!isAuthenticated) {
      setSelectedEventId(eventId);
      setLoginModalOpen(true);
      return;
    }

    navigate(`/events/${eventId}/register`);
  };

  return (
    <div className={`home-editorial starfield min-h-screen font-editorial ${isLight ? "light-theme" : "bg-[#00001F] text-[#E8E5DF]"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
        .font-editorial {
          font-family: "Playfair Display", "Iowan Old Style", Baskerville, Georgia, serif;
        }
        .starfield {
          background-image:
            radial-gradient(1px 1px at 8% 18%, rgba(232,229,223,.75) 50%, transparent 100%),
            radial-gradient(1px 1px at 24% 72%, rgba(174,187,208,.6) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 48% 28%, rgba(232,229,223,.65) 50%, transparent 100%),
            radial-gradient(1px 1px at 71% 82%, rgba(111,145,216,.8) 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 34%, rgba(232,229,223,.7) 50%, transparent 100%),
            radial-gradient(1px 1px at 94% 68%, rgba(174,187,208,.55) 50%, transparent 100%);
          background-size: 420px 360px;
        }
        .blueprint {
          background-image:
            linear-gradient(rgba(59,130,214,.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,214,.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .photo-grain {
          background-image: linear-gradient(135deg, rgba(8,13,36,.05), rgba(0,0,31,.55)),
            repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px);
        }

        /* Light theme: presentation-only overrides; application logic is unchanged. */
        .light-theme {
          background-color: #F4F3EF;
          color: #00001F;
          transition: background-color .25s ease, color .25s ease;
        }
        .light-theme [class*="bg-[#00001F]"],
        .light-theme [class*="bg-[#080D24]"] {
          background-color: #FFFFFF !important;
        }
        .light-theme header,
        .light-theme [class*="bg-[#080D24]"] {
          background-color: #FFFFFF !important;
        }
        .light-theme [class*="text-[#E8E5DF]"] { color: #00001F !important; }
        .light-theme [class*="text-[#AEBBD0]"] { color: #46536A !important; }
        .light-theme [class*="text-[#8B929F]"] { color: #697386 !important; }
        .light-theme [class*="border-[#E8E5DF]"] { border-color: rgba(0,0,31,.25) !important; }
        .light-theme [class*="border-[#3B82D6]"] { border-color: rgba(30,79,154,.25) !important; }
        .light-theme [class*="bg-[#18213A]"] { background-color: #E8EAF0 !important; }
        .light-theme input,
        .light-theme textarea {
          background-color: #FFFFFF !important;
          color: #00001F !important;
        }
        .light-theme input::placeholder,
        .light-theme textarea::placeholder { color: #8B929F !important; }
        .light-theme.starfield {
          background-image:
            radial-gradient(1px 1px at 8% 18%, rgba(30,79,154,.30) 50%, transparent 100%),
            radial-gradient(1px 1px at 24% 72%, rgba(59,130,214,.25) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 48% 28%, rgba(30,79,154,.25) 50%, transparent 100%);
        }
        .light-theme .blueprint {
          background-image:
            linear-gradient(rgba(30,79,154,.10) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,79,154,.10) 1px, transparent 1px);
        }
        /* Preserve readable ivory text over the dark photo overlays and blue buttons. */
        .light-theme .photo-grain [class*="text-[#E8E5DF]"] { color: #E8E5DF !important; }
        .light-theme a[class*="bg-[#1E4F9A]"],
        .light-theme button[class*="bg-[#1E4F9A]"] { color: #E8E5DF !important; }
        /* AI Nexus editorial system — visual-only refinements */
        .home-editorial {
          --nexus-ink: #00001F;
          --nexus-panel: #080D24;
          --nexus-paper: #E8E5DF;
          --nexus-muted: #AEBBD0;
          --nexus-blue: #3B82D6;
          --nexus-line: rgba(111,145,216,.28);
          isolation: isolate;
        }
        .home-editorial header {
          background: rgba(0,0,31,.88) !important;
          border-color: var(--nexus-line) !important;
          box-shadow: 0 12px 40px rgba(0,0,20,.12);
        }
        .home-editorial header nav { padding-top: 1.15rem; padding-bottom: 1.15rem; }
        .home-editorial h1,
        .home-editorial h2,
        .home-editorial h3 {
          font-family: "Playfair Display", "Iowan Old Style", Baskerville, Georgia, serif;
          font-weight: 500 !important;
        }
        .home-editorial h2 {
          font-size: clamp(2.1rem, 4vw, 3.35rem) !important;
          line-height: 1.04 !important;
          letter-spacing: -.045em !important;
        }
        .home-editorial section { scroll-margin-top: 100px; }
        .home-editorial section:not(#home) { position: relative; }
        .home-editorial section:not(#home) > div { position: relative; }
        .home-editorial section.py-24 { padding-top: clamp(4.5rem, 8vw, 7.5rem) !important; padding-bottom: clamp(4.5rem, 8vw, 7.5rem) !important; }
        .home-editorial .rounded-2xl,
        .home-editorial .rounded-xl,
        .home-editorial .rounded-lg { border-radius: 2px !important; }
        .home-editorial .rounded-full { border-radius: 9999px !important; }
        .home-editorial [class*="border-[#3B82D6]"] { border-color: var(--nexus-line); }
        .home-editorial .bg-\[\#080D24\] { background-color: rgba(8,13,36,.72); }
        .home-editorial #about .grid > div:first-child > div:last-child {
          min-height: 19rem;
          background-image: radial-gradient(circle at 50% 50%, rgba(59,130,214,.13), transparent 58%), linear-gradient(rgba(59,130,214,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,214,.08) 1px, transparent 1px) !important;
          background-size: auto, 30px 30px, 30px 30px;
        }
        .home-editorial #about .grid > div:first-child > div:last-child svg { width: 7rem; height: 7rem; }
        .home-editorial #events > div > div:last-child {
          border-style: solid !important;
          border-color: var(--nexus-line) !important;
          background-image: linear-gradient(135deg, rgba(59,130,214,.08), transparent 55%) !important;
        }
        .home-editorial #team .group,
        .home-editorial #gallery > div > div {
          border-radius: 2px !important;
          border-color: var(--nexus-line) !important;
          background: rgba(8,13,36,.62) !important;
        }
        .home-editorial #team .group img,
        .home-editorial #gallery img { filter: saturate(.78); }
        .home-editorial #team .group:hover img,
        .home-editorial #gallery img:hover { filter: saturate(1); }
        .home-editorial #contact > div > div:last-child {
          border-radius: 2px !important;
          background: linear-gradient(145deg, rgba(12,20,48,.96), rgba(5,9,31,.94)) !important;
          box-shadow: 0 28px 80px rgba(0,0,0,.22);
        }
        .home-editorial input,
        .home-editorial textarea {
          border-radius: 0 !important;
          border-top: 0 !important;
          border-left: 0 !important;
          border-right: 0 !important;
          background: transparent !important;
          padding-left: .15rem !important;
        }
        .home-editorial footer { border-top: 1px solid var(--nexus-line); }
        .home-editorial a,
        .home-editorial button { transition-duration: .25s; }
        .home-editorial a:focus-visible,
        .home-editorial button:focus-visible,
        .home-editorial input:focus-visible,
        .home-editorial textarea:focus-visible {
          outline: 2px solid #6F91D8;
          outline-offset: 4px;
        }
        .home-editorial.light-theme header {
          background: rgba(244,243,239,.92) !important;
          box-shadow: 0 12px 40px rgba(20,35,60,.06);
        }
        .home-editorial.light-theme #contact > div > div:last-child {
          background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(239,241,246,.98)) !important;
          box-shadow: 0 28px 80px rgba(20,35,60,.08);
        }
        .home-editorial.light-theme #team .group,
        .home-editorial.light-theme #gallery > div > div,
        .home-editorial.light-theme #events > div > div:last-child,
        .home-editorial.light-theme #about .grid > div:first-child > div:last-child {
          background-color: rgba(255,255,255,.78) !important;
        }
        .home-editorial.light-theme input,
        .home-editorial.light-theme textarea {
          background: rgba(255,255,255,.72) !important;
          border-bottom-color: rgba(70,83,106,.35) !important;
        }
        .home-editorial.light-theme .photo-grain {
          border-color: rgba(0,0,31,.82) !important;
        }
        @media (max-width: 640px) {
          .home-editorial #home h1 { font-size: clamp(3.4rem, 15vw, 5rem); }
          .home-editorial #home .relative.mx-auto.h-\[430px\] { height: 360px; }
          .home-editorial #home .blueprint { width: 17rem; height: 17rem; }
          .home-editorial #home .photo-grain { border-width: 5px; }
        }
      `}</style>
      <Navbar isLight={isLight} onToggleTheme={() => setIsLight((current) => !current)} />

      <main>
        <Hero />
        <About />
        <WhatWeDo />
        <Events events={events} loading={eventsLoading} error={eventsError} onRegister={handleEventRegister} />
        <Team />
        <Gallery />
        <Contact />
      </main>

      <Footer />

      {loginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm" onClick={() => setLoginModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onClick={(event) => event.stopPropagation()} className="relative w-full max-w-md border border-[#3B82D6]/30 bg-[#080D24] p-8 text-center shadow-2xl">
            <button type="button" onClick={() => setLoginModalOpen(false)} aria-label="Close login dialog" className="absolute right-4 top-4 text-[#AEBBD0] hover:text-white">
              <X size={20} />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3B82D6]/10">
              <LockKeyhole size={28} className="text-[#3B82D6]" />
            </div>

            <h2 id="login-modal-title" className="mt-6 text-2xl font-semibold text-[#E8E5DF]">
              Login Required
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#AEBBD0]">Please log in to your AI Nexus account before registering for this event.</p>

            <button type="button" onClick={() => navigate(`/auth?redirect=${encodeURIComponent(`/events/${selectedEventId}/register`)}`)} className="mt-7 w-full bg-[#1E4F9A] px-6 py-4 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6]">
              Log In to Continue <ArrowUpRight className="ml-2 inline" size={17} />
            </button>

            <button type="button" onClick={() => setLoginModalOpen(false)} className="mt-4 text-sm text-[#8B929F] transition hover:text-[#E8E5DF]">
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
