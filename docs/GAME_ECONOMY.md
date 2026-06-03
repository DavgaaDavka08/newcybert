# CyberPhysics — Game Economy Design v2.0

**Role:** Senior Game Economy + UX  
**Principle:** Education first, game second. No XP inflation. Coins are scarce and valuable.

---

## 1. Design pillars

| Pillar | Rule |
|--------|------|
| XP | Skill-based, capped per day, never purchasable |
| Coins | Scarce utility currency; primary monetization lever |
| Lives | Soft gate on map practice; regen + coin heal |
| Streak | Daily habit, coin milestones (not XP flood) |
| Premium | Convenience + access, not pay-to-win |
| Badges | Mastery identity per physics branch |

---

## 2. XP rewards (conservative)

### 2.1 Lesson / Map subtopic (Давталт)

| Action | XP | Notes |
|--------|-----|--------|
| Open & start lesson | +3 | Once per subtopic (first attempt) |
| Complete lesson (pass ≥60%) | +5 | Once per subtopic |
| Perfect (100% correct) | +5 | Bonus on top of complete |
| **Max per subtopic** | **13** | 3+5+5 |
| Full topic (all subtopics) | +15 | One-time topic bonus |

**Example:** 10 subtopics in Electricity → ~130 XP + 15 topic = **145 XP** (weeks of work, not one session).

### 2.2 Video lesson

| Action | XP |
|--------|-----|
| Watch ≥50% | +2 |
| Watch 100% | +3 (additional) |
| Pass post-video quiz | +8 |
| **Max per video** | **13** |

No coins from videos (unlock costs coins).

### 2.3 Practice exam (Шалгалт)

| Score | XP |
|-------|-----|
| Submitted (any) | +2 |
| ≥50% | +3 |
| ≥80% | +5 |
| **Max** | **10** |

Coins: ≥80% → +1, 100% → +2 (once per attempt).

### 2.4 EYESH mock (ЭЕШ)

| Score | XP |
|-------|-----|
| Submitted | +5 |
| ≥50% | +5 |
| ≥80% | +10 |
| ≥95% | +10 |
| **Max** | **30** |

Coins: ≥80% → +2, ≥95% → +3, 100% → +5. **One full reward per calendar day** (anti-farm).

### 2.5 Daily / weekly quests (XP only)

| Quest | XP |
|-------|-----|
| Daily: 1 video | +3 |
| Daily: 1 exam | +3 |
| Daily: 1 map lesson | +5 |
| Daily all complete | +5 XP |
| Weekly: 5 lessons | +20 |
| Weekly: 2 exams | +15 |
| Monthly: 20 lessons | +50 |

---

## 3. Level system (1 → 50)

Total XP thresholds (cumulative). Early levels fast for onboarding; L30+ is long-term mastery.

| Level | Total XP | Δ to next |
|-------|----------|-----------|
| 1 | 0 | 100 |
| 2 | 100 | 150 |
| 3 | 250 | 250 |
| 4 | 500 | 300 |
| 5 | 800 | 400 |
| 6 | 1,200 | 500 |
| 7 | 1,700 | 700 |
| 8 | 2,300 | 600 |
| 9 | 3,000 | 1,000 |
| 10 | 4,000 | 880 |
| 15 | ~9,200 | ~1,200 avg |
| 20 | 16,400 | ~1,400 avg |
| 25 | ~25,400 | — |
| 30 | 38,000 | ~1,800 avg |
| 40 | ~72,000 | — |
| 50 | 133,650 | — |

Implementation: `LEVEL_XP_THRESHOLDS` in `src/lib/gamification.ts` (generated curve).

### Level-up rewards (coins + badges)

| Level | Reward |
|-------|--------|
| 2 | +2 coins |
| 5 | Badge: `first_steps` |
| 10 | +5 coins |
| 15 | Badge: `physics_rising` |
| 20 | +8 coins |
| 25 | Badge: `dedicated_learner` |
| 30 | +10 coins |
| 40 | Badge: `physics_master` |
| 50 | Badge: `cyber_legend` + 25 coins |

---

## 4. Coin system

### 4.1 Earning (rare)

| Source | Coins |
|--------|-------|
| Daily login | +1 |
| 3-day streak (milestone) | +3 that day |
| 7-day streak | +10 |
| 30-day streak | +50 |
| Subtopic first clear | +1 |
| Topic 100% | +3 |
| Exam ≥80% | +1 |
| Exam 100% | +2 |
| EES ≥80% | +2 |
| EES ≥95% | +3 |
| EES 100% | +5 |
| First EES ever | +5 (one-time) |
| Weekly challenge | +5 |
| Daily all quests | +2 |
| Level milestones | See §3 |

### 4.2 Spending

| Action | Cost |
|--------|------|
| Video unlock | 5 |
| AI explanation | 4 |
| Hint / solution step | 1 |
| Practice exam retake | 3 |
| EES retake | 5 |
| Full heal (5 lives) | 8 |
| PDF download | 10 |

