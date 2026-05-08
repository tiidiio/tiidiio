# 🎮 223-CRASH - Architecture de Jeu SmarSoft Gaming

## 📋 Vue d'ensemble du projet

**223-Crash** est un jeu d'aviation crash-style inspiré de **JetX** par SmarSoft Gaming, où les joueurs misent sur la trajectoire ascendante d'un multiplicateur avant un crash aléatoire.

---

## 🏗️ Architecture Système

```
┌─────────────────────────────────────────────────────────┐
│                    223-CRASH PLATFORM                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   FRONTEND   │◄────────►│   BACKEND    │             │
│  │   (Client)   │ Socket.IO│   (Server)   │             │
│  └──────────────┘         └──────────────┘             │
│        │                         │                       │
│        │                         ├─► Game Engine        │
│        │                         ├─► Anti-Cheat         │
│        ▼                         ├─► Database (MongoDB) │
│   ┌─────────────┐                ├─► Rate Limiting      │
│   │ UI/UX       │                └─► Security (Helmet)  │
│   │ WebGL       │                                       │
│   │ Animation   │           ┌──────────────┐            │
│   └─────────────┘           │   DATABASE   │            │
│                              │   (MongoDB)  │            │
│                              └──────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Schéma de Flux du Jeu

```
╔═══════════════════════════════════════════════════════════════════╗
║                    CYCLE DE JEU 223-CRASH                        ║
╚═══════════════════════════════════════════════════════════════════╝

┌─────────────────┐
│   IDLE STATE    │ (Attente de mises)
│   Multiplicateur│
│      = 1.00x    │
└────────┬────────┘
         │
         │ Joueur mise
         │
         ▼
┌──────────────────────────┐
│   BET PLACEMENT          │  ◄─── Socket: "bet"
│   - Validation montant   │  
│   - Anti-cheat check     │  ─────► Socket: "betAccepted"
│   - Balance control      │
└────────┬─────────────────┘
         │
         │ Tous prêts
         │
         ▼
┌──────────────────────────┐
│   ROUND STARTS           │
│   - Multiplier = 1.00x   │  ◄─── Socket: "start"
│   - Plane take-off       │
│   - Cloud animation      │
└────────┬─────────────────┘
         │
         │ Chaque 50ms
         │
         ▼
    ┌─────────────────────────────────────┐
    │   ASCENDING PHASE                   │
    │   Multiplier *= 1.015 (1.5% growth) │  ◄─── Socket: "multiplier"
    │   - Plane trajectory UP             │
    │   - Visual feedback                 │
    │   - Player can CASHOUT anytime      │
    │   - Sound effects                   │
    └────────┬────────────────────────────┘
             │
             │ Deux cas:
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐      ┌────────────────┐
│  CASHOUT │      │  CRASH EVENT   │
│ Joueur   │      │ Multiplicateur │
│ gagne    │      │ atteint crash  │
│          │      │ point          │
└─────┬────┘      └────────┬───────┘
      │                    │
      │ Socket:            │ Socket:
      │ "cashout"          │ "crash"
      │                    │
      ▼                    ▼
┌──────────────────────────────────┐
│  ROUND END                       │
│  - Calculate winnings/losses     │
│  - Update balance                │
│  - Show history                  │
└────────┬─────────────────────────┘
         │
         │ Attendre 3s
         │
         ▼
┌─────────────────┐
│   NEW ROUND     │
│   (retour IDLE) │
└─────────────────┘
```

---

## ✈️ Trajectoire du JetX - Schéma Visuel

```
                    CRASH POINT ❌
                        ^
                        │
                  45.2x  │  ░░░░░░░░░░░░░░░
                        │  ░ DANGER ZONE  ░
                  35.8x  │  ░░░░░░░░░░░░░░░
                        │
                  25.4x  │     ✈️ (28.5x)
                        │    /
                  15.2x  │   /
                        │  /    ← Trajectoire ascendante
                        │ /       (multiplier * 1.015)
                   8.3x  │/
                        │
                   3.2x  │ 💰 (Joueur cashout)
                        │ ✈️
                   1.0x  └──────────────────────────
                        0s  2s  4s  6s  8s  10s  12s
                             TEMPS (secondes)
