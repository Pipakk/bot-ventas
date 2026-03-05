"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import CreateScenarioModal from "@/components/CreateScenarioModal";

// ─── tipos ────────────────────────────────────────────────────────────────────

interface TeamInfo {
  id: string;
  name: string;
  plan: string;
  maxSeats: number;
  memberCount: number;
  isOwner: boolean;
  myRole: string;
  canCreateScenarios: boolean;
  canViewTeamCalls: boolean;
}

interface Member {
  id: string;
  userId: string;
  email: string;
  teamRole: string;
  canCreateScenarios: boolean;
  canViewTeamCalls: boolean;
}

interface TeamCall {
  id: string;
  userId: string;
  userEmail: string;
  difficulty: string;
  industry: string | null;
  prospectType: string | null;
  durationSeconds: number | null;
  startedAt: string;
  totalScore: number | null;
  hasAnalysis: boolean;
}

interface TeamScenario {
  id: string;
  name: string;
  prospectName: string;
  industry: string;
  personality: string;
  difficulty: string;
}

type Tab = "members" | "calls" | "scenarios";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(sec: number | null) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── componente principal ────────────────────────────────────────────────────

export default function TeamPage() {
  const { token, user, ready } = useRequireAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [activeTeam, setActiveTeam] = useState<TeamInfo | null>(null);
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [calls, setCalls] = useState<TeamCall[]>([]);
  const [scenarios, setScenarios] = useState<TeamScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState("");
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "manager">("member");
  const [inviteCanScenarios, setInviteCanScenarios] = useState(false);
  const [inviteCanCalls, setInviteCanCalls] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "professional" | "premium">("free");

  // Cargar equipos y plan
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/team", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/billing/plan", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([teamsData, planData]) => {
      const list: TeamInfo[] = teamsData.teams ?? [];
      setTeams(list);
      if (list.length > 0) setActiveTeam(list[0]);
      if (planData.plan) setUserPlan(planData.plan);
    }).catch(() => setError("Error cargando equipos"))
      .finally(() => setLoading(false));
  }, [token]);

  const loadTabContent = useCallback(async () => {
    if (!activeTeam || !token) return;
    setLoadingContent(true);
    try {
      if (tab === "members") {
        const r = await fetch(`/api/team/members?teamId=${activeTeam.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setMembers(d.members ?? []);
      } else if (tab === "calls") {
        const r = await fetch(`/api/team/calls?teamId=${activeTeam.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setCalls(d.calls ?? []);
      } else if (tab === "scenarios") {
        const r = await fetch(`/api/team/scenarios?teamId=${activeTeam.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setScenarios(d.scenarios ?? []);
      }
    } catch {
      // silencioso
    } finally {
      setLoadingContent(false);
    }
  }, [activeTeam, tab, token]);

  useEffect(() => { loadTabContent(); }, [loadTabContent]);

  if (!ready) return null;

  const canManage = activeTeam?.myRole === "manager";

  // ── Crear equipo ──────────────────────────────────────────────────────────

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setError("");
    try {
      const r = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Error creando equipo"); return; }
      const newTeam: TeamInfo = {
        id: d.team.id,
        name: d.team.name,
        plan: d.team.plan,
        maxSeats: d.team.maxSeats,
        memberCount: 1,
        isOwner: true,
        myRole: "manager",
        canCreateScenarios: true,
        canViewTeamCalls: true,
      };
      setTeams((prev) => [...prev, newTeam]);
      setActiveTeam(newTeam);
      setShowCreateTeam(false);
      setNewTeamName("");
    } catch { setError("Error de conexión"); }
  }

  // ── Invitar miembro ───────────────────────────────────────────────────────

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeTeam) return;
    setInviting(true);
    setInviteError("");
    try {
      const r = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          teamId: activeTeam.id,
          email: inviteEmail.trim(),
          teamRole: inviteRole,
          canCreateScenarios: inviteCanScenarios,
          canViewTeamCalls: inviteCanCalls,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setInviteError(d.error ?? "Error añadiendo miembro"); return; }
      setShowAddMember(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteCanScenarios(false);
      setInviteCanCalls(false);
      await loadTabContent();
    } catch { setInviteError("Error de conexión"); }
    finally { setInviting(false); }
  }

  // ── Actualizar permisos ───────────────────────────────────────────────────

  async function togglePermission(memberId: string, field: "canCreateScenarios" | "canViewTeamCalls", current: boolean) {
    if (!activeTeam) return;
    await fetch("/api/team/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ memberId, teamId: activeTeam.id, [field]: !current }),
    });
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, [field]: !current } : m));
  }

  async function removeMember(memberId: string) {
    if (!activeTeam || !confirm("¿Eliminar a este miembro del equipo?")) return;
    await fetch(`/api/team/members?memberId=${memberId}&teamId=${activeTeam.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function deleteScenario(id: string) {
    if (!confirm("¿Eliminar este escenario del equipo?")) return;
    await fetch(`/api/team/scenarios?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }

  // ─── render ───────────────────────────────────────────────────────────────

  const canCreateTeam = userPlan === "professional" || userPlan === "premium";
  const canAddMoreTeams = userPlan === "premium" || (userPlan === "professional" && teams.length === 0);

  return (
    <>
      {showScenarioModal && activeTeam && (
        <CreateScenarioModal
          teamId={activeTeam.id}
          onClose={() => setShowScenarioModal(false)}
          onSaved={() => { setShowScenarioModal(false); loadTabContent(); }}
        />
      )}

      <div className="page-stack max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Gestión de equipo</h1>
            <p className="text-slate-400 text-sm mt-1">
              Administra tu equipo, permisos y escenarios compartidos.
            </p>
          </div>
          <Link href="/dashboard" className="btn-secondary w-fit">← Dashboard</Link>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="card p-8 text-center text-slate-400">Cargando equipos…</div>
        ) : !canCreateTeam && teams.length === 0 ? (
          /* Upsell para plan free */
          <div className="card p-8 text-center space-y-4">
            <div className="text-4xl">🏢</div>
            <h2 className="text-lg font-semibold text-white">Los equipos son función exclusiva</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Con el plan <strong className="text-white">Profesional</strong> puedes crear un equipo de hasta 10 comerciales.
              Con <strong className="text-white">Premium</strong>, equipos ilimitados.
            </p>
            <Link href="/billing" className="btn-primary inline-flex">Ver planes →</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            {/* Sidebar equipos */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 px-1 mb-2">Tus equipos</p>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTeam(t); setTab("members"); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                    activeTeam?.id === t.id
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <span className="font-medium block truncate">{t.name}</span>
                  <span className="text-xs opacity-60">{t.memberCount} miembros · {t.myRole === "manager" ? "Gestor" : "Miembro"}</span>
                </button>
              ))}

              {canAddMoreTeams && (
                showCreateTeam ? (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Nombre del equipo"
                      className="input-base w-full text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreateTeam(); if (e.key === "Escape") setShowCreateTeam(false); }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCreateTeam} className="btn-primary flex-1 text-xs py-1.5">Crear</button>
                      <button onClick={() => setShowCreateTeam(false)} className="btn-secondary flex-1 text-xs py-1.5">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-400 hover:text-blue-300 border border-dashed border-slate-700 hover:border-blue-500/40 transition-colors"
                  >
                    + Nuevo equipo
                  </button>
                )
              )}
            </div>

            {/* Contenido del equipo activo */}
            {activeTeam ? (
              <div className="space-y-4">
                {/* Info equipo */}
                <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white text-lg">{activeTeam.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeTeam.memberCount} / {activeTeam.maxSeats} asientos ·{" "}
                      Plan {activeTeam.plan === "premium" ? "Premium" : "Profesional"} ·{" "}
                      {activeTeam.myRole === "manager" ? "Eres gestor" : "Eres miembro"}
                    </p>
                  </div>
                  {canManage && tab === "members" && (
                    <button onClick={() => setShowAddMember(true)} className="btn-primary text-sm">
                      + Añadir miembro
                    </button>
                  )}
                  {canManage && tab === "scenarios" && (
                    <button onClick={() => setShowScenarioModal(true)} className="btn-primary text-sm">
                      + Crear escenario
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-slate-800">
                  {(["members", "calls", "scenarios"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        tab === t
                          ? "border-blue-500 text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t === "members" ? "Miembros" : t === "calls" ? "Llamadas del equipo" : "Escenarios"}
                    </button>
                  ))}
                </div>

                {/* Modal añadir miembro */}
                {showAddMember && (
                  <div className="card p-4 space-y-3 border-blue-500/30">
                    <h3 className="text-sm font-semibold text-white">Añadir miembro</h3>
                    <p className="text-xs text-slate-400">El usuario debe estar registrado en la plataforma.</p>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="input-base w-full text-sm"
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Rol en el equipo</label>
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "member" | "manager")} className="select-base w-full text-sm">
                          <option value="member">Comercial (miembro)</option>
                          <option value="manager">Gestor</option>
                        </select>
                      </div>
                      {inviteRole === "member" && (
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={inviteCanScenarios} onChange={(e) => setInviteCanScenarios(e.target.checked)} className="rounded" />
                            Puede crear escenarios
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={inviteCanCalls} onChange={(e) => setInviteCanCalls(e.target.checked)} className="rounded" />
                            Puede ver llamadas del equipo
                          </label>
                        </div>
                      )}
                    </div>
                    {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
                    <div className="flex gap-2">
                      <button onClick={handleInvite} disabled={inviting} className="btn-primary text-sm">
                        {inviting ? "Añadiendo…" : "Añadir"}
                      </button>
                      <button onClick={() => { setShowAddMember(false); setInviteError(""); }} className="btn-secondary text-sm">Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Contenido de tabs */}
                {loadingContent ? (
                  <div className="card p-8 text-center text-slate-400">Cargando…</div>
                ) : tab === "members" ? (
                  <div className="card overflow-hidden">
                    {members.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No hay miembros aún.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="text-left py-3 px-4 text-slate-300 font-medium">Email</th>
                            <th className="text-left py-3 px-4 text-slate-300 font-medium">Rol</th>
                            <th className="text-center py-3 px-4 text-slate-300 font-medium">Ver llamadas</th>
                            <th className="text-center py-3 px-4 text-slate-300 font-medium">Crear escenarios</th>
                            {canManage && <th className="text-right py-3 px-4 text-slate-300 font-medium">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((m) => (
                            <tr key={m.id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                              <td className="py-3 px-4 text-slate-200">
                                {m.email}
                                {m.userId === user?.id && <span className="ml-2 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Tú</span>}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${m.teamRole === "manager" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700 text-slate-300"}`}>
                                  {m.teamRole === "manager" ? "Gestor" : "Comercial"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {m.teamRole === "manager" ? (
                                  <span className="text-emerald-400 text-xs">Siempre</span>
                                ) : canManage ? (
                                  <button
                                    onClick={() => togglePermission(m.id, "canViewTeamCalls", m.canViewTeamCalls)}
                                    className={`w-10 h-5 rounded-full transition-colors ${m.canViewTeamCalls ? "bg-emerald-500" : "bg-slate-700"}`}
                                    title={m.canViewTeamCalls ? "Desactivar" : "Activar"}
                                  >
                                    <span className={`block w-3.5 h-3.5 rounded-full bg-white mx-auto transition-transform ${m.canViewTeamCalls ? "translate-x-2" : "-translate-x-2"}`} />
                                  </button>
                                ) : (
                                  <span className={m.canViewTeamCalls ? "text-emerald-400 text-xs" : "text-slate-600 text-xs"}>
                                    {m.canViewTeamCalls ? "Sí" : "No"}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {m.teamRole === "manager" ? (
                                  <span className="text-emerald-400 text-xs">Siempre</span>
                                ) : canManage ? (
                                  <button
                                    onClick={() => togglePermission(m.id, "canCreateScenarios", m.canCreateScenarios)}
                                    className={`w-10 h-5 rounded-full transition-colors ${m.canCreateScenarios ? "bg-emerald-500" : "bg-slate-700"}`}
                                    title={m.canCreateScenarios ? "Desactivar" : "Activar"}
                                  >
                                    <span className={`block w-3.5 h-3.5 rounded-full bg-white mx-auto transition-transform ${m.canCreateScenarios ? "translate-x-2" : "-translate-x-2"}`} />
                                  </button>
                                ) : (
                                  <span className={m.canCreateScenarios ? "text-emerald-400 text-xs" : "text-slate-600 text-xs"}>
                                    {m.canCreateScenarios ? "Sí" : "No"}
                                  </span>
                                )}
                              </td>
                              {canManage && (
                                <td className="py-3 px-4 text-right">
                                  {m.userId !== user?.id && (
                                    <button onClick={() => removeMember(m.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                      Eliminar
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : tab === "calls" ? (
                  <div className="card overflow-hidden">
                    {calls.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No hay llamadas registradas en el equipo aún.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                              <th className="text-left py-3 px-4 text-slate-300 font-medium">Comercial</th>
                              <th className="text-left py-3 px-4 text-slate-300 font-medium">Fecha</th>
                              <th className="text-left py-3 px-4 text-slate-300 font-medium">Dificultad</th>
                              <th className="text-left py-3 px-4 text-slate-300 font-medium">Duración</th>
                              <th className="text-left py-3 px-4 text-slate-300 font-medium">Puntuación</th>
                              <th className="text-right py-3 px-4 text-slate-300 font-medium">Ver</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calls.map((c) => (
                              <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                                <td className="py-3 px-4 text-slate-300 text-xs">{c.userEmail}</td>
                                <td className="py-3 px-4 text-slate-300 text-xs">{formatDate(c.startedAt)}</td>
                                <td className="py-3 px-4 text-slate-300 text-xs">{c.difficulty === "hard" ? "Difícil" : "Normal"}</td>
                                <td className="py-3 px-4 text-slate-300 text-xs">{formatDuration(c.durationSeconds)}</td>
                                <td className="py-3 px-4">
                                  {c.totalScore != null ? (
                                    <span className="font-medium text-primary-300">{c.totalScore}</span>
                                  ) : <span className="text-slate-600">—</span>}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Link href={`/results/${c.id}`} className="text-primary-400 hover:text-primary-300 text-xs font-medium">
                                    Ver informe
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Escenarios del equipo */
                  <div className="space-y-2">
                    {scenarios.length === 0 ? (
                      <div className="card p-6 text-center space-y-2">
                        <p className="text-slate-400 text-sm">No hay escenarios de equipo aún.</p>
                        {canManage && (
                          <button onClick={() => setShowScenarioModal(true)} className="btn-primary text-sm inline-flex mt-2">
                            Crear el primero →
                          </button>
                        )}
                      </div>
                    ) : (
                      scenarios.map((s) => (
                        <div key={s.id} className="card px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-200 text-sm">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.prospectName} · {s.industry} · {s.difficulty}</p>
                          </div>
                          {canManage && (
                            <button onClick={() => deleteScenario(s.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">
                              Eliminar
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center text-slate-400 text-sm">Selecciona un equipo para gestionar.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
