import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, BrainCircuit, CalendarDays, Camera, Code2, Cpu, Mail, MapPin, Menu, X, Sparkles, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRound, LogOut } from "lucide-react";

const faculty = [
  {
    name: "Dr. Namrata Tapaswi",
    role: "Head of Department",
    image: "https://i.pravatar.cc/400?img=47",
  },
  {
    name: "Prof. Jaya Dubey",
    role: "Club Coordinator",
    image: "https://i.pravatar.cc/400?img=44",
  },
];

const studentTeam = [
  {
    name: "Devansh Burman",
    role: "Chairperson",
    image: "https://i.pravatar.cc/400?img=12",
  },
  {
    name: "Soumya Soni",
    role: "Vice Chairperson",
    image: "https://i.pravatar.cc/400?img=45",
  },
  {
    name: "Kush Yadav",
    role: "Secretary",
    image: "https://i.pravatar.cc/400?img=13",
  },
  {
    name: "Nandani Chandoriya",
    role: "Treasurer",
    image: "https://i.pravatar.cc/400?img=48",
  },

  {
    name: "Rishikesh Karkhanis",
    role: "Technical Head",
    image: "https://i.pravatar.cc/400?img=11",
  },
  {
    name: "Siddh Agrawal",
    role: "Technical Coordinator",
    image: "https://i.pravatar.cc/400?img=14",
  },
  {
    name: "Yuvraj Singh Jadhav",
    role: "Social & PR Head",
    image: "https://i.pravatar.cc/400?img=15",
  },
  {
    name: "Sachin Verma",
    role: "Designing Head",
    image: "https://i.pravatar.cc/400?img=16",
  },
  {
    name: "Riya Khandelwal",
    role: "Designing Coordinator",
    image: "https://i.pravatar.cc/400?img=49",
  },
  {
    name: "Aditi Purohit",
    role: "Documentation Head",
    image: "https://i.pravatar.cc/400?img=50",
  },
  {
    name: "Varad Dubey",
    role: "Master of Ceremonies / Anchoring Coordinator",
    image: "https://i.pravatar.cc/400?img=17",
  },
  {
    name: "Riya Dixit",
    role: "Master of Ceremonies / Anchoring Coordinator",
    image: "https://i.pravatar.cc/400?img=51",
  },
  {
    name: "Vani Chhatlore",
    role: "Master of Ceremonies / Anchoring Coordinator",
    image: "https://i.pravatar.cc/400?img=52",
  },
  {
    name: "Jay Soni",
    role: "Behind the Camera & Photography",
    image: "https://i.pravatar.cc/400?img=18",
  },
  {
    name: "Aman Sahu",
    role: "Behind the Camera & Photography",
    image: "https://i.pravatar.cc/400?img=19",
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

const galleryImages = ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900", "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900", "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900", "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900"];

const navigation = [
  { label: "Home", href: "#home" },
  { label: "Events", href: "#events" },
  { label: "Team", href: "#team" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080B16]/95 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Brand */}
        <a href="#home" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
            <BrainCircuit className="text-blue-400" size={27} />
          </div>

          <div>
            <p className="text-lg font-bold tracking-wide text-white">
              AI <span className="text-blue-400">NEXUS</span>
            </p>
            <p className="text-[9px] tracking-[0.18em] text-slate-500">ACROPOLIS INSTITUTE</p>
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <a key={item.label} href={item.href} className="text-sm text-slate-400 transition hover:text-blue-400">
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop Authentication */}
        <div className="relative hidden lg:block">
          {!isAuthenticated ? (
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
              Login <ArrowUpRight size={16} />
            </Link>
          ) : (
            <>
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#11182B] px-4 py-2.5 transition hover:border-blue-400/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                  <UserRound size={18} />
                </div>

                <span className="text-sm font-semibold text-white">{user?.name?.split(" ")[0] || "Account"}</span>

                <ArrowRight size={14} className={`text-slate-400 transition ${profileOpen ? "rotate-90" : ""}`} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#11182B] p-2 shadow-xl">
                  <div className="border-b border-white/10 px-3 py-3">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{user?.email}</p>
                  </div>

                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <UserRound size={17} />
                    My Profile
                  </Link>

                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10">
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="text-white lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#080B16] px-6 py-5 lg:hidden">
          <div className="flex flex-col gap-5">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="text-sm text-slate-300 hover:text-blue-400">
                {item.label}
              </a>
            ))}

            {!isAuthenticated ? (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white">
                Login / Register
              </Link>
            ) : (
              <>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
                </div>

                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-sm text-slate-300 hover:text-blue-400">
                  <UserRound size={17} />
                  My Profile
                </Link>

                <button onClick={handleLogout} className="flex items-center gap-3 text-left text-sm text-red-400">
                  <LogOut size={17} />
                  Logout
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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">{eyebrow}</p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>

      {description && <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">{description}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute -right-40 -top-32 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-violet-700/10 blur-[130px]" />

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-4 py-2">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-xs font-medium tracking-wide text-blue-300">DEPARTMENT OF CSE (AI & ML)</span>
          </div>

          <h1 className="max-w-2xl text-5xl font-bold leading-[1.12] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Building
            <br />
            Beyond
            <br />
            <span className="text-blue-400">Boundaries.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">A student-driven community at Acropolis Institute of Technology and Research. We explore Artificial Intelligence, build technology and turn ambitious ideas into meaningful innovation.</p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#events" className="inline-flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500">
              Explore Events <ArrowRight size={17} />
            </a>

            <a href="#contact" className="inline-flex items-center gap-3 rounded-lg border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-blue-400/50 hover:bg-white/5">
              Contact Us
            </a>
          </div>
        </div>

        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative flex h-[420px] w-[420px] items-center justify-center rounded-full border border-blue-400/20">
            <div className="absolute h-[330px] w-[330px] rounded-full border border-violet-400/20" />
            <div className="absolute h-[235px] w-[235px] rounded-full border border-blue-400/20" />

            <div className="relative flex h-36 w-36 items-center justify-center rounded-3xl border border-blue-400/30 bg-[#111A31]">
              <BrainCircuit size={78} strokeWidth={1.2} className="text-blue-400" />
            </div>

            <div className="absolute left-12 top-16 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#111A31] text-blue-400">
              <Code2 size={23} />
            </div>

            <div className="absolute bottom-16 right-10 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#111A31] text-violet-400">
              <Cpu size={23} />
            </div>

            <div className="absolute right-12 top-12 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#111A31] text-cyan-400">
              <Sparkles size={23} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Highlights() {
  const highlights = [
    { value: "AI", label: "Artificial Intelligence", color: "border-blue-500" },
    { value: "ML", label: "Machine Learning", color: "border-violet-500" },
    { value: "DEV", label: "Development", color: "border-cyan-500" },
    { value: "INNOVATE", label: "Ideas into Impact", color: "border-indigo-500" },
  ];

  return (
    <section className="border-y border-white/10 bg-[#0D1222] py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 md:grid-cols-4 lg:px-8">
        {highlights.map((item) => (
          <div key={item.value} className={`rounded-xl border border-white/10 border-t-2 ${item.color} bg-[#11182B] px-5 py-6`}>
            <h3 className="text-3xl font-bold text-white">{item.value}</h3>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</p>
          </div>
        ))}
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

          <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#11182B]">
            <BrainCircuit size={100} strokeWidth={1} className="text-blue-400/60" />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-base leading-8 text-slate-400">AI Nexus is a student-driven technical community under the Department of Computer Science and Engineering (AI & ML) at Acropolis Institute of Technology and Research.</p>

          <p className="mt-5 text-base leading-8 text-slate-400">We bring together students who are passionate about Artificial Intelligence, programming and emerging technologies. Through projects, workshops, technical sessions and collaborative events, we encourage learning by building.</p>

          <div className="mt-9 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#0D1222] p-5">
              <BrainCircuit className="text-blue-400" size={25} />
              <h3 className="mt-4 font-semibold text-white">Our Vision</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Encourage curiosity and technological exploration.</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1222] p-5">
              <Users className="text-violet-400" size={25} />
              <h3 className="mt-4 font-semibold text-white">Our Community</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Learn, collaborate and grow together.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatWeDo() {
  return (
    <section className="border-y border-white/10 bg-[#0D1222] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow="Explore" title="Learn. Build. Innovate." description="We believe the best way to understand technology is to work with it. Explore the areas that drive our community." />

        <div className="grid gap-5 md:grid-cols-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <div key={activity.title} className="rounded-2xl border border-white/10 bg-[#11182B] p-8 transition hover:border-blue-400/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Icon size={28} strokeWidth={1.7} />
                </div>

                <p className="mt-8 text-xs font-semibold tracking-widest text-slate-600">0{index + 1}</p>

                <h3 className="mt-3 text-xl font-semibold text-white">{activity.title}</h3>

                <p className="mt-4 text-sm leading-7 text-slate-400">{activity.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Events() {
  return (
    <section id="events" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="What's Happening" title="Events & Experiences." description="Discover workshops, hackathons and opportunities to learn, compete and collaborate." />

        <Link to="/events" className="mb-12 inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300">
          View all events <ArrowUpRight size={17} />
        </Link>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-[#0D1222] px-6 py-16 text-center">
        <CalendarDays size={38} className="mx-auto text-blue-400" />

        <h3 className="mt-6 text-xl font-semibold text-white">Upcoming events will appear here.</h3>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">Stay connected with AI Nexus for upcoming events, workshops, competitions and community activities.</p>
      </div>
    </section>
  );
}

function ProfileCard({ member }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-white/10 bg-[#11182B] transition hover:-translate-y-1 hover:border-blue-400/40">
      <div className="aspect-square overflow-hidden bg-[#18213A]">
        <img src={member.image} alt={member.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>

      <div className="p-4 text-center">
        <h3 className="text-sm font-semibold text-white">{member.name}</h3>
        <p className="mt-2 text-xs leading-5 text-blue-400">{member.role}</p>
      </div>
    </div>
  );
}

function Team() {
  return (
    <section id="team" className="border-y border-white/10 bg-[#0D1222] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow="The People Behind AI Nexus" title="Meet Our Team." description="A community is built by the people behind it. Meet the faculty and students who guide AI Nexus." centered />

        <div className="mb-20">
          <h3 className="mb-7 text-center text-xl font-semibold text-white">Faculty</h3>

          <div className="mx-auto grid max-w-xl grid-cols-2 gap-5">
            {faculty.map((member) => (
              <ProfileCard key={member.name} member={member} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-7 text-center text-xl font-semibold text-white">Our Team</h3>

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
  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <SectionHeading eyebrow="Moments & Memories" title="Life at AI Nexus." description="A glimpse into our community, events and experiences. These are temporary gallery images and will be replaced with actual AI Nexus photographs." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {galleryImages.map((image, index) => (
          <div key={image} className={`overflow-hidden rounded-xl border border-white/10 bg-[#11182B] ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
            <img src={image} alt="AI Nexus gallery placeholder" loading="lazy" className={`h-full w-full object-cover transition duration-500 hover:scale-105 ${index === 0 ? "min-h-64 md:min-h-[420px]" : "min-h-48"}`} />
          </div>
        ))}
      </div>
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Unable to send your message.");
      }

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="border-y border-white/10 bg-[#0D1222] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow="Get in Touch" title="Let's Start a Conversation." description="Have a question, an idea or want to collaborate with AI Nexus? Drop us a message." centered />

        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#11182B] p-6 sm:p-9">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Your Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required className="w-full rounded-lg border border-white/10 bg-[#0D1222] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className="w-full rounded-lg border border-white/10 bg-[#0D1222] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Your Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us what's on your mind..." rows={5} required className="w-full resize-none rounded-lg border border-white/10 bg-[#0D1222] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500" />
            </div>

            {status === "success" && <p className="text-sm text-green-400">Your message has been sent successfully!</p>}

            {status === "error" && <p className="text-sm text-red-400">Something went wrong. Please try again later.</p>}

            <button type="submit" disabled={status === "sending"} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
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
    <footer className="bg-[#070A13]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <a href="#home" className="text-xl font-bold text-white">
              AI <span className="text-blue-400">NEXUS</span>
            </a>

            <p className="mt-4 text-sm leading-7 text-slate-500">Building beyond boundaries through curiosity, collaboration and technology.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Quick Links</h4>

            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3">
              {navigation.map((item) => (
                <a key={item.label} href={item.href} className="text-sm text-slate-500 transition hover:text-blue-400">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-600 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} AI Nexus. All rights reserved.</p>
          <p>Acropolis Institute of Technology and Research</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080B16] font-sans text-white">
      <Navbar />

      <main>
        <Hero />
        <Highlights />
        <About />
        <WhatWeDo />
        <Events />
        <Team />
        <Gallery />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
