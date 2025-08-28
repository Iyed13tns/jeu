import React, { useEffect, useMemo, useState } from "react";

/* ---------------- Utils ---------------- */
const cls = (...arr) => arr.filter(Boolean).join(" ");
const currency = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const nowIso = () => new Date().toISOString();

// Fallback UUID + stockage sûr (corrige le bouton "Créer le compte" qui ne faisait rien si storage/crypto bloqués)
const uid = () =>
  (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : "uid-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Storage error:", e);
    return false;
  }
}

/* Placeholder image (fallback si une image jeu manque) */
function placeholderImage(title = "Jeu") {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#1f2937'/>
      <stop offset='100%' stop-color='#111827'/>
    </linearGradient>
  </defs>
  <rect width='640' height='360' rx='24' fill='url(#g)'/>
  <g fill='#facc15' font-family='Inter, system-ui, Arial' text-anchor='middle'>
    <text x='320' y='180' font-weight='700' font-size='36'>${title}</text>
  </g>
</svg>`)
  );
}

/* --------------- Données --------------- */
const CATEGORIES = [
  { id: "pop", label: "Populaires" },
  { id: "slots", label: "Machines à sous" },
  { id: "table", label: "Jeux de table" },
  { id: "live", label: "Live Casino" },
  { id: "jackpot", label: "Jackpots" },
];

const GAMES = [
  { id: "g1",  title: "Trésor Aztec",        cat: "slots",   provider: "Studio A",    rtp: 96.2, volatility: "Moyenne",      image: "/images/games/aztec-treasure.jpg" },
  { id: "g2",  title: "Roulette Royale",     cat: "table",   provider: "Studio B",    rtp: 97.3, volatility: "—",            image: "/images/games/roulette-royale.jpg" },
  { id: "g3",  title: "Blackjack Pro",       cat: "table",   provider: "Studio B",    rtp: 99.4, volatility: "—",            image: "/images/games/blackjack-pro.jpg" },
  { id: "g4",  title: "Mine d'Or",           cat: "slots",   provider: "Studio C",    rtp: 95.1, volatility: "Élevée",       image: "/images/games/mine-or.jpg" },
  { id: "g5",  title: "Mega Roue (Live)",    cat: "live",    provider: "Studio Live", rtp: 95.8, volatility: "—",            image: "/images/games/mega-roue.jpg" },
  { id: "g6",  title: "Fortune Fruits",      cat: "slots",   provider: "Studio A",    rtp: 96.0, volatility: "Faible",       image: "/images/games/fortune-fruits.jpg" },
  { id: "g7",  title: "Jackpot Nuit",        cat: "jackpot", provider: "Studio D",    rtp: 94.0, volatility: "Très élevée",  image: "/images/games/jackpot-nuit.jpg" },
  { id: "g8",  title: "Poker 3 Cartes",      cat: "table",   provider: "Studio B",    rtp: 97.7, volatility: "—",            image: "/images/games/poker-3cartes.jpg" },
  { id: "g9",  title: "Wild West",           cat: "slots",   provider: "Studio C",    rtp: 96.7, volatility: "Élevée",       image: "/images/games/wild-west.jpg" },
  { id: "g10", title: "Lightning Roulette",  cat: "live",    provider: "Studio Live", rtp: 97.1, volatility: "—",            image: "/images/games/lightning-roulette.jpg" },
  { id: "g11", title: "Bingo Pop",           cat: "pop",     provider: "Studio Fun",  rtp: 95.0, volatility: "Faible",       image: "/images/games/bingo-pop.jpg" },
  { id: "g12", title: "Book of Luck",        cat: "slots",   provider: "Studio E",    rtp: 96.4, volatility: "Moyenne",      image: "/images/games/book-of-luck.jpg" },
];

/* ------------ Local Storage ------------ */
const LS = { users: "cv_users", session: "cv_session", theme: "cv_theme", cookies: "cv_cookies" };
const loadUsers   = () => { try { return JSON.parse(localStorage.getItem(LS.users)   || "[]");   } catch { return []; } };
const saveUsers   = (u) => safeSave(LS.users, u);
const loadSession = () => { try { return JSON.parse(localStorage.getItem(LS.session) || "null"); } catch { return null; } };
const saveSession = (s) => safeSave(LS.session, s);

/* ---------------- Composants UI ---------------- */
const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900/60 px-2.5 py-1 text-xs font-medium text-gray-200">
    {children}
  </span>
);

const Button = ({ children, onClick, variant = "primary", className = "", type = "button", disabled }) => {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition active:scale-[.98] disabled:opacity-60";
  const styles = {
    primary: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold hover:brightness-110",
    outline: "border border-gray-700 text-gray-200 hover:bg-gray-800",
    ghost: "text-gray-300 hover:bg-gray-800",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls(base, styles[variant], className)}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={cls(
      "rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black shadow-lg hover:shadow-yellow-500/10 transition",
      className
    )}
  >
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <label className="grid gap-1 text-sm">
    <span className="font-medium text-gray-200">{label}</span>
    <input
      {...props}
      className="w-full rounded-2xl border border-gray-700 bg-black/60 text-gray-100 px-3 py-3 outline-none focus:ring-2 focus:ring-yellow-500"
    />
  </label>
);

/* ---------------- Header (mobile burger) ---------------- */
function Header({ navigate, route, session, onLogout }) {
  const [open, setOpen] = useState(false);
  const links = [
    { id: "home", label: "Accueil" },
    { id: "casino", label: "Casino" },
    { id: "promos", label: "Promotions" },
  ];
  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur bg-black/70 border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 text-gray-100">
          <button
            className="md:hidden h-10 w-10 rounded-xl border border-gray-800 grid place-items-center"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            ☰
          </button>
          <div onClick={() => navigate("home")} className="flex items-center gap-2 cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-400 to-purple-600 grid place-items-center text-black font-extrabold">
              CV
            </div>
            <div className="font-extrabold text-lg">Casino Vitrine</div>
          </div>
          <nav className="ml-6 hidden md:flex gap-2">
            {links.map((l) => (
              <Button key={l.id} variant={route === l.id ? "primary" : "ghost"} onClick={() => navigate(l.id)}>
                {l.label}
              </Button>
            ))}
          </nav>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            {session ? (
              <>
                <Badge>💰 <span className="text-yellow-400">{currency(session.balance)}</span></Badge>
                <Button variant="outline" onClick={() => navigate("dashboard")}>Tableau de bord</Button>
                <Button onClick={onLogout}>Déconnexion</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("login")}>Connexion</Button>
                <Button onClick={() => navigate("register")}>S'inscrire</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-black border-r border-gray-800 p-4 grid gap-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-yellow-400">Menu</div>
              <button className="h-9 w-9 rounded-xl border border-gray-800" onClick={() => setOpen(false)}>✕</button>
            </div>
            {links.map((l) => (
              <Button
                key={l.id}
                variant={route === l.id ? "primary" : "ghost"}
                className="justify-start"
                onClick={() => { navigate(l.id); setOpen(false); }}
              >
                {l.label}
              </Button>
            ))}
            <div className="border-t border-gray-800 pt-3 grid gap-2">
              {session ? (
                <>
                  <Badge>Solde: <span className="text-yellow-400">{currency(session.balance)}</span></Badge>
                  <Button variant="outline" onClick={() => { navigate("dashboard"); setOpen(false); }}>Tableau de bord</Button>
                  <Button onClick={() => { onLogout(); setOpen(false); }}>Déconnexion</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { navigate("login"); setOpen(false); }}>Connexion</Button>
                  <Button onClick={() => { navigate("register"); setOpen(false); }}>S'inscrire</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ onCta }) {
  return (
    <section className="relative overflow-hidden text-gray-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-black to-black" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16 grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
        <div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Bienvenue au{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-purple-600 bg-clip-text text-transparent">
              Casino Vitrine
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-300">
            Ambiance VIP, jackpots, et une expérience fluide sur tous vos appareils.
          </p>
          <div className="mt-5 sm:mt-6 flex gap-2 sm:gap-3">
            <Button onClick={onCta} className="flex-1 sm:flex-none">Commencer</Button>
            <Button variant="outline" onClick={() => window.scrollTo({ top: 900, behavior: "smooth" })} className="flex-1 sm:flex-none">
              Voir les jeux
            </Button>
          </div>
        </div>
        <Card className="p-0 overflow-hidden">
          <img src={placeholderImage("Casino")} alt="Aperçu" className="w-full object-cover aspect-[16/9]" />
        </Card>
      </div>
    </section>
  );
}

/* -------------- Catalogue -------------- */
function GamesGrid({ onPlay }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("pop");
  const games = useMemo(
    () =>
      GAMES.filter(
        (g) =>
          (cat === "pop" ? true : g.cat === cat) &&
          g.title.toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat]
  );
  return (
    <section id="games" className="mx-auto max-w-7xl px-4 py-8 sm:py-10 text-gray-100 pb-28 md:pb-10">
      <div className="flex flex-wrap items-end gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Catalogue</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c.id}
              variant={cat === c.id ? "primary" : "outline"}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="col-span-2 md:col-span-3 lg:col-span-4">
          <Input
            label="Rechercher un jeu"
            placeholder="Ex: Roulette, Fruits…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {games.map((g) => (
          <Card key={g.id} className="p-0 overflow-hidden group">
            <img
              src={g.image || placeholderImage(g.title)}
              alt={g.title}
              className="w-full object-cover aspect-[16/9]"
              onError={(e) => { e.currentTarget.src = placeholderImage(g.title); }}
            />
            <div className="p-3 sm:p-4 grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm sm:text-base">{g.title}</div>
                <Badge>{g.provider}</Badge>
              </div>
              <div className="text-[11px] sm:text-xs text-gray-400">RTP {g.rtp}% · Volatilité {g.volatility}</div>
              <div className="flex gap-2 mt-1">
                <Button onClick={() => onPlay(g)} className="flex-1">Jouer</Button>
                <Button variant="outline" className="flex-1" onClick={() => alert('Fiche jeu à venir')}>Détails</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* -------------- Promotions ------------- */
function PromotionsPage() {
  const promos = [
    { id: 1, title: "Bonus de bienvenue 100%", text: "Déposez maintenant et recevez le double." },
    { id: 2, title: "Tournois exclusifs", text: "Classements réguliers et récompenses généreuses." },
    { id: 3, title: "Cashback hebdomadaire", text: "5% de retour sur vos sessions." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10 grid gap-4 text-gray-100">
      <h2 className="text-xl sm:text-2xl font-bold">Promotions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {promos.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="text-lg font-semibold text-yellow-400">{p.title}</div>
            <p className="text-sm text-gray-300 mt-2">{p.text}</p>
            <Button className="mt-4 w-full" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>Déposer</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* -------------- Dashboard -------------- */
function Dashboard({ session, setSession }) {
  if (!session) return <Card className="text-gray-100 p-6">Veuillez vous connecter.</Card>;
  function claim() {
    const add = 100;
    const newSession = { ...session, balance: session.balance + add };
    setSession(newSession);
    saveSession(newSession);
  }
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10 grid gap-4 text-gray-100">
      <h2 className="text-xl sm:text-2xl font-bold">Tableau de bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-5 sm:p-6">
          <div className="text-sm text-gray-400">Solde</div>
          <div className="text-2xl font-extrabold text-yellow-400">
            {currency(session.balance)}
          </div>
          <Button className="mt-3 w-full" onClick={claim}>Réclamer +100</Button>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="text-sm text-gray-400">Compte</div>
          <div className="font-semibold break-words">{session.pseudo}</div>
          <div className="text-xs text-gray-400 break-words">{session.email}</div>
          <div className="text-xs text-gray-500 mt-2">
            Créé le {new Date(session.createdAt).toLocaleDateString()}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="text-sm text-gray-400">Actions</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline">Vérifier</Button>
            <Button variant="outline">Historique</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ------------ Page Dépôt Requis -------- */
function DepositRequired({ game, onBack, onDeposit, session }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) return setError("Entrez un montant valide.");
    onDeposit(val);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 text-gray-100">
      <Card className="p-6 grid gap-4">
        <div className="flex items-center gap-3">
          <img
            src={game?.image || placeholderImage(game?.title || "Jeu")}
            alt={game?.title}
            className="h-16 w-28 rounded-xl object-cover border border-gray-800"
          />
          <div>
            <div className="text-lg font-bold">Dépôt requis</div>
            <div className="text-sm text-gray-400">
              Vous ne pouvez pas jouer à <span className="font-semibold text-gray-200">{game?.title}</span> tant que vous n’avez pas effectué un dépôt.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-700/50 bg-yellow-500/10 p-4">
          <div className="font-semibold text-yellow-400">Bonus de bienvenue 100%</div>
          <div className="text-sm text-gray-300">Votre premier dépôt est <span className="font-semibold text-yellow-300">doublé</span> automatiquement.</div>
        </div>

        <form onSubmit={submit} className="grid gap-3">
          <Input
            label="Montant du dépôt (€)"
            type="number"
            min="1"
            step="1"
            placeholder="Ex: 50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit">Déposer et jouer</Button>
            <Button variant="outline" type="button" onClick={onBack}>Retour</Button>
          </div>
          <div className="text-xs text-gray-500">
            Solde actuel: <span className="text-yellow-400">{currency(session?.balance ?? 0)}</span>
          </div>
        </form>
      </Card>
    </section>
  );
}

/* ---------------- Footer --------------- */
function Footer({ navigate }) {
  const links = [
    { id: "promos", label: "Promotions" },
    { id: "casino", label: "Jeux" },
    { id: "home", label: "Accueil" },
  ];
  return (
    <>
      <footer className="hidden md:block mt-10 border-t border-gray-800 bg-black text-gray-400">
        <div className="mx-auto max-w-7xl px-4 py-8 grid gap-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-yellow-400">Casino Vitrine</span>
            <div className="flex gap-3">
              {links.map((l) => (
                <Button key={l.id} variant="ghost" className="text-gray-400 hover:text-yellow-400" onClick={() => navigate(l.id)}>
                  {l.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Casino Vitrine</p>
        </div>
      </footer>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-black/90 backdrop-blur">
        <div className="mx-auto max-w-7xl grid grid-cols-3 text-center text-sm text-gray-300">
          <button className="py-3" onClick={() => navigate("home")}>Accueil</button>
          <button className="py-3" onClick={() => navigate("casino")}>Jeux</button>
          <button className="py-3" onClick={() => navigate("promos")}>Promos</button>
        </div>
        <div className="pb-[max(env(safe-area-inset-bottom),0px)]" />
      </nav>
    </>
  );
}

/* ---------------- Modales -------------- */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-0 sm:p-4 bg-black/60" role="dialog" aria-modal="true">
      <div className="w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl border border-gray-800 shadow-2xl bg-gradient-to-b from-gray-900 to-black text-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="font-bold text-lg">{title}</div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-gray-800 grid place-items-center">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function GameModal({ open, onClose, game }) {
  if (!open || !game) return null;
  return (
    <Modal open={open} onClose={onClose} title={game.title}>
      <div className="grid md:grid-cols-2 gap-4">
        <img
          src={game.image || placeholderImage(game.title)}
          alt={game.title}
          className="w-full rounded-2xl border border-gray-800"
          onError={(e) => { e.currentTarget.src = placeholderImage(game.title); }}
        />
        <div className="grid gap-2 text-gray-200">
          <div className="text-sm text-gray-400">Fournisseur: {game.provider}</div>
          <div className="text-sm text-gray-400">RTP: {game.rtp}%</div>
          <div className="text-sm text-gray-400">Volatilité: {game.volatility}</div>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => alert("Lancement du jeu")}>Jouer</Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ------------- Cookie banner ----------- */
function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const c = localStorage.getItem(LS.cookies);
    if (!c) setVisible(true);
  }, []);
  if (!visible) return null;
  function accept() {
    localStorage.setItem(LS.cookies, JSON.stringify({ essential: true, at: nowIso() }));
    setVisible(false);
  }
  return (
    <div className="fixed bottom-3 inset-x-3 z-50">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-800 shadow-lg p-4 bg-black text-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="text-sm flex-1">
            Nous utilisons des cookies essentiels pour améliorer votre expérience.
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1" onClick={() => setVisible(false)}>Refuser</Button>
            <Button className="flex-1" onClick={accept}>Accepter</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Auth ---------------- */
function LoginView({ onDone, goRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    const users = loadUsers();
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) return setError("Identifiants invalides");
    const s = { uid: u.id, email: u.email, pseudo: u.pseudo, balance: u.balance ?? 0, createdAt: nowIso(), hasDeposit: !!u.hasDeposit };
    saveSession(s);
    onDone(s);
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      <Input label="Email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <div className="text-sm text-red-400">{error}</div>}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Button type="submit">Connexion</Button>
        <Button variant="outline" onClick={goRegister}>Créer un compte</Button>
      </div>
    </form>
  );
}

function RegisterView({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      return setError("Email et mot de passe sont requis.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError("Email invalide.");
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      return setError("Un compte existe déjà avec cet email.");
    }

    const user = {
      id: uid(),
      email,
      password,
      pseudo: (pseudo || email.split("@")[0]).trim(),
      balance: 0,
      hasDeposit: false,
      createdAt: nowIso(),
    };

    users.push(user);
    if (!saveUsers(users)) {
      return setError("Impossible d'enregistrer le compte (stockage bloqué). Désactive le mode privé et réessaie.");
    }

    const session = {
      uid: user.id,
      email: user.email,
      pseudo: user.pseudo,
      balance: user.balance,
      hasDeposit: false,
      createdAt: nowIso(),
    };

    if (!saveSession(session)) {
      return setError("Compte créé, mais session non sauvegardée (stockage bloqué). Connecte-toi à nouveau.");
    }

    onDone(session);
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Input
        label="Pseudo"
        placeholder="Votre pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
      />
      <Input
        label="Email"
        type="email"
        placeholder="vous@exemple.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-sm text-red-400">{error}</div>}
      <div className="mt-2">
        <Button type="submit" className="w-full">Créer le compte</Button>
      </div>
    </form>
  );
}

/* ----------------- App ----------------- */
export default function CasinoDemo() {
  const [route, setRoute] = useState("home");
  const [session, _setSession] = useState(null);
  const [game, setGame] = useState(null);
  const [pendingGame, setPendingGame] = useState(null); // jeu cliqué en attente de dépôt

  // Thème sombre par défaut
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.classList.add("bg-black", "text-gray-100");
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (s) _setSession(s);
  }, []);

  function navigate(r) { setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function onLogout() { _setSession(null); saveSession(null); navigate("home"); }
  function onLoginDone(s) { _setSession(s); navigate("home"); }

  function handlePlay(g) {
    if (!session) {
      setRoute("login");
      return;
    }
    if (!session.hasDeposit) {
      setPendingGame(g);
      setRoute("deposit");
      return;
    }
    setGame(g);
  }

  function applyDeposit(amount) {
    if (!session) return;
    const bonus = amount; // 100% bonus
    const newBalance = (session.balance ?? 0) + amount + bonus;
    const updated = { ...session, balance: newBalance, hasDeposit: true, lastDepositAt: nowIso() };
    _setSession(updated);
    saveSession(updated);
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === session.uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], balance: newBalance, hasDeposit: true };
      saveUsers(users);
    }
    setRoute("casino");
    if (pendingGame) setGame(pendingGame);
    setPendingGame(null);
  }

  const authOpen = route === "login" || route === "register";

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Header navigate={navigate} route={route} session={session} onLogout={onLogout} />

      {route === "home" && (
        <>
          <Hero onCta={() => navigate(session ? "casino" : "register")} />
          <GamesGrid onPlay={handlePlay} />
          <PromotionsPage />
        </>
      )}

      {route === "casino" && <GamesGrid onPlay={handlePlay} />}
      {route === "promos" && <PromotionsPage />}
      {route === "dashboard" && <Dashboard session={session} setSession={(s)=>{ _setSession(s); saveSession(s); }} />}

      {route === "deposit" && (
        <DepositRequired
          game={pendingGame}
          session={session}
          onBack={() => navigate("casino")}
          onDeposit={applyDeposit}
        />
      )}

      <Footer navigate={navigate} />

      {/* Auth modals */}
      <Modal open={authOpen} onClose={() => navigate("home")} title={route === "register" ? "Créer un compte" : "Connexion"}>
        {route === "register" ? (
          <RegisterView onDone={onLoginDone} />
        ) : (
          <LoginView onDone={onLoginDone} goRegister={() => navigate("register")} />
        )}
      </Modal>

      {/* Game modal */}
      <GameModal open={!!game} onClose={() => setGame(null)} game={game} />

      {/* Cookies */}
      <CookieBanner />
    </div>
  );
}
