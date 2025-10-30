# Sprint 9 — Planning (Starting 19 Sep 2025)

**Sprint Goal:** Deliver the full reporting/export package and handover documentation so the client can review Sprint 9 outputs without blocking on us, and ship the required submission artefacts on time.

## Must-Have (Commit)
1. **Exports bundle**
   - Generate the three CSV exports from the latest database snapshot, mirroring the column order and naming from the five client reference files.
   - Surface exports in the UI with download links and sanity checks (row counts, date ranges) before final packaging.
   - *Owners:* Yun Chen (data extraction & scripts), Nemo (FE wiring/UX polish).
2. **Report suite**
   - Finalise the backend query tweaks for Report #1 so it reflects the corrected aggregations (Xiang).
   - Produce the updated *Marketing Consolidation* report with the new breakdowns/visuals (Ian).
   - Complete the *Examiner Evaluation Trend* analysis, including the trend scoring logic and narrative summary (Haocheng).
   - Cross-review all three reports for consistency (Ian + Haocheng).
3. **Submission logistics**
   - Compile and upload the Endeavour submission ZIP plus the team video link before the university deadline (Nemo).
   - Email the client/mentor with the Sprint 9 package (reports, exports, submission artefacts) and highlight any known caveats (Ian).

## Should-Have (Stretch)
- **System regression sweep:** Run through the full user story checklist (beyond the four focus features) and log any gaps/bugs to Haocheng for triage.
- **Handover documentation refresh:** Expand the deployment/runbook doc, add the dual environment (DEV box + local) usage guide, and align the wiki to the Jira handover format (Nemo, with Ian for review).

## Acceptance Criteria (Samples)
- Each export CSV matches the client’s template headers, row counts are recorded in the release notes, and downloads succeed from the staging UI.
- The report suite covers Marketing, Milestone/Outcome, and Examiner Trend views with data pulled from the 5 supplied files; peer review sign-off is captured in the planning notes.
- Examiner trend scoring explains the trend formula and highlights any outliers in the narrative section.
- Deployment/handover documentation describes both dev-box and local run flows, including required credentials, environment variables, and the packaging steps for the local-friendly bundle.
- Endeavour submission confirmation (screenshot or receipt) and client email are stored in the shared drive.

## Risks & Mitigations
- **Spec ambiguity on exports/reports** → Align column/metric definitions against the client’s five reference files; flag any deviances in Slack before development.
- **Late-breaking regressions** → Daily smoke checklist across major user stories; escalate blockers immediately for fix/no-go decision.
- **Documentation bandwidth** → Pair Nemo with Yunpeng for structure/content; Ian to review early to avoid last-minute churn.

## Owners (High Level)
- **Backend/Data:** Yun Chen (exports), Xiang Wang (report backend fixes), Haocheng “Caspar” Li (examiner trend analysis).
- **Frontend & Submission:** Yunpeng “Nemo” Xiong (exports UI, wiki/deployment doc, submission packaging).
- **PO/Docs:** Ian Chi (marketing consolidation report, client communications, overall QA sign-off).
- **QA Sweep:** Whole team, with bugs funnelled to Haocheng for prioritisation.