```

---

## 🎨 Positionnement Visuel (Pixel Art)

### Avion (Plane Animation)

```
Position initiale:
  bottom: 20px
  left: 20px
  
Transformation au multiplicateur:
  transform: translate(
    ${multiplier * 8}px,    ← Mouvement horizontal
    -${multiplier * 6}px    ← Mouvement vertical (haut)
  )

Exemple:
  1.0x → translate(8px, -6px)
  5.0x → translate(40px, -30px)
  20.0x → translate(160px, -120px)
```

### Affichage Multiplicateur

```
┌─────────────────────────────────┐
│  Glow Effect + Pulse Animation  │
│                                 │
│         ���� 28.5x                │
│                                 │
│  Text-Shadow:                  │
│  • #00ffcc (Cyan glow)         │
│  • Scale: 1.05 at peak         │
│  • Pulse duration: 1.5s        │
└─────────────────────────────────┘
```

---

## 💾 Architecture Base de Données

```
┌────────────────────────────────────────────┐
│           USERS Collection                 │
├────────────────────────────────────────────┤
│ _id: ObjectId                              │
│ username: String                           │
│ email: String                              │
│ balance: Number                            │
│ totalWins: Number                          │
│ totalLosses: Number                        │
│ winRate: Float (%)                         │
│ createdAt: Timestamp                       │
│ lastLogin: Timestamp                       │
└──────────────────────────────────────────��─┘

┌────────────────────────────────────────────┐
│        GAME_ROUNDS Collection              │
├────────────────────────────────────────────┤
│ _id: ObjectId                              │
│ roundId: String (Unique)                   │
│ crashPoint: Float (1.00 - 100.00)         │
│ startTime: Timestamp                       │
│ endTime: Timestamp                         │
│ players: [                                 │
│   {                                        │
│     userId: String,                        │
│     bet: Number,                           │
│     cashedOutAt: Float | null,            │
│     winAmount: Number | null,             │
│     status: "won" | "crashed" | "pending"│
│   }                                        │
│ ]                                          │
│ duration: Number (ms)                      │
└────────────────────────────────────────────┘

┌──────────────────────���─────────────────────┐
│        TRANSACTIONS Collection             │
├────────────────────────────────────────────┤
│ _id: ObjectId                              │
│ userId: String                             │
│ type: "bet" | "win" | "deposit"           │
│ amount: Number                             │
│ roundId: String (ref)                      │
│ timestamp: Timestamp                       │
│ status: "completed" | "pending"           │
└────────────────────────────────────────────┘
```

---

## 🔐 Système Anti-Cheat

```
┌──────────────────────────────────────────┐
│      ANTI-CHEAT SECURITY LAYERS          │
├──────────────────────────────────────────┤
│                                          │
│ 1️⃣ RATE LIMITING                        │
│   • Max 20 requêtes/seconde              │
│   • Min 300ms entre actions              │
│   • IP-based blocking                    │
│                                          │
│ 2️⃣ VALIDATIONS                          │
│   • Montant misé: 0 < bet ≤ 100,000    │
│   • Multiplicateur: 1.00 ≤ mult ≤ 100  │
│   • Balance suffisante                   │
│   • Timestamp verifications              │
│                                          │
│ 3️⃣ SERVER-SIDE CRASH POINT              │
│   • Généré côté serveur (non-visible)   │
│   • Math.random() * 5 + 1               │
│   • Impossible à prédire                │
│   • Immutable pendant la manche         │
│                                          │
│ 4️⃣ ENCRYPTION & TOKENS                  │
│   • JWT pour sessions                    │
│   • Socket.IO verification               │
│   • CORS restrictive                     │
│   • Helmet security headers              │
│                                          │
│ 5️⃣ LOGGING & MONITORING                 │
│   • Tous les crashes enregistrés         │
│   • Patterns d'anomalies                 │
│   • Alerts automatiques                  │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🌐 Stack Technologique

