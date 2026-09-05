import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jeshun Giati | AI, Software & Product Builder",
  description:
    "Builder portfolio showcasing AI systems, software products, digital platforms, automation, geospatial technology, and technical operations projects.",
  alternates: { canonical: "/giati" },
  openGraph: {
    title: "Jeshun Giati | AI, Software & Product Builder",
    description:
      "Selected work across AI, software engineering, automation, digital products, geospatial systems, and technical operations.",
    type: "website"
  }
};

const liveProjects = [
  {
    name: "NU-BI / NOMI",
    category: "AI + Social Platform",
    description:
      "A modern social platform with messaging, creator tools, media workflows, AI-assisted features, profile systems, and cloud-ready application infrastructure.",
    href: "https://nu-bi.com",
    tags: ["Next.js", "AI", "Product", "Cloud"]
  },
  {
    name: "FTH3WORLD",
    category: "Commerce + Digital Systems",
    description:
      "A multi-division technology and commerce brand spanning e-commerce, AI-enabled services, media, marketing, digital operations, automation, and product experiences.",
    href: "https://fth3world.com",
    tags: ["E-commerce", "Automation", "Media", "AI"]
  },
  {
    name: "Aerial Apex Geodata",
    category: "Drone + Geospatial Technology",
    description:
      "Aerial and mobile geospatial data workflows designed for infrastructure, construction, utilities, asset documentation, corridor capture, and GIS-friendly delivery.",
    href: "https://aerialapexgeodata.com",
    tags: ["UAS", "GIS", "Field Ops", "Data"]
  },
  {
    name: "NU-BI AI",
    category: "AI Product Layer",
    description:
      "AI-focused product development and experimentation around assistants, generation workflows, intelligent interfaces, and user-facing AI experiences.",
    href: "https://ai.nu-bi.com",
    tags: ["LLMs", "AI UX", "Agents", "Automation"]
  }
];

const buildLab = [
  {
    name: "Echo",
    category: "Autonomous AI Systems",
    description:
      "Agent-oriented AI experimentation focused on useful autonomy, tool use, local intelligence, orchestration, and practical assistant workflows."
  },
  {
    name: "LocalMind",
    category: "Local AI / Edge Computing",
    description:
      "Local-first AI application work exploring GGUF inference, offline language models, voice interaction, image understanding, document creation, and mobile deployment."
  },
  {
    name: "Perfect AI",
    category: "On-device AI",
    description:
      "Experiments in private, locally running AI experiences designed for phones and computers with emphasis on offline inference and multimodal interaction."
  },
  {
    name: "GIATI Learning Academy",
    category: "AI + Education",
    description:
      "Educational software concepts that use AI to adapt lessons, topics, and learning experiences to different students and skill levels."
  },
  {
    name: "TheTechova",
    category: "Technology Studio",
    description:
      "A technology-building initiative focused on software concepts, digital products, experimentation, and turning practical ideas into working systems."
  },
  {
    name: "Tactical Protective Agency Systems",
    category: "Operational Technology",
    description:
      "Digital workflow, monitoring, reporting, documentation, and operational-system work developed around real-world security and field operations."
  }
];

const disciplines = [
  ["AI Engineering", "Local models, LLM integration, autonomous agents, AI product workflows, voice and multimodal concepts."],
  ["Software & Product", "Web applications, mobile concepts, databases, APIs, admin systems, e-commerce, and user-facing digital products."],
  ["Cloud & Automation", "Deployments, cloud services, databases, DNS, workflow automation, integrations, and production troubleshooting."],
  ["Geospatial & Field Tech", "Drone systems, mobile capture, GIS-oriented workflows, field documentation, and repeatable data operations."],
  ["Creative Technology", "Digital campaigns, product presentation, AI-assisted creative work, brand experiences, and content systems."],
  ["Technical Operations", "Monitoring, incident workflows, real-time systems, logistics technology, documentation, and process improvement."]
];

