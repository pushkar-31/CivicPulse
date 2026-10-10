import { useEffect, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialStats = [
  {
    label: "Total reports",
    value: "—",
    icon: AlertTriangle,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "In progress",
    value: "—",
    icon: Clock3,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Resolved issues",
    value: "—",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function App() {
  const [apiStatus, setApiStatus] = useState("Checking connection...");
  const [stats] = useState(initialStats);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/health`)
      .then((response) => {
        setApiStatus(
          response.data.success
            ? "Backend connected"
            : "Backend unavailable"
        );
      })
      .catch(() => {
        setApiStatus("Backend unavailable");
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShieldCheck size={23} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                CivicPulse
              </h1>
              <p className="text-xs text-slate-500">
                Better communities, together.
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === "Backend connected"
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />
            {apiStatus}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-emerald-200">
              <MapPin size={15} />
              Your community, your voice
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Small reports.
              <br />
              Meaningful change.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Report potholes, overflowing bins, broken streetlights, and
              other civic issues. Help your community track problems from
              reporting to resolution.
            </p>

            <button
              type="button"
              disabled
              title="Issue reporting will be enabled in the next module"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 opacity-90"
            >
              Report an issue
              <ArrowUpRight size={18} />
            </button>
          </div>

          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -bottom-36 right-20 h-72 w-72 rounded-full border border-emerald-400/20 sm:h-96 sm:w-96" />
        </section>

        <section className="mt-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Community overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your civic issue dashboard will appear here.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </span>
                    <span className={`rounded-xl p-2 ${stat.color}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Populated when issue APIs are implemented
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          CivicPulse · Building cleaner, safer communities.
        </footer>
      </main>
    </div>
  );
}