```
FRONTEND:
├─ HTML5 (Semantic)
├─ CSS3 (Animations, Gradients, Filters)
├─ Vanilla JavaScript (ES6+)
├─ Socket.IO Client
└─ WebGL (optionnel pour 3D)

BACKEND:
├─ Node.js (Runtime)
├─ Express.js (Framework HTTP)
├─ Socket.IO (WebSocket)
├─ Mongoose (ODM MongoDB)
├─ JWT (Authentication)
├─ bcryptjs (Password hashing)
├─ Helmet (Security headers)
├─ express-rate-limit (Rate limiting)
└─ CORS (Cross-origin)

DATABASE:
├─ MongoDB Atlas (Cloud)
├─ Collections: users, rounds, transactions
└─ Indexes: userId, roundId, timestamps

DEPLOYMENT:
├─ Frontend: Vercel / Netlify
├─ Backend: Render / Heroku / Railway
└─ Database: MongoDB Atlas (SaaS)
```

---

## 📊 Statistiques & Métriques

```
┌─────────────────────────────────────────┐
│         PLAYER STATISTICS               │
├─────────────────────────────────────────┤
│                                         │
│ Total Balance:      💰 523,450 XOF     │
│ Current Bet:        💸 50,000 XOF      │
│                                         │
│ Session Stats:                          │
│ ├─ Wins:            ✅ 12 rounds       │
│ ├─ Losses:          ❌ 8 rounds        │
│ ├─ Win Rate:        ⭐ 60%             │
│ ├─ Total Wagered:   📊 450,000 XOF    │
│ ├─ Total Won:       💰 789,000 XOF    │
│ └─ Net Profit:      📈 +245,000 XOF   │
│                                         │
│ Best Cashout:       🏆 45.2x           │
│ Average Multiplier: 📉 8.7x            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Flow Socket.IO

```
CLIENT                              SERVER
  │                                   │
  ├──────── connect ───────────────►  │
  │                                   │
  │  ◄──────── "start" ──────────────┤
  │  (Round begins)                   │
  │                                   │
  ├──────── "bet" ─────────────────►  │
  │  {userId, bet}                    │
  │                                   │ (Validation)
  │  ◄──── "betAccepted" ────────────┤
  │                                   │
  │  ◄──── "multiplier" ────────────┤ (Every 50ms)
  │  1.01x, 1.02x, 1.03x...         │
  │                                   │
  │  ├──────► "cashout" ────────────► │
  │  │ {userId, multiplier}          │ (Player action)
  │  │                                │
  │  │       ◄──── "win" ────────────┤
  │  │       {amount, balance}        │
  │  │                                │
  │  └──────┐                         │
  │         │                         │
  │  (OR)   │                         │
  │         │                         │
  │         └──► "crash" ────────────┤ (Auto event)
  │             {crashPoint}          │
  │                                   │
  │  ◄────── "crash" ────────────────┤
  │  (35.5x - Player lost)            │
  │                                   │
  │  ◄──────── pause 3s ─────────────┤
  │                                   │
  └──────────────► Next round ◄──────┘
