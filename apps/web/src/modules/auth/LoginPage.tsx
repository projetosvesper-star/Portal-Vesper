import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../shared/api/client";
import { LoginResponse } from "../../shared/api/types";
import { useAuthStore } from "../../shared/auth/store";
import { Button } from "../../shared/components/Button";
import { Input } from "../../shared/components/Input";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ username, password, remember_me: rememberMe }),
      });
      setSession(response.access_token, response.refresh_token, response.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden flex-col justify-between border-r border-border bg-[radial-gradient(circle_at_20%_20%,rgba(56,211,238,0.18),transparent_24rem)] p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan/30 bg-cyan/10 text-xl font-black text-cyan">V</div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan">Portal</p>
            <h1 className="text-3xl font-bold text-white">Vesper</h1>
          </div>
        </div>
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-teal">Sistema empresarial modular</p>
          <h2 className="text-5xl font-semibold leading-tight text-white">Uma fundacao unica para os sistemas internos da Vesper.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            O portal centraliza autenticacao, permissoes, modulos, auditoria, arquivos e comunicacao em tempo real para receber os proximos modulos sem acoplamento.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-slate-400">
          {["FastAPI", "Tauri 2.0", "PostgreSQL"].map((item) => (
            <div key={item} className="rounded-md border border-border bg-white/[0.04] p-4">
              <p className="font-medium text-slate-100">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-border bg-panel/80 p-7 shadow-glow">
          <div className="mb-7">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan">Acesso seguro</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Entrar no Portal</h2>
          </div>
          <label className="mb-4 block">
            <span className="mb-2 block text-sm text-slate-300">Username</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="mb-4 block">
            <span className="mb-2 block text-sm text-slate-300">Senha</span>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          <div className="mb-5 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-400">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              Lembrar de mim
            </label>
            <span className="rounded-full border border-border px-2 py-1 text-xs text-slate-400">development</span>
          </div>
          {error ? <p className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </section>
    </div>
  );
}
