import { Link } from "@tanstack/react-router";
import { LayoutGrid, Bot, Phone, Settings, Moon, Sun, AudioWaveform } from "lucide-react";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/agents", label: "AI Agents", icon: Bot, exact: false },
  { to: "/phone-numbers", label: "Phone Numbers", icon: Phone, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppSidebar() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
      <Link to="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <AudioWaveform className="h-4 w-4" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">AgentStudio</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground font-medium" }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={toggle}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {dark ? "Light mode" : "Dark mode"}
      </button>
    </aside>
  );
}