```

---

## 🎯 Gameplay Loop Détaillé

```
MINUTE 1:
├─ 0:00 - Server calcule crash point: 23.5x
├─ 0:01 - Socket emit "start"
├─ 0:05 - Joueur 1 mise 5,000 XOF
├─ 0:08 - Joueur 2 mise 20,000 XOF
├─ 0:10 - Round lock (pas de nouvelles mises)
│
MINUTE 2 - ASCENDING PHASE:
├─ 0:50 - Multiplier: 1.50x (Joueur 2 regarde)
├─ 1:30 - Multiplier: 5.23x (Intéressant...)
├─ 2:10 - Multiplier: 12.8x (Tension!)
├─ 2:45 - Multiplier: 18.3x (Joueur 1 prépare cashout)
├─ 3:00 - Multiplier: 20.1x (Joueur 1 clique CASHOUT)
│         → Gagne: 5,000 × 20.1 = 100,500 XOF ✅
│
├─ 3:05 - Multiplier: 22.8x (Joueur 2 toujours dedans)
├─ 3:15 - Multiplier: 23.4x (Très proche du crash!)
├─ 3:16 - 💥 CRASH à 23.5x
│         → Joueur 2 perd 20,000 XOF ❌
│
└─ 3:20 - Serveur calcule nouveau crash point
```

---

## 🎨 UI/UX Layout

```
┌─────────────────────────────────────┐
│  📍 TICKER (Scrolling Banner)       │ ← Fixed Top
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │   🎮 GAME BOX (Main Area)     │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │                    28.5x 📊 │  │ ← Multiplicateur
│  │  │     PLANE AREA          │  │  │
│  │  │                         │  │  │
│  │  │        ☁️  ☁️  ☁️       │  │  │
│  │  │    ✈️                   │  │  │
│  │  │                         │  │  │
│  │  │     ░░░░░░░░░░░░░░░░   │  │  │ ← History bar
│  │  │     3.2x 5.1x 8.7x...  │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │ ┌─────────────────────────┐   │  │
│  │ │ Input: [50000] XOF      │   │  │
│  │ │ [5K] [20K] [70K]        │   │  │
│  │ │ ┌─────────────────────┐ │   │  │
│  │ │ │ ► MISER             │ │   │  │ ← Main Button
│  │ │ └─────────────────────┘ │   │  │
│  │ └─────────────────────────┘   │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌──────────┐  ┌──────────────┐   │
│  │ 👥 Joueurs│ │ 📁 Historique│   │
│  │ • Alice   │  │ Round #1234  │   │
│  │ • Bob     │  │ • Crash: 15x │   │
│  │ • Carol   │  │ • Win: 28.5x │   │
│  └──────────┘  └──────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 Déploiement & Infrastructure

```
┌─────────────────────────────────────────────┐
│          INFRASTRUCTURE DIAGRAM             │
├─────────────────────────────────────────────┤
│                                             │
│  CDN / Static Hosting                       │
│  ├─ Vercel (Frontend)                       │
│  └─ CloudFlare (Cache)                      │
│           ▲                                 │
│           │                                 │
│  ┌────────┴────────────────────┐            │
│  │   Application Server         │            │
│  │   (Render / Railway)         │            │
│  │                              │            │
│  │  Node.js + Express + Socket  │            │
│  │  Rate Limiter + Helmet       │            │
│  └────────┬────────────────────┘            │
│           │                                 │
│           ▼                                 │
│  ┌─────────────────────────────┐            │
│  │  Database Tier              │            │
│  │  MongoDB Atlas              │            │
│  │  (Replica Set)              │            │
│  │  • Backups Auto             │            │
│  │  • Encryption TLS           │            │
│  │  • VPC Peering              │            │
│  └─────────────────────────────┘            │
│           ▲                                 │
│           │                                 │
│  ┌────────┴─────────────────────┐           │
│  │   Monitoring & Logging       │           │
│  │   • Sentry (Error tracking)  │           │
│  │   • LogRocket (Session replay)           │
│  │   • DataDog (Infrastructure)            │
│  └──────────────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📈 Roadmap Futur

```
v1.0 (ACTUEL):
✅ Basic game mechanics
✅ Single player
✅ Real-time multiplier
✅ Basic UI

v1.1 (COURT TERME):
⏳ Multiplayer spectators
⏳ Leaderboard
⏳ Sound effects
⏳ Mobile responsive

v1.2 (MOYEN TERME):
📋 Tournois
📋 Chat in-game
📋 Achievements/Badges
📋 Multi-langue (FR, EN, AR)

v2.0 (LONG TERME):
🎯 API publique
🎯 Intégrations paiement (Orange Money, Wave)
🎯 Live streaming
🎯 AI opponents
```

---

## 📞 Support & Documentation

- **GitHub**: https://github.com/tiidiio/tiidiio
- **Email**: tidiane.s.diallo@gmail.com
- **Phone**: +223 70 56 05 15

---

**Créé par Tidio le Génie** 🚀
**Inspiré de JetX - SmarSoft Gaming**
**Année 2026**