### 4.3 Monthly economy (active student)

**Income (~55 coins/month):**  
20 lessons ×1 + 10 exams ×1 + 5 EES ×2 + streak ~15 + weekly ~5 ≈ **55**

**Spend (~70 coins/month):**  
10 videos ×5 + 5 AI ×4 + 3 heals ×8 ≈ **74**

**Deficit ~15/month** → Premium or 50-coin pack (~5000₮). **Intentional.**

---

## 5. Life system

| Rule | Value |
|------|--------|
| Max lives | 5 |
| Regen | +1 every 30 min (when &lt;5) |
| Map wrong answer | −1 life |
| Premium | No life loss on map; unlimited lives display |
| Full heal | 8 coins → 5 lives |

Lives apply to **Physics Map practice** only, not exams/EES.

---

## 6. Badges (topic mastery)

Branches: Mechanics, Electricity, Heat, Optics, Waves, Modern Physics.

| Tier | Requirement |
|------|-------------|
| Bronze | 50% subtopics in branch |
| Silver | 80% subtopics |
| Gold | 100% subtopics |
| Platinum | 100% + avg 3★ on branch exams |

IDs: `{branch}_bronze`, `{branch}_silver`, etc.

---

## 7. Daily / weekly / monthly engagement

### Daily quests
1. Watch 1 video (≥50%) — 3 XP  
2. Complete 1 exam — 3 XP  
3. Complete 1 map lesson — 5 XP  
**All three:** +2 coins

### Weekly quests
1. Complete 5 map lessons — 20 XP + 5 coins  
2. Complete 2 exams — 15 XP  

### Monthly quests
1. Complete 20 lessons — 50 XP + 10 coins  
2. Maintain 20-day streak in month — 30 XP + 15 coins  

---

## 8. Premium tiers

| Feature | Basic (free) | Premium Cap | Premium Pro |
|---------|--------------|-------------|-------------|
| Map lives | 5 + regen | Unlimited | Unlimited |
| Life loss | Yes | No | No |
| Daily free video | 1 | All | All |
| Daily free exam | 1 | All | All |
| AI explanations | Coin / limited | 10/day free | Unlimited |
| EES retakes | Coin | 2/day free | Unlimited |
| XP multiplier | 1× | 1× (no pay XP) | 1× |
| Ads | Optional | None | None |
| Badges | Yes | Yes + frame | Yes + frame |
| Coin shop | Yes | −15% cost | −25% cost |

**No XP or coin sales for progression** — only convenience and access.

---

## 9. Economy check

### 9.1 XP per day (estimates)

| Profile | XP/day |
|---------|--------|
| Light (10 min) | 10–15 |
| Active (30 min) | 25–40 |
| Hardcore (60+ min) | 50–70 |

### 9.2 Coins per month

| Profile | Coins/month |
|---------|-------------|
| Light | 20–30 |
| Active | 50–60 |
| Hardcore | 80–100 (still spend-limited) |

### 9.3 Time to reach levels (@ 35 XP/day)

| Level | Total XP | ~Days |
|-------|----------|-------|
| 10 | 4,000 | 115 |
| 20 | 16,400 | 469 |
| 30 | 38,000 | 1,086 |
| 50 | 133,650 | 3,819 |

@ 50 XP/day: L10 ≈ 80 days, L20 ≈ 328 days.

### 9.4 Abuse / exploit risks

| Risk | Mitigation |
|------|------------|
| Replay lessons for XP | First-clear only on subtopic XP/coins |
| EES spam | 1 reward per day per user |
| Check-in alt accounts | 1 reward/day; device/email limits (ops) |
| Coin negative via API | Server validates balance |
| Premium + coin heal loop | Heal priced above lesson coin income |
| Session XP desync | `ensureLevelSynced()` on `/api/user/stats` |

### 9.5 Implementation map

| File | Purpose |
|------|---------|
| `src/lib/gamification.ts` | All constants & calculators |
| `src/lib/gamification-server.ts` | DB sync, quests, achievements |
| `src/app/api/game/subtopic-complete` | Map lesson rewards |
| `src/app/api/exam/attempts/submit` | Exam rewards |
| `src/app/api/ees/complete` | EES rewards |
| `src/app/api/user/checkin` | Streak coins |
| `src/app/api/user/spend-coins` | Coin costs |
| `docs/GAME_ECONOMY.md` | This document |

---

## 10. UX guidelines (HUD)

- Show: **Level**, **XP in level bar**, **coins**, **lives**, **streak** — numbers only.
- Hide: long hint text on game map (tooltips on hover optional).
- Top bar: `Lv.N · Total XP` — level always from `calcLevel(xp)`, never stale DB field.

---

*Version 2.0 — aligned with `gamification.ts` implementation.*
