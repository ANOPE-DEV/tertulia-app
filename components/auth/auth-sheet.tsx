"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/config";
import "./auth-sheet.css";

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu email primeiro (verifique a caixa de entrada).";
  if (m.includes("user already registered")) return "Este email já tem conta. Faça login.";
  if (m.includes("password should be at least")) return "A senha precisa ter ao menos 6 caracteres.";
  if (m.includes("rate limit")) return "Muitas tentativas — aguarde alguns minutos.";
  if (m.includes("failed to fetch")) return "Não foi possível conectar ao Supabase. Verifique .env.local.";
  return msg;
}

const SITE_URL =
  (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export type AuthMode = "signin" | "signup";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: AuthMode;
  gateReason?: string; // "adicionar produto", "assinar plano", etc.
  supabaseConfigured?: boolean;
}

export function AuthSheet({
  open,
  onClose,
  onSuccess,
  initialMode = "signup",
  gateReason,
  supabaseConfigured,
}: AuthSheetProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const configured = supabaseConfigured ?? hasSupabase();

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: `${SITE_URL}/auth/callback`,
            },
          });
          if (error) {
            setError(translateAuthError(error.message));
            return;
          }
          if (!data.session) {
            setSuccessMsg(
              "Confirme seu email para ativar a conta e garantir seus 50 pts do Clube.",
            );
            return;
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            setError(translateAuthError(error.message));
            return;
          }
        }
        onSuccess?.();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? translateAuthError(err.message) : "Erro desconhecido.");
      }
    });
  };

  const handleGoogle = () => {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${SITE_URL}/auth/callback` },
        });
        if (error) setError(translateAuthError(error.message));
        // On success, browser is redirected to Google — no further UI action needed.
      } catch (err) {
        setError(err instanceof Error ? translateAuthError(err.message) : "Erro desconhecido.");
      }
    });
  };

  return (
    <div className="tt-auth-wrap">
      <div className="tt-auth-backdrop" onClick={onClose} />
      <div className="tt-auth-sheet">
        <div className="tt-auth-handle-row">
          <span className="tt-auth-handle" />
        </div>

        <div className="tt-auth-body">
          <div className="tt-auth-hd">
            <span className="tt-auth-kicker">Clube Tertúlia</span>
            <h2 className="tt-auth-title">
              {gateReason
                ? "Junte-se para continuar"
                : mode === "signup"
                  ? "Cadastre-se e ganhe 50 pts"
                  : "Bem-vindo de volta"}
            </h2>
            <p className="tt-auth-sub">
              {gateReason
                ? `Faça parte da Tertúlia pra ${gateReason}. Grátis, e você ganha 50 pts no Clube pra resgatar brindes.`
                : mode === "signup"
                  ? "Grátis, sem compromisso. Você recebe 50 pts pra começar a resgatar brindes no Clube."
                  : "Entre pra continuar de onde parou."}
            </p>
          </div>

          {!configured && (
            <div className="tt-auth-warn">
              <strong>Configuração pendente.</strong> Preencha{" "}
              <code>.env.local</code> com suas chaves do Supabase e rode as
              migrations SQL no dashboard pra habilitar cadastro/login.
            </div>
          )}

          <div className="tt-auth-tabs">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`tt-auth-tab${mode === "signup" ? " active" : ""}`}
            >
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`tt-auth-tab${mode === "signin" ? " active" : ""}`}
            >
              Entrar
            </button>
          </div>

          <button
            type="button"
            className="tt-auth-google"
            onClick={handleGoogle}
            disabled={pending || !configured}
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="tt-auth-divider">
            <span>ou com email</span>
          </div>

          <form onSubmit={handleSubmit} className="tt-auth-form">
            {mode === "signup" && (
              <label className="tt-auth-field">
                <span>Nome completo</span>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={pending || !configured}
                />
              </label>
            )}
            <label className="tt-auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending || !configured}
              />
            </label>
            <label className="tt-auth-field">
              <span>Senha</span>
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending || !configured}
              />
            </label>

            {error && <div className="tt-auth-error">{error}</div>}
            {successMsg && <div className="tt-auth-success">{successMsg}</div>}

            <button
              type="submit"
              className="tt-auth-submit"
              disabled={pending || !configured}
            >
              {pending
                ? "Aguarde..."
                : mode === "signup"
                  ? "Cadastrar · ganhar 50 pts"
                  : "Entrar"}
            </button>
          </form>

          <p className="tt-auth-fine">
            Ao continuar você concorda com os Termos e a Política de Privacidade
            da Tertúlia.
          </p>
        </div>

        <button
          className="tt-auth-close"
          onClick={onClose}
          aria-label="Fechar"
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18 M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.5 2.4 30 0 24 0 14.7 0 6.7 5.4 2.7 13.2l7.9 6.1C12.6 13.3 17.9 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.9c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.3-10.1 7.3-17.7z"
      />
      <path
        fill="#FBBC05"
        d="M10.6 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.7 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6 0 11.5-2 15.4-5.4l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.1 0-11.4-3.8-13.4-9.3l-7.9 6.1C6.7 42.6 14.7 48 24 48z"
      />
    </svg>
  );
}
