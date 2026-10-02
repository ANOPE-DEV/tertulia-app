"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ART,
  CATS,
  GLOSS,
  LEVELS,
  P,
  PAIR,
  QUIZ,
  REWARDS,
  TAB_ICONS,
  brl,
  byId,
  num,
  type Product,
} from "@/lib/data";
import {
  ChevronRight,
  ClockIcon,
  Placeholder,
  PlusIcon,
  SommelierSeal,
} from "./tertulia-icons";
import { AuthSheet, type AuthMode } from "./auth/auth-sheet";
import type { SubscriptionPlan, UserProfile } from "@/lib/queries";
import { hasSupabase } from "@/lib/supabase/config";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";
import { placeOrderAction, redeemRewardAction } from "@/lib/actions";
import {
  createBillingPortalSessionAction,
  createCheckoutSessionAction,
} from "@/lib/stripe/actions";
import "./tertulia-app.css";

type Tab = "home" | "shop" | "kits" | "learn" | "club";
type LearnTab = "artigos" | "guia" | "quiz" | "glossario";
type DeliveryId = "hoje" | "correio";

const CUTOFF_HOUR = 16;
const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

interface Session {
  user: { id: string; email: string | null };
  profile: UserProfile;
}

interface Props {
  initialSession: Session | null;
  plans: SubscriptionPlan[];
}

interface State {
  tab: Tab;
  cat: "queijos" | "vinhos" | "charutos" | "casa";
  sel: string | null;
  qty: number;
  cart: Record<string, number>;
  cartOpen: boolean;
  delivery: DeliveryId;
  ordered: boolean;
  lastPts: number;
  orderMsg: string;
  art: string | null;
  learnTab: LearnTab;
  qi: number;
  pick: number | null;
  score: number;
  quizDone: boolean;
  quizzes: number;
  toast: string;
  toastPts: string;
  authOpen: boolean;
  authMode: AuthMode;
  authGateReason: string;
  pendingAdd: { id: string; qty: number } | null;
  pendingSubscribe: "bon_vivant" | "fin_bec" | null;
  profileMenuOpen: boolean;
}

const initialState: State = {
  tab: "home",
  cat: "queijos",
  sel: null,
  qty: 1,
  cart: {},
  cartOpen: false,
  delivery: "hoje",
  ordered: false,
  lastPts: 0,
  orderMsg: "",
  art: null,
  learnTab: "artigos",
  qi: 0,
  pick: null,
  score: 0,
  quizDone: false,
  quizzes: 1,
  toast: "",
  toastPts: "",
  authOpen: false,
  authMode: "signup",
  authGateReason: "",
  pendingAdd: null,
  pendingSubscribe: null,
  profileMenuOpen: false,
};

type Action =
  | { type: "patch"; patch: Partial<State> }
  | { type: "go"; tab: Tab; extra?: Partial<State> }
  | { type: "add"; id: string; qty: number; toast: string; toastPts: string }
  | { type: "inc"; id: string }
  | { type: "dec"; id: string }
  | { type: "clear-toast" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "patch":
      return { ...s, ...a.patch };
    case "go":
      return { ...s, tab: a.tab, sel: null, art: null, cartOpen: false, profileMenuOpen: false, ...(a.extra ?? {}) };
    case "add":
      return {
        ...s,
        cart: { ...s.cart, [a.id]: (s.cart[a.id] ?? 0) + a.qty },
        ordered: false,
        toast: a.toast,
        toastPts: a.toastPts,
      };
    case "inc":
      return { ...s, cart: { ...s.cart, [a.id]: (s.cart[a.id] ?? 0) + 1 } };
    case "dec": {
      const c = { ...s.cart };
      c[a.id] = (c[a.id] ?? 0) - 1;
      if (c[a.id] <= 0) delete c[a.id];
      return { ...s, cart: c };
    }
    case "clear-toast":
      return { ...s, toast: "", toastPts: "" };
  }
}

function levelInfo(pts: number) {
  let i = 0;
  LEVELS.forEach((l, k) => {
    if (pts >= l.min) i = k;
  });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? Math.round(((pts - cur.min) / (next.min - cur.min)) * 100) : 100;
  return {
    cur,
    next,
    pct,
    msg: next
      ? `Faltam ${num(next.min - pts)} pts para ${next.name}.`
      : "Você está no nível mais alto do Clube.",
  };
}

interface ProductView extends Product {
  priceFmt: string;
  oldFmt: string;
  saveFmt: string;
  ptsLabel: string;
  ratingFmt: string;
  hasBadge: boolean;
  low: boolean;
  hasNote: boolean;
  weekly: number;
}

