# Sprint 6 Retrospective (22–29 Aug 2025)

## What Went Well
- **Fast FE iteration**: Criteria editor came together quickly with a cohesive UI.
- **Responsive BE support**: Endpoint semantics clarified (POST + status), enabling cleaner filtering.
- **Live integration culture**: Opening a DEV backend during the call helped surface issues early.

## What Didn’t Go Well
- **Branch conflicts** slowed velocity; overlapping changes to criteria/display caused rework.
- **API drift & gaps** (title vs description, active‑only default) created hidden bugs on FE.
- **Search architecture** was initially front‑end only; pagination forced a late redesign.

## What We Learned
- Define **API contracts first** (even a lightweight doc) before FE work on data‑heavy tables.
- Keep **components modular**; avoid monolithic pages and global CSS hacks.
- Adopt a **push→test→integrate** loop with Testing owning API‑doc conformance checks.

## Action Items
| Action | Owner | Due |
|---|---|---|
| Pair‑merge FE branches; adopt feature folders and smaller PRs | Tianyun, Yongchun; FE lead support | 30 Aug |
| Publish/update EP5 API contract (status, search, pagination) | Yongchun (BE), Haocheng (FE) | 30 Aug |
| Implement server‑side search end‑to‑end (FE + BE) | FE: Tianyun/Yukun; BE: Yongchun | 31 Aug |
| CSV import persistence + return summary contract | Yunpeng, Dongqiao | 1 Sep |
| Invitation email endpoint + templates; FE trigger | Yunpeng, Yongchun; FE: Tianyun | 2 Sep |
| Add `title` to level model (or confirm merge with description) | Backend team | 3 Sep |
| Daily DEV smoke deploy + test checklist | Testing (Benyuan) | Daily |

## Team Health (1–5)
- Collaboration: **4**
- Scope clarity: **3**
- Tooling/DevEx: **3**
- Confidence for client demo: **3.5**