export default function GiatiPortfolioPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(239,68,68,0.14),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.06),transparent_22%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-white/10 py-5">
          <Link className="text-sm font-semibold uppercase tracking-[0.24em]" href="/">
            NU-BI
          </Link>
          <div className="flex items-center gap-3">
            <a className="hidden text-xs font-medium uppercase tracking-[0.18em] text-white/50 hover:text-white sm:block" href="#work">
              Selected Work
            </a>
            <a className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-red-400/50 hover:text-white" href="#connect">
              Connect
            </a>
          </div>
        </nav>

        <section className="grid min-h-[76vh] items-center gap-12 border-b border-white/10 py-14 lg:grid-cols-[1.18fr_0.82fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300">
              Builder Portfolio · AI · Software · Digital Systems
            </div>
            <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-white/40">Jeshun Giati</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
              I build ideas into <span className="text-red-400">working systems.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Independent app developer and technology builder working across artificial intelligence, software products, automation, cloud systems, geospatial technology, digital commerce, and real-world operational tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["AI Systems", "Applications", "Automation", "Cloud", "Geospatial", "Digital Products"].map((item) => (
                <span className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-xs text-white/68" key={item}>{item}</span>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black" href="#work">Explore the work</a>
              <a className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white" href="https://github.com/giati1" rel="noreferrer" target="_blank">GitHub</a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-10 rounded-full bg-red-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.025] p-2 shadow-2xl shadow-red-950/20">
              <Image
                alt="Jeshun Giati"
                className="aspect-[4/5] w-full rounded-[30px] object-cover"
                height={1200}
                priority
                src="/portfolio/jeshun-giati.jpg"
                width={960}
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 backdrop-blur-xl">
                <p className="text-sm font-semibold">Engineering ideas across software + AI</p>
                <p className="mt-1 text-xs text-white/50">Independent builder · Product thinker · Systems operator</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">What I do</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From concept to deployed product.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {disciplines.map(([title, body]) => (
                <article className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5" key={title}>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16" id="work">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">Live products & ventures</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {liveProjects.map((project) => (
              <a className="group rounded-[30px] border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-red-400/35 hover:bg-white/[0.04]" href={project.href} key={project.name} rel="noreferrer" target="_blank">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400/85">{project.category}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight">{project.name}</h3>
                  </div>
                  <span className="text-xl text-white/30 transition group-hover:text-red-400">↗</span>
                </div>
                <p className="mt-5 leading-7 text-white/58">{project.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/52" key={tag}>{tag}</span>)}
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">Build lab</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Systems, experiments & products in development.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/45">Some projects are public, some are private development environments, and some are ongoing product experiments.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {buildLab.map((project) => (
              <article className="rounded-[26px] border border-white/10 bg-gradient-to-b from-white/[0.035] to-transparent p-5" key={project.name}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400/80">{project.category}</p>
                <h3 className="mt-3 text-xl font-semibold">{project.name}</h3>
                <p className="mt-4 text-sm leading-7 text-white/54">{project.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-16 lg:grid-cols-3">
          <article className="rounded-[30px] border border-white/10 bg-white/[0.025] p-7 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">How I work</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">Build fast. Test constantly. Improve what matters.</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">
              My work is hands-on and product-driven: define the real problem, prototype the smallest useful version, connect the systems, test it in realistic conditions, document what changed, then iterate toward something people can actually use.
            </p>
          </article>
          <article className="rounded-[30px] border border-red-400/20 bg-gradient-to-br from-red-500/12 to-transparent p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">Current focus</p>
            <p className="mt-4 text-lg leading-8 text-white/76">AI infrastructure, autonomous systems, robotics, technical operations, local AI, cloud products, and next-generation mobility technology.</p>
          </article>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.12),transparent_30%),rgba(255,255,255,0.025)] p-7 sm:p-9" id="connect">
          <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">Professional connection</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Want to discuss a project, product, or technical opportunity?</h2>
              <p className="mt-4 max-w-3xl leading-7 text-white/55">Use the public platforms below to connect. Personal contact details are intentionally kept private.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black" href="https://github.com/giati1" rel="noreferrer" target="_blank">GitHub profile</a>
              <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold" href="/signup">Connect on NU-BI</Link>
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/32">
          <p>Jeshun Giati · Builder Portfolio</p>
          <p>AI · Software · Product · Systems</p>
        </footer>
      </div>
    </main>
  );
}