export default function TertuliaApp({ initialSession, plans }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [now, setNow] = useState<number>(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();

  const session = initialSession;
  const loggedIn = !!session;
  const supaConfigured = hasSupabase();

  const points = session?.profile.points ?? 0;
  const isSubscribed =
    !!session?.profile.subscription_plan &&
    (session.profile.subscription_status === "active" ||
      session.profile.subscription_status === "trialing");
  const activePlan = plans.find((p) => p.id === session?.profile.subscription_plan);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // Keep RSC in sync with Supabase auth state (cross-tab, token refresh, OAuth landing).
  useEffect(() => {
    if (!supaConfigured) return;
    const supabase = createBrowserSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, supaConfigured]);

  useEffect(() => {
    if (state.toast) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => dispatch({ type: "clear-toast" }), 2200);
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [state.toast]);

  const go = useCallback((tab: Tab, extra?: Partial<State>) => {
    dispatch({ type: "go", tab, extra });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const openAuthGate = useCallback((reason: string, mode: AuthMode = "signup") => {
    dispatch({
      type: "patch",
      patch: { authOpen: true, authMode: mode, authGateReason: reason },
    });
  }, []);

  const closeAuthSheet = useCallback(() => {
    dispatch({
      type: "patch",
      patch: {
        authOpen: false,
        authGateReason: "",
        pendingAdd: null,
        pendingSubscribe: null,
      },
    });
  }, []);

  const doAdd = useCallback((id: string, qty: number) => {
    const p = byId(id);
    dispatch({
      type: "add",
      id,
      qty,
      toast: `${p.name} — adicionado`,
      toastPts: `+${p.price * qty} pts`,
    });
  }, []);

  const add = useCallback(
    (id: string, qty = 1) => {
      if (!loggedIn) {
        dispatch({
          type: "patch",
          patch: {
            authOpen: true,
            authMode: "signup",
            authGateReason: "adicionar produtos à sacola",
            pendingAdd: { id, qty },
          },
        });
        return;
      }
      doAdd(id, qty);
    },
    [loggedIn, doAdd],
  );

  // On successful auth: if there was a pending action, resume it
  const handleAuthSuccess = useCallback(() => {
    const pending = state.pendingAdd;
    const sub = state.pendingSubscribe;
    dispatch({
      type: "patch",
      patch: { authOpen: false, authGateReason: "", pendingAdd: null, pendingSubscribe: null },
    });
    // Router refresh to fetch fresh session server-side
    startTransition(() => {
      router.refresh();
      if (pending) doAdd(pending.id, pending.qty);
      if (sub) subscribe(sub);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingAdd, state.pendingSubscribe, router]);

  const subscribe = useCallback(
    (planId: "bon_vivant" | "fin_bec") => {
      if (!loggedIn) {
        dispatch({
          type: "patch",
          patch: {
            authOpen: true,
            authMode: "signup",
            authGateReason: `assinar o ${planId === "bon_vivant" ? "Bon Vivant" : "Fin Bec"}`,
            pendingSubscribe: planId,
          },
        });
        return;
      }
      startTransition(async () => {
        const res = await createCheckoutSessionAction(planId);
        if (res.ok) {
          // Redireciona pro Stripe Checkout
          window.location.href = res.data.url;
        } else {
          dispatch({
            type: "patch",
            patch: { toast: res.error, toastPts: "" },
          });
        }
      });
    },
    [loggedIn],
  );

  const openBillingPortal = useCallback(() => {
    if (!loggedIn) return;
    startTransition(async () => {
      const res = await createBillingPortalSessionAction();
      if (res.ok) {
        window.location.href = res.data.url;
      } else {
        dispatch({ type: "patch", patch: { toast: res.error, toastPts: "" } });
      }
    });
  }, [loggedIn]);

  const view = useCallback(
    (p: Product): ProductView => {
      const stock = Math.max(0, p.stock - (state.cart[p.id] ?? 0));
      return {
        ...p,
        stock,
        priceFmt: brl(p.price),
        oldFmt: p.old ? brl(p.old) : "",
        saveFmt: p.old ? brl(p.old - p.price) : "",
        ptsLabel: `+${p.price} pts`,
        ratingFmt: p.rating.toFixed(1).replace(".", ","),
        hasBadge: !!p.badge,
        low: stock <= 5,
        hasNote: !!p.note,
        weekly: Math.round(p.reviews / 4) + 3,
      };
    },
    [state.cart],
  );

  const vals = useMemo(() => {
    const d = new Date(now);
    const end = new Date(now);
    end.setHours(CUTOFF_HOUR, 0, 0, 0);
    const mins = Math.round((end.getTime() - d.getTime()) / 60000);
    const deliveryHeadline =
      mins > 0
        ? `Peça em até ${mins >= 60 ? Math.floor(mins / 60) + "h " : ""}${mins % 60}min e receba hoje`
        : "Peça agora e receba amanhã pela manhã";
    const hr = d.getHours();
    const greeting = hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite";
    const lv = levelInfo(points);

    const lines = Object.entries(state.cart)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => {
        const p = byId(id);
        return {
          id,
          name: p.name,
          qty: q,
          pts: p.price * q,
          totalFmt: brl(p.price * q),
        };
      });
    const subtotal = lines.reduce((a, l) => a + l.pts, 0);
    const cartCount = lines.reduce((a, l) => a + l.qty, 0);
    const ship = state.delivery === "hoje" ? 15 : 0;
    const after = levelInfo(points + subtotal);
    const cartLevelMsg =
      after.cur.name !== lv.cur.name
        ? `Com este pedido você passa a ${after.cur.name}.`
        : after.next
          ? `Após este pedido, faltarão ${num(after.next.min - points - subtotal)} pts para ${after.next.name}.`
          : "";

    return { deliveryHeadline, greeting, lv, lines, subtotal, cartCount, ship, cartLevelMsg };
  }, [now, points, state.cart, state.delivery]);

  const { deliveryHeadline, greeting, lv, lines, subtotal, cartCount, ship, cartLevelMsg } = vals;
  const displayName = session?.profile.full_name?.split(" ")[0] || "amigo";

  const catSel = CATS.find((c) => c.id === state.cat)!;

  const selProduct = state.sel ? view(byId(state.sel)) : null;
  const article = state.art ? ART.find((a) => a.id === state.art) : null;

  const showCartBar = cartCount > 0 && !state.cartOpen && !selProduct && !article && !state.authOpen;
  const bottomPad = cartCount > 0 ? 96 : 20;
  const cartEmpty = !state.ordered && cartCount === 0;
  const cartFilled = !state.ordered && cartCount > 0;
  const cartTitle = state.ordered ? "Pedido" : "Sua sacola";

  const checkout = () => {
    if (!loggedIn) {
      openAuthGate("finalizar seu pedido");
      return;
    }
    const items = lines.map((l) => ({ product_id: l.id, quantity: l.qty }));
    startTransition(async () => {
      const res = await placeOrderAction(items, state.delivery);
      if (!res.ok) {
        dispatch({ type: "patch", patch: { toast: res.error, toastPts: "" } });
        return;
      }
      dispatch({
        type: "patch",
        patch: {
          ordered: true,
          lastPts: subtotal,
          cart: {},
          orderMsg: res.data.message,
        },
      });
      router.refresh();
    });
  };

  const redeem = (rewardId: string, cost: number) => {
    if (!loggedIn) {
      openAuthGate("resgatar brindes do Clube");
      return;
    }
    startTransition(async () => {
      const res = await redeemRewardAction(rewardId);
      if (!res.ok) {
        dispatch({ type: "patch", patch: { toast: res.error, toastPts: "" } });
        return;
      }
      dispatch({
        type: "patch",
        patch: { toast: "Brinde resgatado", toastPts: `-${cost} pts` },
      });
      router.refresh();
    });
  };

  const closeCart = () => dispatch({ type: "patch", patch: { cartOpen: false, ordered: false } });

  const openCart = () => {
    if (!loggedIn) {
      openAuthGate("acessar sua sacola");
      return;
    }
    dispatch({ type: "patch", patch: { cartOpen: true } });
  };

  const bestsellerIds = ["comte", "douro", "robusto", "velatab", "parm"];
  const barolo = view(byId("barolo"));
  const weekKit = view(byId("kfranca"));

  return (
    <div className="tt-page">
      <div className="tt-frame" data-screen-label="App">
        {/* status bar */}
        <div className="tt-statusbar">
          <span>9:41</span>
          <span className="tt-battery">
            <span />
          </span>
        </div>

        {/* header */}
        <div className="tt-header">
          <div className="tt-brand" onClick={() => go("home")} role="button" tabIndex={0}>
            <span className="tt-brand-name">Tertúlia</span>
            <span className="tt-brand-tag">EMPÓRIO DE FINOS</span>
          </div>
          <div className="tt-header-right">
            {loggedIn ? (
              <>
                <div className="tt-points-chip">
                  <span className="tt-points-num">{num(points)} pts</span>
                  <span className="tt-points-lv">{lv.cur.name}</span>
                </div>
                <button
                  className="tt-icon-btn"
                  onClick={openCart}
                  aria-label="Abrir sacola"
                >
                  <BagIcon />
                  {cartCount > 0 && <span className="tt-cart-count">{cartCount}</span>}
                </button>
                <div className="tt-profile-wrap">
                  <button
                    className="tt-profile-btn"
                    onClick={() =>
                      dispatch({
                        type: "patch",
                        patch: { profileMenuOpen: !state.profileMenuOpen },
                      })
                    }
                    aria-label="Menu do perfil"
                  >
                    <span className="tt-profile-initial">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  {state.profileMenuOpen && (
                    <>
                      <div
                        className="tt-profile-menu-backdrop"
                        onClick={() =>
                          dispatch({ type: "patch", patch: { profileMenuOpen: false } })
                        }
                      />
                      <div className="tt-profile-menu">
                        <div className="tt-profile-menu-hd">
                          <span className="tt-profile-menu-name">
                            {session?.profile.full_name || "Sem nome"}
                          </span>
                          <span className="tt-profile-menu-email">{session?.user.email}</span>
                        </div>
                        <button
                          className="tt-profile-menu-item"
                          onClick={() => {
                            dispatch({ type: "patch", patch: { profileMenuOpen: false } });
                            go("club");
                          }}
                        >
                          Meu Clube
                        </button>
                        {session?.profile.role === "admin" && (
                          <a href="/admin" className="tt-profile-menu-item">
                            Painel administrativo
                          </a>
                        )}
                        <button
                          className="tt-profile-menu-item tt-profile-menu-item-danger"
                          onClick={() =>
                            startTransition(async () => {
                              await signOutAction();
                              router.refresh();
                              dispatch({ type: "patch", patch: { profileMenuOpen: false } });
                            })
                          }
                        >
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className="tt-header-enter"
                  onClick={() =>
                    dispatch({
                      type: "patch",
                      patch: { authOpen: true, authMode: "signin", authGateReason: "" },
                    })
                  }
                >
                  Entrar
                </button>
                <button
                  className="tt-icon-btn"
                  onClick={openCart}
                  aria-label="Sacola"
                >
                  <BagIcon />
                </button>
              </>
            )}
          </div>
        </div>

        {/* scrollable body */}
        <div
          ref={scrollRef}
          className="tt-scroll"
          style={{ paddingBottom: `${bottomPad}px` }}
        >
          {state.tab === "home" && (
            <div className="tt-home">
              <div className="tt-home-greeting">
                <span className="tt-greet-kicker">
                  {greeting}
                  {loggedIn ? `, ${displayName}` : ""}
                </span>
                <h1 className="tt-greet-title">O que vamos servir hoje?</h1>
              </div>

              {!loggedIn && (
                <button
                  className="tt-signup-banner"
                  onClick={() => openAuthGate("aproveitar o Clube")}
                >
                  <div className="tt-signup-banner-l">
                    <span className="tt-signup-banner-kicker">Clube Tertúlia</span>
                    <span className="tt-signup-banner-title">
                      Cadastre-se e ganhe 50 pts
                    </span>
                    <span className="tt-signup-banner-sub">
                      Resgate brindes, participe do quiz e receba as caixas mensais.
                    </span>
                  </div>
                  <ChevronRight size={20} />
                </button>
              )}

              <div className="tt-delivery-band">
                <div className="tt-delivery-band-icon">
                  <ClockIcon size={16} />
                </div>
                <div className="tt-delivery-band-body">
                  <span className="tt-delivery-band-headline">{deliveryHeadline}</span>
                  <span className="tt-delivery-band-region">
                    Porto Feliz · Itu · Boituva
                  </span>
                </div>
              </div>

              <article className="tt-heroprod">
                <div className="tt-heroprod-img">
                  <span className="tt-heroprod-chip">Sommelier indica · Nº 07</span>
                  <Placeholder cat="vinhos" size={130} />
                </div>
                <div className="tt-heroprod-body">
                  <span className="tt-heroprod-origin">Nebbiolo · Piemonte, Itália</span>
                  <h2 className="tt-heroprod-name">Barolo DOCG 2018</h2>
                  <blockquote className="tt-heroprod-quote">
                    “A safra 2018 pede paciência. Decante uma hora antes.”
                    <span className="tt-heroprod-quote-cite">— André, sommelier da casa</span>
                  </blockquote>
                  <div className="tt-heroprod-actions">
                    <div className="tt-heroprod-priceblock">
                      <span className="tt-heroprod-priceval">{barolo.priceFmt}</span>
                      <span className="tt-heroprod-stock">
                        restam {barolo.stock} garrafas
                      </span>
                    </div>
                    <div className="tt-heroprod-buttons">
                      <button
                        className="tt-btn-outline"
                        onClick={() =>
                          dispatch({ type: "patch", patch: { sel: "barolo", qty: 1 } })
                        }
                      >
                        Conhecer
                      </button>
                      <button className="tt-btn-solid" onClick={() => add("barolo")}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <section className="tt-categories">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: 22,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Sortimento
                  </h3>
                  <button className="tt-linkbtn" onClick={() => go("shop")}>
                    Ver todos <span className="tt-arr" aria-hidden>→</span>
                  </button>
                </div>
                <div className="tt-cat-shelf-grid">
                  {CATS.map((c, i) => (
                    <button
                      key={c.id}
                      className="tt-cat-shelf"
                      onClick={() => go("shop", { cat: c.id })}
                    >
                      <div className="tt-cat-shelf-img">
                        <Placeholder cat={c.id} size={80} />
                      </div>
                      <div className="tt-cat-shelf-label">
                        <span className="tt-cat-shelf-num">Nº {ROMANS[i]}</span>
                        <span className="tt-cat-shelf-name">{c.label}</span>
                        <span className="tt-cat-shelf-count">
                          {P.filter((p) => p.cat === c.id).length} referências
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="tt-section-hd">
                  <h3>Da semana</h3>
                  <button className="tt-linkbtn" onClick={() => go("shop")}>
                    Ver loja <span className="tt-arr" aria-hidden>→</span>
                  </button>
                </div>
                <div className="tt-hscroll">
                  {bestsellerIds.map((id) => {
                    const p = view(byId(id));
                    return (
                      <div key={p.id} className="tt-hcard">
                        <div
                          className="tt-hcard-img"
                          onClick={() =>
                            dispatch({ type: "patch", patch: { sel: p.id, qty: 1 } })
                          }
                        >
                          <Placeholder cat={p.cat} size={70} />
                        </div>
                        <div
                          className="tt-hcard-info"
                          onClick={() =>
                            dispatch({ type: "patch", patch: { sel: p.id, qty: 1 } })
                          }
                        >
                          <span className="tt-origin">{p.origin}</span>
                          <span className="tt-pname">{p.name}</span>
                        </div>
                        <div className="tt-hcard-foot">
                          <span className="tt-price">{p.priceFmt}</span>
                          <button
                            className="tt-add-pill"
                            aria-label={`Adicionar ${p.name}`}
                            onClick={() => add(p.id)}
                          >
                            <PlusIcon size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div
                className="tt-kithero"
                onClick={() => go("kits")}
                role="button"
                tabIndex={0}
              >
                <div className="tt-kithero-img">
                  <Placeholder cat="kit" size={72} />
                </div>
                <div className="tt-kithero-body">
                  <span className="tt-kithero-kicker">Kit da semana · Nº 03</span>
                  <span className="tt-kithero-name">{weekKit.name}</span>
                  <span className="tt-kithero-desc">
                    Chablis 1er Cru, Comté 18 meses e Roquefort AOP para uma noite calma.
                  </span>
                  <div className="tt-kithero-priceline">
                    <span className="tt-kithero-price">{weekKit.priceFmt}</span>
                    <span className="tt-kithero-old">{weekKit.oldFmt}</span>
                  </div>
                  <span className="tt-kithero-save">economize {weekKit.saveFmt}</span>
                  <button
                    className="tt-kithero-add"
                    onClick={(e) => {
                      e.stopPropagation();
                      add("kfranca");
                    }}
                  >
                    Adicionar o kit
                  </button>
                </div>
              </div>

              {/* Planos teaser */}
              <section className="tt-plans-teaser">
                <div className="tt-plans-teaser-hd">
                  <span className="tt-greet-kicker">Clube de assinatura</span>
                  <h3 className="tt-plans-teaser-title">Todo mês na sua porta</h3>
                  <p className="tt-plans-teaser-sub">
                    Vinho, queijo harmonizado e um mimo surpresa — escolhidos pelo sommelier.
                  </p>
                </div>
                <div className="tt-plans-teaser-list">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      className="tt-plans-teaser-card"
                      onClick={() => go("club", { learnTab: "artigos" })}
                    >
                      <div className="tt-plans-teaser-card-l">
                        <span className="tt-plans-teaser-card-name">{plan.name}</span>
                        <span className="tt-plans-teaser-card-tag">{plan.tagline}</span>
                      </div>
                      <div className="tt-plans-teaser-card-r">
                        <span className="tt-plans-teaser-card-price">
                          {brl(plan.price_cents / 100)}
                        </span>
                        <span className="tt-plans-teaser-card-per">por mês</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="tt-eduteaser">
                <div className="tt-eduteaser-hd">
                  <h3>Portal do vinho &amp; queijo</h3>
                  <button className="tt-linkbtn" onClick={() => go("learn")}>
                    Ver tudo <span className="tt-arr" aria-hidden>→</span>
                  </button>
                </div>
                <div
                  className="tt-eduteaser-card"
                  onClick={() => dispatch({ type: "patch", patch: { art: ART[0].id } })}
                  role="button"
                  tabIndex={0}
                >
                  <div className="tt-eduteaser-img">
                    <Placeholder cat="article" size={64} />
                  </div>
                  <div className="tt-eduteaser-body">
                    <span className="tt-eduteaser-kicker">
                      {ART[0].kicker} · {ART[0].mins} min
                    </span>
                    <span className="tt-eduteaser-title">{ART[0].title}</span>
                  </div>
                  <div className="tt-eduteaser-chev" aria-hidden>
                    <ChevronRight size={18} />
                  </div>
                </div>
                <div
                  className="tt-eduteaser-quiz"
                  onClick={() => go("learn", { learnTab: "quiz" })}
                  role="button"
                  tabIndex={0}
                >
                  <div className="tt-eduteaser-quiz-l">
                    <span className="tt-eduteaser-quiz-kicker">Quiz da semana</span>
                    <span className="tt-eduteaser-quiz-title">
                      Descubra a uva do Barolo
                    </span>
                  </div>
                  <span className="tt-eduteaser-quiz-r">
                    +50 pts <ChevronRight size={14} />
                  </span>
                </div>
              </section>

              <div
                className="tt-clubband"
                onClick={() => go("club")}
                role="button"
                tabIndex={0}
              >
                <div className="tt-clubband-hd">
                  <div className="tt-clubband-titles">
                    <span className="tt-clubband-kicker">Clube Tertúlia</span>
                    <span className="tt-clubband-lv">{lv.cur.name}</span>
                  </div>
                  <div className="tt-clubband-seal">
                    <SommelierSeal size={54} />
                  </div>
                </div>
                <div className="tt-clubband-pts-row">
                  <span>
                    <span className="tt-clubband-pts">{num(points)}</span>
                    <span className="tt-clubband-pts-l">pontos</span>
                  </span>
                  <span className="tt-clubband-cta">
                    Ver meu Clube <ChevronRight size={14} />
                  </span>
                </div>
                <div className="tt-progress tt-progress-dark">
                  <div style={{ width: `${lv.pct}%` }} />
                </div>
                <div className="tt-clubband-msg">{lv.msg}</div>
              </div>
            </div>
          )}

          {state.tab === "shop" && (
            <div className="tt-shop">
              <div className="tt-cattabs">
                {CATS.map((c) => {
                  const active = c.id === state.cat;
                  return (
                    <button
                      key={c.id}
                      onClick={() => dispatch({ type: "patch", patch: { cat: c.id } })}
                      className="tt-cattab"
                      style={{
                        borderBottomColor: active ? "var(--color-accent)" : "transparent",
                        color: active ? "var(--color-text)" : "var(--color-neutral-600)",
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <div className="tt-cat-hd">
                <h3>{catSel.title}</h3>
                <span className="tt-cat-hd-sub">{catSel.sub}</span>
              </div>
              <div className="tt-shop-grid">
                {P.filter((p) => p.cat === state.cat).map((raw) => {
                  const p = view(raw);
                  return (
                    <div key={p.id} className="tt-shopcard">
                      <div
                        className="tt-shopcard-img"
                        onClick={() =>
                          dispatch({ type: "patch", patch: { sel: p.id, qty: 1 } })
                        }
                      >
                        <Placeholder cat={p.cat} size={72} />
                        {p.hasBadge && <span className="tt-badge">{p.badge}</span>}
                      </div>
                      <div
                        className="tt-hcard-info"
                        onClick={() =>
                          dispatch({ type: "patch", patch: { sel: p.id, qty: 1 } })
                        }
                      >
                        <span className="tt-origin">{p.origin}</span>
                        <span className="tt-pname">{p.name}</span>
                      </div>
                      <div className="tt-hcard-foot">
                        <span className="tt-price">{p.priceFmt}</span>
                        <button
                          className="tt-add-pill"
                          aria-label={`Adicionar ${p.name}`}
                          onClick={() => add(p.id)}
                        >
                          <PlusIcon size={16} />
                        </button>
                      </div>
                      {p.low && <span className="tt-lowstock">restam {p.stock}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {state.tab === "kits" && (
            <div className="tt-kits">
              <div className="tt-kits-head">
                <span className="tt-greet-kicker">Seleções do sommelier</span>
                <h1>Kits &amp; harmonizações</h1>
                <span className="tt-cat-hd-sub" style={{ marginTop: 4 }}>
                  Combinações montadas pelo sommelier, ao preço de kit.
                </span>
              </div>
              {P.filter((p) => p.cat === "kit").map((raw, i) => {
                const k = view(raw);
                return (
                  <article key={k.id} className="tt-kitcard">
                    <div className="tt-kitcard-img">
                      <Placeholder cat="kit" size={110} />
                      {k.hasBadge && <span className="tt-badge">{k.badge}</span>}
                    </div>
                    <div className="tt-kitcard-body">
                      <span className="tt-kitcard-kicker">
                        Seleção Nº {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="tt-kitcard-name"
                        onClick={() =>
                          dispatch({ type: "patch", patch: { sel: k.id, qty: 1 } })
                        }
                      >
                        {k.name}
                      </span>
                      <span className="tt-kitcard-body-line">{k.origin}</span>
                      <span className="tt-kitcard-meta">
                        {k.unit} · restam {k.stock}
                      </span>
                      <div className="tt-kitcard-price-row">
                        <span className="tt-kitcard-price">{k.priceFmt}</span>
                        <span className="tt-kitcard-old">{k.oldFmt}</span>
                        <span className="tt-kitcard-save">economize {k.saveFmt}</span>
                      </div>
                      <button className="tt-checkout tt-kit-add" onClick={() => add(k.id)}>
                        Adicionar o kit
                      </button>
                    </div>
                  </article>
                );
              })}

              <section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--color-divider)",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: 22,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Monte seu par
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 10,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    {PAIR.length} sugestões
                  </span>
                </div>
                {PAIR.map((h, i) => {
                  const tot = h.ids.reduce((a, id) => a + byId(id).price, 0);
                  const label =
                    (h.ids.length > 1 ? "Adicionar o par — " : "Adicionar o queijo — ") +
                    brl(tot);
                  return (
                    <div key={i} className="tt-pair">
                      <span className="tt-pair-title">
                        {h.w} <span className="amp">&amp;</span> {h.c}
                      </span>
                      <span className="tt-pair-why">{h.why}</span>
                      <button
                        className="tt-pair-add"
                        onClick={() => h.ids.forEach((id) => add(id))}
                      >
                        {label}
                      </button>
                    </div>
                  );
                })}
              </section>
            </div>
          )}

          {state.tab === "learn" && (
            <div>
              <div className="tt-learn-head">
                <span className="tt-greet-kicker">Portal educacional</span>
                <h1>Aprender</h1>
                <span className="tt-learn-head-sub">
                  Vinhos, queijos e charutos — pelo caminho longo.
                </span>
              </div>
              <div className="tt-learntabs">
                {(
                  [
                    ["artigos", "Artigos"],
                    ["guia", "Harmonização"],
                    ["quiz", "Quiz"],
                    ["glossario", "Glossário"],
                  ] as [LearnTab, string][]
                ).map(([id, label]) => {
                  const active = state.learnTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => dispatch({ type: "patch", patch: { learnTab: id } })}
                      className="tt-learntab"
                      style={{
                        borderBottomColor: active ? "var(--color-accent)" : "transparent",
                        color: active ? "var(--color-text)" : "var(--color-neutral-600)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {state.learnTab === "artigos" && (
                <div className="tt-articles">
                  {ART.map((a, i) => (
                    <article
                      key={a.id}
                      className="tt-article"
                      onClick={() => dispatch({ type: "patch", patch: { art: a.id } })}
                    >
                      <div className="tt-article-img">
                        <Placeholder cat="article" size={64} />
                      </div>
                      <div className="tt-article-body">
                        <span className="tt-article-kicker">
                          Nº {String(i + 1).padStart(2, "0")} · {a.kicker} · {a.mins} min
                        </span>
                        <span className="tt-article-title">{a.title}</span>
                        <span className="tt-article-lede">{a.lede}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {state.learnTab === "guia" && (
                <div className="tt-guide">
                  <p className="tt-guide-p">
                    Três regras bastam: acidez corta gordura, taninos pedem sal, doce equilibra o
                    salgado. Quando em dúvida — combine vinho e queijo da mesma região.
                  </p>
                  {PAIR.map((h, i) => {
                    const tot = h.ids.reduce((a, id) => a + byId(id).price, 0);
                    const label =
                      (h.ids.length > 1 ? "Adicionar o par — " : "Adicionar o queijo — ") +
                      brl(tot);
                    return (
                      <div key={i} className="tt-guide-row">
                        <span className="tt-guide-lbl">Vinho</span>
                        <span className="tt-guide-lbl">Queijo</span>
                        <span className="tt-guide-name">{h.w}</span>
                        <span className="tt-guide-name">{h.c}</span>
                        <span className="tt-guide-why">{h.why}</span>
                        <button
                          className="tt-guide-add"
                          onClick={() => h.ids.forEach((id) => add(id))}
                        >
                          {label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {state.learnTab === "quiz" &&
                (state.quizDone ? (
                  <div className="tt-quiz-done">
                    <span className="tt-greet-kicker">Quiz concluído</span>
                    <span className="tt-quiz-score">
                      {state.score} de {QUIZ.length} acertos
                    </span>
                    <span
                      className="tt-muted-14"
                      style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                    >
                      +50 pts creditados no Clube. O próximo quiz sai na segunda-feira.
                    </span>
                    <button
                      className="tt-btn-outline"
                      onClick={() =>
                        dispatch({
                          type: "patch",
                          patch: { qi: 0, pick: null, score: 0, quizDone: false },
                        })
                      }
                    >
                      Refazer
                    </button>
                  </div>
                ) : (
                  (() => {
                    const q = QUIZ[state.qi];
                    const last = state.qi === QUIZ.length - 1;
                    return (
                      <div className="tt-quiz">
                        <div className="tt-quiz-hd">
                          <span>
                            Pergunta {state.qi + 1} · {QUIZ.length}
                          </span>
                          <span style={{ color: "var(--color-accent-700)" }}>+50 pts</span>
                        </div>
                        <div className="tt-progress">
                          <div
                            style={{
                              width: `${Math.round(((state.qi + (state.pick !== null ? 1 : 0)) / QUIZ.length) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="tt-quiz-q">{q.q}</span>
                        <div className="tt-quiz-opts">
                          {q.o.map((opt, i) => {
                            let border = "var(--color-divider)";
                            let bg = "transparent";
                            if (state.pick !== null) {
                              if (i === q.a) {
                                border = "var(--color-accent)";
                                bg =
                                  "color-mix(in srgb, var(--color-accent-100) 60%, transparent)";
                              } else if (i === state.pick) {
                                border = "var(--color-neutral-500)";
                                bg = "var(--color-neutral-200)";
                              }
                            }
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  if (state.pick === null) {
                                    dispatch({
                                      type: "patch",
                                      patch: {
                                        pick: i,
                                        score: state.score + (i === q.a ? 1 : 0),
                                      },
                                    });
                                  }
                                }}
                                className="tt-quiz-opt"
                                style={{ borderColor: border, background: bg }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {state.pick !== null && (
                          <div className="tt-quiz-fb">
                            <span
                              className="tt-muted-14"
                              style={{
                                fontFamily: "var(--font-heading)",
                                fontStyle: "italic",
                                fontSize: 15,
                              }}
                            >
                              {(state.pick === q.a ? "Correto. " : "Quase. ") + q.e}
                            </span>
                            <button
                              className="tt-btn-solid"
                              onClick={() => {
                                if (last) {
                                  dispatch({
                                    type: "patch",
                                    patch: {
                                      quizDone: true,
                                      quizzes: state.quizzes + 1,
                                    },
                                  });
                                } else {
                                  dispatch({
                                    type: "patch",
                                    patch: { qi: state.qi + 1, pick: null },
                                  });
                                }
                              }}
                            >
                              {last ? "Ver resultado" : "Próxima pergunta"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ))}

              {state.learnTab === "glossario" && (
                <div className="tt-gloss">
                  {GLOSS.map((g) => (
                    <div key={g.t} className="tt-gloss-row">
                      <span className="tt-gloss-t">{g.t}</span>
                      <span className="tt-gloss-d">{g.d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.tab === "club" && (
            <div className="tt-club">
              <div className="tt-clubhero">
                <div className="tt-clubhero-head">
                  <div className="tt-clubhero-titles">
                    <span className="tt-clubhero-kicker">Clube Tertúlia</span>
                    <span className="tt-clubhero-name">{lv.cur.name}</span>
                  </div>
                  <SommelierSeal size={72} className="tt-clubhero-seal" />
                </div>
                <div className="tt-clubhero-pts">
                  <span className="tt-clubhero-pts-n">{num(points)}</span>
                  <span className="tt-clubhero-pts-l">pontos</span>
                </div>
                <div className="tt-progress tt-progress-dark">
                  <div style={{ width: `${lv.pct}%` }} />
                </div>
                <span className="tt-clubhero-msg">{lv.msg}</span>
                <span className="tt-clubhero-fine">R$ 1 em compras · 1 ponto</span>
              </div>

              {/* Planos de assinatura */}
              <section>
                <div className="tt-club-section-hd">
                  <h4>Planos de assinatura</h4>
                  <span className="tt-club-section-hd-count">
                    Uma caixa por mês
                  </span>
                </div>
                {isSubscribed && activePlan ? (
                  <div className="tt-plan-active">
                    <div className="tt-plan-active-l">
                      <span className="tt-plans-teaser-card-name">{activePlan.name}</span>
                      <span className="tt-plan-active-status">
                        Assinatura {session?.profile.subscription_status === "active" ? "ativa" : session?.profile.subscription_status}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <span className="tt-plan-active-price">
                        {brl(activePlan.price_cents / 100)}/mês
                      </span>
                      <button
                        className="tt-linkarr"
                        onClick={openBillingPortal}
                        disabled={pending}
                        style={{ fontSize: 12 }}
                      >
                        Gerenciar <span className="tt-arr" aria-hidden>→</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tt-plans-grid">
                    {plans.map((plan) => (
                      <article key={plan.id} className="tt-plan-card">
                        <div className="tt-plan-card-hd">
                          <span className="tt-plan-card-name">{plan.name}</span>
                          <span className="tt-plan-card-tag">{plan.tagline}</span>
                        </div>
                        <div className="tt-plan-card-price">
                          <span className="tt-plan-card-price-n">
                            {brl(plan.price_cents / 100)}
                          </span>
                          <span className="tt-plan-card-price-p">/mês</span>
                        </div>
                        <p className="tt-plan-card-desc">{plan.description}</p>
                        <ul className="tt-plan-card-perks">
                          {plan.perks.map((perk, i) => (
                            <li key={i}>
                              <span className="tt-plan-check" aria-hidden>·</span>
                              {perk}
                            </li>
                          ))}
                        </ul>
                        <button
                          className="tt-plan-card-cta"
                          onClick={() => subscribe(plan.id)}
                          disabled={pending}
                        >
                          Assinar {plan.name}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="tt-club-section-hd">
                  <h4>Níveis</h4>
                  <span className="tt-club-section-hd-count">{LEVELS.length} etapas</span>
                </div>
                {LEVELS.map((l, i) => {
                  const active = points >= l.min;
                  const ring = active ? "var(--color-accent)" : "var(--color-neutral-400)";
                  return (
                    <div key={l.name} className="tt-lvrow">
                      <span className="tt-lv-num" style={{ borderColor: ring, color: ring }}>
                        {ROMANS[i]}
                      </span>
                      <div className="tt-lv-info">
                        <span className="tt-lv-name">{l.name}</span>
                        <span className="tt-lv-perk">{l.perk}</span>
                      </div>
                      <span className="tt-lv-min">
                        {l.min ? num(l.min) + " pts" : "início"}
                      </span>
                    </div>
                  );
                })}
              </section>

              <section>
                <div className="tt-club-section-hd">
                  <h4>Desafios</h4>
                  <span className="tt-club-section-hd-count">4 abertos</span>
                </div>
                {[
                  { name: "Volta à França", desc: "Prove 5 queijos franceses diferentes.", done: 3, total: 5, pts: 300 },
                  { name: "Primeiro Barolo", desc: "Leve um Barolo para casa.", done: 0, total: 1, pts: 150 },
                  { name: "Aluno aplicado", desc: "Complete 3 quizzes semanais.", done: Math.min(3, state.quizzes), total: 3, pts: 100 },
                  { name: "Anfitrião", desc: "Compre 2 kits de harmonização.", done: 1, total: 2, pts: 200 },
                ].map((c) => {
                  const pct = Math.round((c.done / c.total) * 100);
                  return (
                    <div key={c.name} className="tt-chal">
                      <div className="tt-chal-hd">
                        <span className="tt-chal-name">{c.name}</span>
                        <span className="tt-chal-pts">+{c.pts} pts</span>
                      </div>
                      <span className="tt-chal-desc">{c.desc}</span>
                      <div className="tt-chal-progress-row">
                        <div className="tt-progress">
                          <div style={{ width: `${pct}%` }} />
                        </div>
                        <span className="tt-chal-count">
                          {c.done}/{c.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </section>

              <section>
                <div className="tt-club-section-hd">
                  <h4>Brindes</h4>
                  <span className="tt-club-section-hd-count">
                    {REWARDS.length} disponíveis
                  </span>
                </div>
                {REWARDS.map((r) => {
                  const disabled = points < r.cost || !loggedIn;
                  const label = !loggedIn
                    ? "Entrar"
                    : points < r.cost
                      ? `Faltam ${num(r.cost - points)}`
                      : "Resgatar";
                  return (
                    <div key={r.id} className="tt-rw">
                      <div className="tt-rw-img">
                        <Placeholder cat="casa" size={40} />
                      </div>
                      <div className="tt-rw-info">
                        <span className="tt-rw-name">{r.name}</span>
                        <span className="tt-rw-cost">{num(r.cost)} pts</span>
                      </div>
                      <button
                        className="tt-rw-btn"
                        disabled={disabled || pending}
                        onClick={() => redeem(r.id, r.cost)}
                      >
                        {label}
                      </button>
                    </div>
                  );
                })}
              </section>
            </div>
          )}
        </div>

        {showCartBar && (
          <button className="tt-cartbar" onClick={openCart}>
            <span className="tt-cartbar-l">
              <span className="tt-cartbar-l1">Sacola · {cartCount} itens</span>
              <span className="tt-cartbar-l2">+{subtotal} pts nesta compra</span>
            </span>
            <span className="tt-cartbar-r">
              {brl(subtotal)} <ChevronRight size={14} />
            </span>
          </button>
        )}

        <div className="tt-tabbar">
          {(
            [
              ["home", "Início"],
              ["shop", "Loja"],
              ["kits", "Kits"],
              ["learn", "Aprender"],
              ["club", "Clube"],
            ] as [Tab, string][]
          ).map(([id, label]) => {
            const active = state.tab === id;
            return (
              <button
                key={id}
                className={`tt-tab${active ? " active" : ""}`}
                onClick={() => go(id)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={TAB_ICONS[id]} />
                </svg>
                <span className="tt-tab-label">{label}</span>
                <span className="tt-tab-mark" style={{ opacity: active ? 1 : 0 }} />
              </button>
            );
          })}
        </div>

        {state.toast && (
          <div className="tt-toast">
            <span>{state.toast}</span>
            <span className="tt-toast-pts">{state.toastPts}</span>
          </div>
        )}

        {/* product sheet */}
        {selProduct && (
          <div className="tt-sheet-wrap">
            <div
              className="tt-sheet-backdrop"
              onClick={() => dispatch({ type: "patch", patch: { sel: null } })}
            />
            <div className="tt-sheet tt-sheet-product">
              <div className="tt-sheet-handle-row">
                <span className="tt-sheet-handle" />
              </div>
              <div className="tt-sheet-scroll">
                <div className="tt-sheet-img">
                  <Placeholder cat={selProduct.cat} size={140} />
                  <button
                    aria-label="Fechar"
                    className="tt-sheet-close"
                    onClick={() => dispatch({ type: "patch", patch: { sel: null } })}
                  >
                    <CloseIcon />
                  </button>
                </div>
                {(selProduct.hasBadge || selProduct.low) && (
                  <div className="tt-sheet-tags">
                    {selProduct.hasBadge && (
                      <span className="tt-tag-accent">{selProduct.badge}</span>
                    )}
                    {selProduct.low && (
                      <span className="tt-tag-neutral">Restam {selProduct.stock}</span>
                    )}
                  </div>
                )}
                <div className="tt-sheet-titles">
                  <span className="tt-sheet-origin">{selProduct.origin}</span>
                  <h2 className="tt-sheet-name">{selProduct.name}</h2>
                  <span className="tt-sheet-unit">{selProduct.unit}</span>
                </div>

                <div className="tt-sheet-price-row">
                  <span className="tt-sheet-price">{selProduct.priceFmt}</span>
                  <span className="tt-sheet-pts">{selProduct.ptsLabel}</span>
                </div>

                {selProduct.hasNote && (
                  <blockquote className="tt-sheet-note">
                    <span className="tt-sheet-note-kicker">Nota do sommelier</span>
                    <span className="tt-sheet-note-body">“{selProduct.note}”</span>
                  </blockquote>
                )}

                <p className="tt-sheet-desc">
                  <span className="tt-drop">{selProduct.desc.charAt(0)}</span>
                  {selProduct.desc.slice(1)}
                </p>

                <div className="tt-sheet-delivery">
                  <ClockIcon size={18} />
                  <span className="tt-sheet-delivery-txt">
                    {deliveryHeadline} em Porto Feliz, Itu e Boituva. Demais cidades pelos
                    Correios.
                  </span>
                </div>

                <span className="tt-sheet-review">
                  ★ {selProduct.ratingFmt} · {selProduct.reviews} avaliações ·{" "}
                  {selProduct.weekly} pedidos esta semana
                </span>
              </div>
              <div className="tt-sheet-foot">
                <div className="tt-qty">
                  <button
                    onClick={() =>
                      dispatch({ type: "patch", patch: { qty: Math.max(1, state.qty - 1) } })
                    }
                  >
                    −
                  </button>
                  <span>{state.qty}</span>
                  <button
                    onClick={() => dispatch({ type: "patch", patch: { qty: state.qty + 1 } })}
                  >
                    +
                  </button>
                </div>
                <button
                  className="tt-sheet-add"
                  onClick={() => {
                    if (state.sel) add(state.sel, state.qty);
                    dispatch({ type: "patch", patch: { sel: null } });
                  }}
                >
                  Adicionar · {brl(selProduct.price * state.qty)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* cart sheet */}
        {state.cartOpen && (
          <div className="tt-sheet-wrap">
            <div className="tt-sheet-backdrop" onClick={closeCart} />
            <div className="tt-sheet tt-sheet-cart">
              <div className="tt-sheet-header">
                <h3>{cartTitle}</h3>
                <button aria-label="Fechar" className="tt-sheet-close-2" onClick={closeCart}>
                  <CloseIcon />
                </button>
              </div>

              {state.ordered && (
                <div className="tt-order">
                  <span className="tt-greet-kicker">Pedido confirmado</span>
                  <span className="tt-order-title">
                    Obrigado. Sua tertúlia está a caminho.
                  </span>
                  <span
                    className="tt-muted-14"
                    style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: 15 }}
                  >
                    {state.orderMsg}
                  </span>
                  <span className="tt-order-pts">
                    +{state.lastPts} pts creditados
                  </span>
                  <button
                    className="tt-btn-solid"
                    style={{ marginTop: 8 }}
                    onClick={() => go("club", { ordered: false })}
                  >
                    Ver meu Clube
                  </button>
                </div>
              )}

              {cartEmpty && (
                <div className="tt-cart-empty">
                  <span className="tt-cart-empty-txt">Sua sacola está vazia.</span>
                  <button className="tt-btn-outline" onClick={() => go("kits")}>
                    Ver kits do sommelier
                  </button>
                </div>
              )}

              {cartFilled && (
                <>
                  <div className="tt-cart-scroll">
                    {lines.map((l) => (
                      <div key={l.id} className="tt-line">
                        <div className="tt-line-info">
                          <span className="tt-line-name">{l.name}</span>
                          <span className="tt-line-meta">
                            {l.totalFmt} · +{l.pts} pts
                          </span>
                        </div>
                        <div className="tt-qty tt-qty-sm">
                          <button onClick={() => dispatch({ type: "dec", id: l.id })}>−</button>
                          <span>{l.qty}</span>
                          <button onClick={() => dispatch({ type: "inc", id: l.id })}>+</button>
                        </div>
                      </div>
                    ))}
                    <div className="tt-delivery-opts">
                      <span className="tt-delivery-opts-lbl">Entrega</span>
                      {(
                        [
                          {
                            id: "hoje" as DeliveryId,
                            title: `Entrega hoje · ${brl(15)}`,
                            sub: "Porto Feliz, Itu e Boituva, até as 20h",
                          },
                          {
                            id: "correio" as DeliveryId,
                            title: "Correios",
                            sub: "Demais cidades, 3 a 7 dias úteis",
                          },
                        ]
                      ).map((o) => {
                        const active = state.delivery === o.id;
                        return (
                          <button
                            key={o.id}
                            className="tt-delivery-opt"
                            onClick={() =>
                              dispatch({ type: "patch", patch: { delivery: o.id } })
                            }
                            style={{
                              borderColor: active
                                ? "var(--color-accent)"
                                : "var(--color-divider)",
                            }}
                          >
                            <span
                              className="tt-radio-dot"
                              style={{
                                borderColor: active
                                  ? "var(--color-accent)"
                                  : "var(--color-divider)",
                              }}
                            >
                              <span
                                style={{
                                  background: active ? "var(--color-accent)" : "transparent",
                                }}
                              />
                            </span>
                            <span>
                              <span className="tt-delivery-opt-t">{o.title}</span>
                              <span className="tt-delivery-opt-s">{o.sub}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="tt-cart-foot">
                    {cartLevelMsg && <div className="tt-cart-level">{cartLevelMsg}</div>}
                    <div className="tt-cart-line">
                      <span>Subtotal</span>
                      <span>{brl(subtotal)}</span>
                    </div>
                    <div className="tt-cart-line">
                      <span>Frete</span>
                      <span>{state.delivery === "hoje" ? brl(ship) : "Calculado pelo CEP"}</span>
                    </div>
                    <div className="tt-cart-total">
                      <span className="tt-cart-total-l">Total</span>
                      <span className="tt-cart-total-r">{brl(subtotal + ship)}</span>
                    </div>
                    <button className="tt-checkout" onClick={checkout} disabled={pending}>
                      {pending ? "Processando..." : "Finalizar pedido"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* article reader */}
        {article && (
          <div className="tt-article-reader">
            <div style={{ height: 44, flex: "none" }} />
            <div className="tt-article-bar">
              <button
                className="tt-article-back"
                onClick={() => dispatch({ type: "patch", patch: { art: null } })}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Aprender
              </button>
            </div>
            <div className="tt-article-scroll">
              <span className="tt-article-kicker">
                {article.kicker} · {article.mins} min de leitura
              </span>
              <h2 className="tt-article-h">{article.title}</h2>
              <div className="tt-article-hero">
                <Placeholder cat="article" size={140} />
              </div>
              {article.body.map((para, i) => (
                <p key={i} className="tt-article-p">
                  {para}
                </p>
              ))}
              <div className="tt-article-cta">
                <span className="tt-article-cta-lbl">Para provar o que você leu</span>
                <button
                  className="tt-article-cta-btn"
                  onClick={() =>
                    dispatch({
                      type: "patch",
                      patch: { art: null, sel: article.shop, qty: 1 },
                    })
                  }
                >
                  {article.shopLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth bottom sheet */}
        <AuthSheet
          open={state.authOpen}
          onClose={closeAuthSheet}
          onSuccess={handleAuthSuccess}
          initialMode={state.authMode}
          gateReason={state.authGateReason || undefined}
          supabaseConfigured={supaConfigured}
        />
      </div>
    </div>
  );
}

function BagIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function CloseIcon() {
  return (
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
  );
}
