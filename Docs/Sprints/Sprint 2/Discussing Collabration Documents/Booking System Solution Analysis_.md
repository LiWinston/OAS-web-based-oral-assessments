# **Comparative Analysis of Booking System Solutions for the University of Melbourne Oral Assessment System (OAS) Project**

## **1\. Introduction**

**1.1 Purpose**

This report presents an updated, comprehensive comparative analysis to guide the selection of the most suitable booking system solution for the University of Melbourne's Oral Assessment System (OAS) project. The analysis evaluates options including third-party Software-as-a-Service (SaaS) Application Programming Interfaces (APIs), self-hosted Free and Open Source Software (FOSS) solutions, and in-house development.

**1.2 Project Background**

The Oral Assessment System (OAS) is envisioned as a web-based platform designed to streamline the management of oral assessments at the University of Melbourne. Key stakeholders include students undertaking assessments, examiners conducting them, and administrators overseeing the process. A critical component of the OAS is the booking system, which must integrate with the University's existing Canvas Learning Management System (LMS) via Comma-Separated Value (CSV) file exchange.

The core functional requirements for the OAS booking system remain consistent:

* **Administrator Slot Definition:** Administrators must be able to define available assessment time slots, potentially specifying associated resources or parameters.  
* **Student Booking & Rescheduling:** Students (individually or as pre-defined groups) must be able to view available slots, book appointments, and reschedule existing bookings within defined rules.  
* **Examiner Self-Assignment:** Examiners should have a mechanism to view scheduled sessions and assign themselves to specific slots or sessions, potentially based on availability or qualifications.  
* **Concurrency Handling:** The system must reliably handle simultaneous booking attempts to prevent double-booking or over-allocation of slots/resources.1  
* **Data Linking:** Booking data must be linkable to relevant student, examiner, and assessment data within the OAS.  
* **Notifications:** Desirable features include automated email or other notifications for confirmations, reminders, and cancellations.

## **2\. Evaluation of Commercial Scheduling Tools (Paid Tiers)**

The following commercial scheduling tools were previously considered but largely discounted due to the now-removed constraint against subscription fees. This section re-evaluates their suitability based on their paid offerings, with a specific focus on API capabilities and features relevant to the OAS requirements.

**2.1 Calendly**

Calendly is a widely recognized scheduling automation platform known for its user-friendly interface.

* **OAS Feature Fulfillment:**  
  * *Group Booking:* Calendly supports multi-participant scheduling through its "group" event type, available on paid plans (Standard or Teams).12 The free plan is restricted to one active event type and only supports one-on-one meetings.14 Paid plans offer unlimited event types.15  
  * *Examiner Assignment:* The Teams plan ($16/seat/month, with volume discounts 15) includes Round Robin event distribution.16 This feature automatically assigns meetings to team members based on availability or other rules. While this could potentially be adapted for distributing sessions among examiners, it does not appear to support the explicit assignment of a specific examiner (resource) to a pre-defined slot by an administrator or the examiner themselves. Direct investigation of API capabilities for programmatic user assignment to specific event instances would be required.  
  * *Other Requirements:* Calendly supports connecting multiple calendars for availability checking 16, customizable booking links 16, automated email/SMS reminders and follow-ups (on paid plans) 16, and integrations with video conferencing tools (e.g., Zoom, Google Meet).16  
* **API Quality & Scope:**  
  * Calendly provides a REST-based API (v2) using JSON, along with webhooks for event notifications. API access likely requires a paid subscription.17 Documentation is available.  
  * **Critical Limitation:** A significant drawback identified in multiple sources, including recent community discussions (Jan 2025), is that the Calendly API **does not support the programmatic creation or scheduling of events**. The official recommendation is to use embed options or generate single-use scheduling links. This fundamentally limits the potential for deep integration, as OAS would likely need to create and manage booking slots and appointments via API based on its internal logic and data (e.g., assessment schedules, examiner availability from university systems). While webhooks allow OAS to *receive* data about bookings made *within* Calendly, they do not enable OAS to *initiate* or control the booking creation process programmatically.  
  * Rate limits apply to the API. Paid tiers currently have a limit of 500 requests per token per minute, while stricter limits (10 requests/minute) are planned for the free tier.19  
* **Scalability/Performance:** As a mature SaaS platform used by millions, including large enterprises 18, Calendly's infrastructure is presumably scalable and performant, although specific metrics are not provided in the reviewed materials.  
* **Pricing Model:** A free tier exists but is highly limited (1 event type, 1 calendar connection, no group events).14 Paid plans are per-seat: Standard ($10/seat/mo annually), Teams ($16/seat/mo annually, with volume discounts for \>30 seats 15).16 An Enterprise plan is available starting at $15k/year.17 API usage likely necessitates a paid plan.17  
* **Pros & Cons (OAS Context):**  
  * *Pros:* Highly user-friendly interface, widespread adoption, good basic scheduling features on paid tiers (group events, reminders, calendar sync), established platform reliability.  
  * *Cons:* **Fundamental API limitation preventing programmatic event creation is a major barrier for deep integration.** Per-seat pricing model could become costly for a large number of examiners/admins. Round Robin feature may not adequately address examiner assignment needs. Free tier is insufficient for OAS requirements.  
* **Assessment:** The inability to create or schedule events via the API severely restricts Calendly's suitability for the OAS project if deep, programmatic integration is required. OAS would be forced into using embedded UIs or managing scheduling links, placing the core scheduling logic within Calendly rather than allowing OAS to control it based on university-specific data and workflows. This limitation likely makes Calendly a poor fit, regardless of its paid features.

**2.2 Acuity Scheduling (Squarespace)**

Acuity Scheduling, now part of Squarespace, offers a feature-rich scheduling platform often used by service-based businesses.

* **OAS Feature Fulfillment:**  
  * *Group Booking:* Supports group scheduling for classes or workshops. This capability likely requires the "Growing" plan ($27/mo annually) or higher, as the entry-level "Emerging" plan seems more limited.21  
  * *Examiner Assignment:* Supports multiple staff members or locations, each with their own bookable calendar.12 The "Growing" plan supports up to 6 calendars, "Powerhouse" ($49/mo annually) supports up to 36, and "Enterprise" supports unlimited calendars.22 This structure could potentially map examiners to these calendars. However, whether the API allows programmatic assignment of specific appointments to specific staff/calendars needs verification.  
  * *Other Requirements:* Offers calendar synchronization, customizable email and SMS reminders (SMS requires Growing plan+) 24, online payments and deposits 24, customizable intake forms, and HIPAA compliance options via a Business Associate Agreement (BAA) on the Powerhouse plan.24  
* **API Quality & Scope:**  
  * API access is explicitly gated behind the higher-tier plans: **Powerhouse ($49/mo annually) or Enterprise**. The Enterprise plan mentions "Additional APIs" 22, suggesting potentially different levels of access.  
  * The specific capabilities of the API (e.g., endpoints for creating/managing slots, assigning bookings to specific staff/calendars programmatically) are not detailed in the reviewed materials and require examination of the official API documentation for the Powerhouse/Enterprise tiers. Custom CSS is also available at this level.22 No mention of webhooks was found in the provided snippets.  
* **Scalability/Performance:** As a cloud-based SaaS solution integrated with Squarespace, Acuity is likely designed for scalability, although specific performance benchmarks are unavailable.  
* **Pricing Model:** Acuity does not offer a free plan, only a 7-day free trial.22 Paid plans (billed annually) are Emerging ($16/mo), Growing ($27/mo), and Powerhouse ($49/mo). Monthly billing is available at higher rates.22 API access necessitates at least the Powerhouse plan. An Enterprise plan with custom pricing is also available.23  
* **Pros & Cons (OAS Context):**  
  * *Pros:* Comprehensive feature set relevant to OAS (group booking, multiple staff/calendars, reminders, payments, intake forms), HIPAA compliance option available, integration with Squarespace ecosystem.  
  * *Cons:* **API access requires the expensive Powerhouse plan ($49/mo+).** No free tier for extended evaluation. The precise capabilities of the API for programmatic control need confirmation. Potential for vendor lock-in.  
* **Assessment:** The requirement of the Powerhouse plan ($49/mo annually) just to gain API access is a significant cost barrier. This pricing strategy positions API usage as an advanced, enterprise-level feature. Before considering Acuity, the University must rigorously verify that the API provided under the Powerhouse or Enterprise tiers offers the necessary programmatic control over booking creation, slot management, and potentially examiner/resource assignment to justify the investment. If the API proves limited despite the cost, Acuity would not be a suitable integration partner.

**2.3 Doodle**

Doodle is well-known for its polling feature to find suitable meeting times among groups, but it also offers booking pages.

* **OAS Feature Fulfillment:**  
  * *Group Booking:* Doodle's core strength is group polls for asynchronous availability coordination.25 It also offers Booking Pages (primarily for 1:1 scheduling) and Sign-up Sheets.27 The free plan allows group polls (limited to 20 time slots 25) and one Booking Page.25 Paid plans remove these limits.25 Sign-up Sheets might be adaptable for group sessions.  
  * *Examiner Assignment:* There is no explicit mention of features for assigning specific resources or examiners to time slots. The platform's focus is on participant availability polling or simple 1:1 bookings via Booking Pages.  
  * *Other Requirements:* Paid plans offer calendar synchronization, automated reminders, custom branding, and integrations (Zoom, Teams, Zapier, etc.).25 Customizable questions can be added to bookings on paid plans.25  
* **API Quality & Scope:**  
  * An API is available for paid subscribers.26 Doodle grants a license to use the API for subscribers.28  
  * The scope and capabilities of the API are unclear from the provided snippets. It needs investigation whether it supports programmatic creation and management of pre-defined appointment slots and bookings, or if it's primarily focused on managing polls and booking page interactions. Given Doodle's core functionality, the API might be limited in ways relevant to OAS.  
* **Scalability/Performance:** As a widely used SaaS platform 26, Doodle likely offers adequate scalability, but specifics are not detailed.  
* **Pricing Model:** A free plan exists but includes advertisements and has significant limitations (e.g., only one 1:1 booking page, 20 time slots per poll).20 The Professional plan for a single user is $14.95/month (monthly) or $83.40/year ($6.95/mo equivalent).27 The Team plan starts at $8.95/user/month (annually, min 2 users).27 API access requires a paid subscription.28  
* **Pros & Cons (OAS Context):**  
  * *Pros:* Excellent for finding common availability via polling, simple user interface, free tier for basic polling.  
  * *Cons:* Core polling functionality does not align well with the OAS need for pre-defined, bookable slots. API capabilities for programmatic booking/slot management are uncertain and potentially limited. Lacks clear features for resource/examiner assignment. Ad-supported free plan is unprofessional for university use.20  
* **Assessment:** Doodle's primary design centers around polling for availability, which is fundamentally different from the OAS requirement of administrators defining slots for students to book. While Booking Pages exist, the platform appears less suited for the structured, resource-aware scheduling needed by OAS compared to other dedicated booking systems. The uncertainty around the API's capabilities for programmatic control further weakens its candidacy.

**2.4 WCOnline**

WCOnline is specifically designed as a scheduling and record-keeping platform for academic support centers, such as writing or tutoring centers.

* **OAS Feature Fulfillment:**  
  * *Target Audience:* Tailored for university environments, particularly tutoring and support centers.30  
  * *Group Booking:* Supports configuration for group meetings or workshops.31 A single subscription can manage multiple schedules/centers on one campus.30  
  * *Examiner Assignment:* Allows setting up profiles for staff/tutors, defining their availability, and assigning them to specific schedules.30 This could potentially model examiners and their availability. Administrators can manage schedules and users.30  
  * *Other Requirements:* Includes features like student data tracking (CRM-like functionality) 31, reporting capabilities 31, automated notifications and reminders 31, customizable registration and appointment forms 30, SAML Single Sign-On (SSO) integration 31, and can be adapted for booking resources like rooms or equipment.31  
* **API Quality & Scope:**  
  * WCOnline provides an HTTP-based API primarily for **data retrieval**.32  
  * **Severe Limitations:** The API appears to be **read-only**, focused on downloading existing appointment data.32 It has strict usage limits: data can only be fetched one day at a time, and calls are restricted to 10 per hour.32 Authentication uses a time-sensitive MD5 hash mechanism involving the client's IP address.32 There is no indication in the reviewed materials of any API capability for programmatically creating, updating, or managing appointments or slots.  
* **Scalability/Performance:** SaaS platform widely used by educational institutions.30 Scalability seems oriented towards typical academic center usage patterns. Performance details are not specified.  
* **Pricing Model:** Offers a simple, flat-rate subscription: $1,999 per year or $200 per month.33 This fee is all-inclusive, covering unlimited users (students, staff, admins), support, and updates.33 A 30-day free trial is available.33 The license typically covers unlimited centers within a single geographic campus, although some global settings are shared across all schedules under one subscription.30 *Note: An older source 30 mentioned lower pricing ($800/year), but the more recent sources 33 state $1,999/year, which should be considered current.*  
* **Pros & Cons (OAS Context):**  
  * *Pros:* Predictable flat-rate pricing potentially cost-effective for broad university use. Designed specifically for academic environments. Supports multiple schedules, staff roles, and SSO.  
  * *Cons:* **The API is extremely limited (read-only, heavily rate-limited, daily data fetch)**, making it unsuitable for the programmatic integration likely required by OAS. Feature set may be overly tailored to tutoring centers. Shared global settings could pose challenges if used for diverse assessment types under one subscription.  
* **Assessment:** Despite its attractive flat-rate pricing and focus on the academic sector, WCOnline's severely limited, read-only API 32 makes it inappropriate as an integrated booking *engine* for the OAS project. OAS likely requires the ability to programmatically create and manage booking slots and appointments, which the WCOnline API does not appear to support. It functions more as a standalone system with basic data export functionality.

## **3\. Analysis of Additional Paid Scheduling API Solutions(Additional from preliminary Research Plan)**

Given the limitations found in some re-evaluated tools and the lifting of cost constraints, this section explores other prominent commercial scheduling APIs potentially suitable for enterprise or university deployment.

**3.1 Nylas**

Nylas provides unified APIs for integrating email, calendar, and contact functionalities into applications.

* **OAS Feature Fulfillment:**  
  * *Core Offering:* The Nylas Calendar API provides programmatic access to calendar data across major providers like Google and Microsoft. It supports full Create, Read, Update, Delete (CRUD) operations for calendar events, enabling OAS to manage bookings programmatically.  
  * *Group Booking/Resource Assignment:* Features include checking free/busy availability, round-robin routing, and potentially managing rooms and resources. The API's CRUD capabilities suggest potential for assigning specific users (examiners) or resources to events programmatically, though the exact mechanism needs verification in their documentation. Nylas offers "Virtual Calendars," allowing scheduling functionality without requiring end-users (like students) to connect their personal calendar accounts, which could be highly relevant for OAS.  
  * *Other Requirements:* Supports real-time bi-directional synchronization, webhook notifications for calendar events, automatic time zone detection, and provides embeddable UI components (Nylas Scheduler) if needed. Emphasizes security and offers options like HIPAA compliance and data residency controls.  
* **API Quality & Scope:**  
  * Nylas is fundamentally an API-first platform. The Calendar API appears robust, offering full CRUD.  
  * Provides Software Development Kits (SDKs) for various languages, comprehensive documentation, and webhooks. Claims significant development time savings (up to 40x) compared to building individual integrations.  
* **Scalability/Performance:** Designed for developers building scalable applications. Claims high reliability with 99.9% historical uptime and processes large data volumes (34.5B+ daily API transactions mentioned).  
* **Pricing Model:** Pricing is primarily based on the number of "connected accounts" (CAs) per month, defined as an email address associated with an account connected to Nylas. Tiered plans (Entry, Core, Plus) offer different features and volume discounts. For example, the Core Platform plan at 50,000+ CAs costs $1.20/CA/month when billed annually. Calendar-only plans are available at a lower cost (e.g., Entry Calendar at $0.40/CA/month annually). A minimum of 5 accounts applies to pay-as-you-go plans. A free trial is offered.  
  * *Cost Implication:* The definition of a "connected account" is critical for OAS. If every student and examiner interacting with the system needs to be a paid CA by connecting their university calendar, the cost could be substantial. However, if OAS can leverage the API using a limited number of service accounts or "Virtual Calendars" to manage scheduling centrally without requiring individual user connections, the cost model might be viable. This requires clarification based on Nylas's specific terms for API-driven scheduling versus user-synced scheduling.  
* **Pros & Cons (OAS Context):**  
  * *Pros:* Strong API-first approach with full CRUD for calendar events. Unifies access across different calendar providers (Google, Microsoft). Provides SDKs, webhooks, and potentially UI components. Scalable platform with a focus on security and reliability (HIPAA option). Virtual Calendars could avoid mass user connections.  
  * *Cons:* Pricing model based on connected accounts needs careful evaluation for the OAS use case to determine actual cost. May offer more features (Email/Contacts API) than strictly needed for OAS booking. Requires technical expertise for API integration.  
* **Assessment:** Nylas presents a strong technical option due to its robust, CRUD-enabled Calendar API. It appears well-suited for building a deeply integrated booking system where OAS maintains programmatic control. The key uncertainty lies in the pricing model and how "connected accounts" are counted in an API-driven scenario using potentially Virtual Calendars. If the cost model is manageable under this scenario, Nylas is a leading commercial API contender.

**3.2 Cronofy**

Cronofy specializes in providing enterprise-grade calendar connectivity and scheduling APIs.

* **OAS Feature Fulfillment:**  
  * *Core Offering:* Provides a Calendar API focused on two-way synchronization and scheduling automation. Supports real-time availability queries.  
  * *Group Booking/Resource Assignment:* Supports multi-person availability queries and scheduling. Explicitly mentions features for managing "Meeting rooms" and offers "Application Calendars", suggesting capabilities for resource management. "Enterprise Connect" allows organization-level calendar connections. The API likely allows programmatic assignment, but specifics require documentation review.  
  * *Other Requirements:* Offers real-time calendar sync, webhook notifications, integration with conferencing tools, and handles time zones. Strong focus on enterprise security and compliance (HIPAA, ISO27001 certified). Provides embeddable UI elements (Embedded Scheduler).  
* **API Quality & Scope:**  
  * Cronofy is an API-centric platform targeting developers and product teams. Offers comprehensive API documentation and references. Supports unlimited API calls on paid plans. Provides white-label API endpoints and UI elements.  
  * SDKs are available (NodeJS mentioned 35). Webhooks provide real-time notifications.  
* **Scalability/Performance:** Positioned for enterprise use. Guarantees 99.99% uptime. Offers a choice of global data centers for hosting.  
* **Pricing Model:** Cronofy's API pricing is tiered (Emerging, Growth, Strategic) and based on bundled usage quotas for several metrics: Synced Accounts, Smart Invites, Application Calendars, and Active Embedded Scheduler Accounts.  
  * The entry-level "Emerging" plan starts at **$819 per month** (billed monthly), which includes base quotas (e.g., 1,000 Synced Accounts, 1,000 Application Calendars). Overage charges apply for exceeding these quotas (e.g., $0.69/Synced Account/mo, $0.14/Application Calendar/mo on Emerging). Annual billing offers a 10% discount.  
  * A separate product, "Scheduler for Recruiters," has per-active-user pricing ($15/user/mo), but the core API seems tied to the more expensive, volume-based plans. A free trial is available.  
  * *Cost Implication:* The high entry price ($819/mo) makes Cronofy a significant investment. Similar to Nylas, the cost-effectiveness for OAS depends critically on how usage maps to Cronofy's specific metrics. If OAS can operate primarily using "Application Calendars" managed via the API (representing examiners/resources) and stay within or slightly exceed the base quotas, the cost might be justifiable for an enterprise solution. However, if large numbers of "Synced Accounts" (individual user calendar connections) are required, the cost could escalate rapidly.  
* **Pros & Cons (OAS Context):**  
  * *Pros:* API-first platform designed for enterprise scheduling needs. Robust feature set including availability, conferencing, and likely resource management (Application Calendars, Meeting Rooms). Strong security and compliance posture (HIPAA, ISO). High uptime guarantee. White-label options.  
  * *Cons:* **High entry price point ($819/mo) for API plans.** Complex pricing model based on multiple usage metrics requires careful estimation. Need to verify API specifics for examiner assignment logic.  
* **Assessment:** Cronofy offers a powerful and enterprise-ready API solution, potentially well-suited technically for OAS's integration needs. Its features like Application Calendars and Meeting Rooms seem promising for resource management. However, the substantial starting cost ($819/mo) is a major consideration. A detailed cost analysis based on projected OAS usage against Cronofy's specific metrics (Synced Accounts vs. Application Calendars etc.) is essential to determine its financial viability compared to alternatives.

**3.3 Appointy (Enterprise)**

Appointy offers enterprise-level scheduling solutions, emphasizing customization and integration.

* **OAS Feature Fulfillment:**  
  * *Focus:* Provides "tailor-made" online scheduling software for medium and large organizations. Emphasizes custom workflows and features built on a modular architecture.  
  * *Group Booking/Resource Assignment:* Explicitly mentions managing employee and resource scheduling. Given the custom nature, it's highly likely that specific group booking logic and complex examiner/resource assignment rules can be implemented.  
  * *Other Requirements:* Supports integrations with existing IT infrastructure (ERP, CRM), payment gateways, calendars, video conferencing, and SSO (SAML, OpenID, etc.). Offers reporting and analytics capabilities. Provides security and compliance options (ISO 27001 certified, GDPR, HIPAA option).  
* **API Quality & Scope:**  
  * Promotes "advanced API capabilities" for seamless integration with internal and third-party systems.  
  * The exact nature and documentation of the standard API are not detailed in snippets; engagement likely involves custom API development or configuration as part of the solution design.  
* **Scalability/Performance:** Offers flexible hosting options, including **on-premise** deployment within the organization's data centers or private cloud hosting on dedicated servers. This allows for greater control over scalability and performance, potentially meeting specific university requirements. Can provide uptime SLAs. Designed for enterprise scale.  
* **Pricing Model:** Pricing is bespoke and requires contacting their sales team. The process involves distinct phases: consultation, design, development, testing, training, deployment, and maintenance/support. This indicates a custom solution development model, likely involving significant upfront and potentially ongoing costs, far exceeding standard SaaS pricing.  
* **Pros & Cons (OAS Context):**  
  * *Pros:* **Highest potential for customization** to meet unique OAS requirements precisely. Option for **on-premise or private cloud hosting**, offering maximum data control and potentially satisfying specific university policies. Strong integration capabilities (API, SSO). Enterprise focus with security/compliance options.  
  * *Cons:* **Likely very high cost** (both initial and potentially ongoing) due to the custom development model. **Longer implementation timeline** compared to off-the-shelf SaaS or FOSS. Less pricing transparency. Potential complexity in managing a custom-built solution, even if based on their platform.  
* **Assessment:** Appointy Enterprise represents a different approach – essentially commissioning a custom booking system built using their platform components and expertise. This offers unparalleled flexibility and the significant advantage of potential on-premise hosting. However, it comes at a likely substantial cost and requires a more involved project engagement similar to full in-house development. This path is only justifiable if OAS has highly specific, complex requirements that cannot be met by configurable SaaS APIs or customizable FOSS solutions, and if the budget and timeline accommodate a custom build. The data control offered by on-premise hosting might be a strong driver for a university.

**3.4 Other Potential Candidates**

Brief research identified other platforms with scheduling or API capabilities, but they appear less directly suitable for the core OAS booking engine needs:

* **Salesforce Scheduler:** Primarily designed for integration within the Salesforce CRM ecosystem. Likely requires significant Salesforce investment and may not be ideal as a standalone booking engine for OAS unless the university heavily uses Salesforce for related functions.  
* **JAMS Scheduler:** Focuses on enterprise IT workload automation and job scheduling, rather than appointment booking. Its REST API is geared towards managing automated jobs, not user-facing appointment slots.  
* **Adobe API Management (ColdFusion):** A platform for *managing* APIs, not a scheduling application itself. ColdFusion could be used to *build* a booking system, but that falls under in-house development.  
* **DaySchedule:** Offers scheduling software with an API.36 Provides SDKs (Node.js mentioned) and various endpoints for managing resources, bookings, schedules, etc..36 Pricing seems user/feature-based.37 Might be a smaller player compared to Nylas/Cronofy but potentially offers relevant API functionality. Requires deeper investigation if top contenders prove unsuitable.  
* **Spurwing:** Positions itself as an "API for appointment scheduling," similar to Nylas/Cronofy.38 Focuses on providing robust API infrastructure to build scheduling features, addressing complexities like integrations, syncing, and time zones.38 Offers open-source examples.38 Pricing not detailed in snippets. Worth considering as another API-first alternative if needed.

## **4\. Deepened Analysis of Cal.com (Self-Hosted FOSS)**

Cal.com emerged as a strong FOSS candidate in previous analysis. This section provides a more detailed assessment, focusing on its technical underpinnings, community health, feature alignment, and the critical implications of its AGPLv3 license.

**4.1 Project Health & Community Assessment (GitHub Repository Analysis)**

* **Activity:** The Cal.com GitHub repository 39 shows significant activity, indicative of a healthy and actively maintained open-source project. Frequent commits, numerous contributors, active issue tracking, and ongoing pull requests suggest the project is evolving rapidly and is responsive to bugs and feature requests. Recent version releases (v4.5 40, v5.1 41) introduce performance improvements and new features, demonstrating continued development momentum.  
* **Community Support:** Cal.com benefits from a vibrant community. Engagement is visible through GitHub issues and discussions 39, positive reviews on platforms like Product Hunt 42, and active discussions on forums like Reddit.43 The project actively promotes its open-source nature and seems responsive to community feedback. This strong community is a valuable asset for a self-hosted solution, providing a resource for troubleshooting and shared knowledge beyond official documentation.45  
* **Documentation Quality:** Official documentation exists covering self-hosting installation, API usage 47, and development.52 Community guides, such as for Go integration 53, supplement official resources. The documentation appears reasonably comprehensive, covering setup, API reference, and core concepts, which is crucial for successful adoption and integration.

**4.2 Implementation Details & Feature Alignment**

* **Technology Stack:** Cal.com is built on a modern JavaScript stack: Next.js (React framework), tRPC (for API communication), Prisma (ORM for database access), Tailwind CSS (styling), and PostgreSQL (database).39 This requires specific technical expertise within the university for self-hosting and potential customization, namely Node.js (version \>=18.x required) and PostgreSQL (version \>=13.x required).  
* **Group Booking ("Booking Seats"):** Cal.com directly supports group bookings through its "Booking Seats" feature.54 This allows administrators to define a capacity for each time slot, enabling multiple participants (e.g., students in a group assessment) to book the same slot until the limit is reached. The interface can optionally display the number of remaining seats.55 This feature appears to align well with the OAS requirement for group assessments.  
* **Examiner Assignment (Roles/Permissions):**  
  * Cal.com includes a "Teams" feature. Within a team, users can be assigned roles: Member, Admin, or Owner. Admins and Owners have elevated privileges for managing team settings, members, and event types.  
  * Team event types like Round Robin (distributing bookings among members) and Collective (requiring multiple specific members) are supported. Round Robin logic includes fairness considerations and configurable reset intervals (daily/monthly).41  
  * **Limitation:** The current role system (Member/Admin/Owner) is quite basic. There is community interest (via GitHub issues) in more granular permissions, such as restricting members from editing their own availability or creating event types, and adding admin-only (non-bookable) roles, but these are not yet implemented. There is no specific "Examiner" role out-of-the-box.  
  * *Applicability to OAS:* Examiners could be modeled as team members. Simple Round Robin might suffice for basic load balancing, but complex assignment logic (e.g., based on specific qualifications, matching examiners to student groups, examiner self-selection for specific slots) would likely require custom development using the API to manage team memberships or booking assignments. The lack of fine-grained built-in permissions means administrators would have broad control, or custom controls would need to be built into OAS itself, interacting via the API.  
* **Concurrency Control:** The platform needs to handle simultaneous booking attempts reliably. While specific database locking mechanisms aren't detailed in the snippets, Cal.com uses Prisma with PostgreSQL 39, which supports standard transaction management and locking techniques to prevent race conditions. Recent releases mention performance improvements related to booking queries and large team events 40, suggesting ongoing work in this area. Robustness under high concurrent load typical of university-wide assessments would need verification through testing, but the underlying technology stack is capable. General challenges in database concurrency control are well-documented.1  
* **Other Features:** Cal.com offers a rich feature set including automated workflows (for reminders/notifications) 57, payment integration (Stripe) 59, customizable booking questions 57, multiple availability schedules per user 61, a comprehensive API and webhooks 39, embeddable booking widgets 59, and a native video conferencing option.57 High degree of customization is a core aspect.45

**4.3 API & Scalability Assessment (Refined)**

* **API Scope & Quality:** Cal.com is designed with an API-first approach.39 It offers comprehensive REST APIs (v1 and v2) covering core entities like bookings, event types, users, teams, availability schedules, webhooks, and more.47 Platform-specific APIs exist for managing organizations and users in multi-tenant setups.47 Documentation is readily available 47 and the API supports standard authentication methods (API keys, OAuth).47 Webhooks are available for key booking events (created, rescheduled, cancelled, etc.).51  
* **Integration Ease:** The API-driven architecture and available documentation facilitate integration.39 Being open source allows developers to inspect the API code directly if needed.  
* **Scalability:** As a self-hosted application, Cal.com's scalability is primarily determined by the underlying infrastructure provisioned and managed by the University (server resources, database configuration, potential load balancing).13 The Node.js and PostgreSQL stack is inherently scalable.39 Cal.com developers have reported performance optimizations for scenarios involving large numbers of users or complex queries 40, indicating attention to scalability concerns. Achieving high scalability in production requires appropriate infrastructure planning and potentially ongoing performance tuning by university staff.

**4.4 AGPLv3 License Implications in University Context**

* **License Overview:** Cal.com is licensed under the GNU Affero General Public License version 3 (AGPLv3).39 This is a strong copyleft license, similar to GPLv3 but with an additional clause triggered by network interaction.64 Specifically, AGPLv3 section 13 requires that if you modify the licensed program and run it on a server, you must provide users interacting with it remotely over a network the opportunity to receive the Corresponding Source code of your modified version.  
* **Scenario 1: API Integration Only (OAS interacts with an unmodified, self-hosted Cal.com instance via API):**  
  * In this scenario, the University is using the Cal.com software as-is, without modifying its source code. OAS acts as a client application communicating with the Cal.com API.  
  * The AGPLv3 obligations primarily fall on the *provider* of the (potentially modified) network service. Since Cal.com itself is unmodified, the University is simply running the original AGPLv3 software. The network interaction clause (s13) compels the operator of a *modified* version to offer source to network users.  
  * It is generally understood that merely interacting with an AGPLv3 service via its API does not make the *client* application (OAS) a derivative work, nor does it typically obligate the client application's source code to be released under AGPLv3. The obligation is tied to modifying and offering the AGPLv3 program itself as a service.  
  * *Risk Assessment:* The risk of being required to release the OAS source code under AGPLv3 in this API-only integration scenario is generally considered low. However, formal legal counsel review is essential to confirm this interpretation within the University's risk tolerance.  
* **Scenario 2: Modifying Self-Hosted Cal.com Code:**  
  * If the University modifies the Cal.com source code itself (e.g., to add custom features directly into Cal.com, alter core logic, or change the UI beyond standard configuration/theming) and makes this modified version available over the network to users (students, examiners, admins), then AGPLv3 section 13 is clearly triggered.  
  * The University *must* provide a means for these users (anyone interacting with the modified Cal.com service remotely) to obtain the complete Corresponding Source code of the modified Cal.com version, under the terms of the AGPLv3. This includes the original Cal.com code plus all university modifications.  
  * *Risk Assessment:* There is a high degree of certainty that modifying Cal.com code and running it as a service internally triggers the source-sharing obligation for those modifications. The University must be prepared and willing to release these modifications publicly under the AGPLv3 license. This could conflict with internal intellectual property (IP) policies, security concerns about revealing custom logic, or future commercialization plans (however unlikely for an internal system).67 It also requires establishing a mechanism for providing the source code upon request.67  
* **Cal.com's Licensing Intent:** The Cal.com team explicitly stated they switched from the permissive MIT license to AGPLv3 to prevent third parties (especially large cloud providers) from taking the open-source code, modifying it, offering it as a commercial service, and not contributing improvements back to the community.64 This underscores the strong copyleft nature and the intent behind the network clause. They also offer a separate commercial Enterprise License for certain features (like SSO, SAML initially, though later open-sourced but under a different license/terms) and for organizations wanting different terms.64 This dual-licensing strategy itself highlights that AGPLv3 can be perceived as restrictive for certain organizational uses.  
* **University Context & Legal Review:** Given the potential implications, particularly if modifications are contemplated, a formal review by the University of Melbourne's legal counsel specializing in software licensing and IP is **mandatory**. Key questions for legal review include:  
  1. Confirmation of the interpretation that API-only interaction with an unmodified Cal.com instance does *not* create AGPLv3 obligations for the OAS source code.  
  2. Assessment of whether the source-sharing obligations triggered by *modifying* Cal.com are compatible with university IP policies and practices.67  
  3. Evaluation of the university's capacity and willingness to manage compliance with AGPLv3's source code provision requirements if modifications are made.70  
  4. Consideration of potential risks associated with relying on software under a license designed to prevent proprietary forks, even for internal use.  
* **Assessment:** The AGPLv3 license represents the most significant potential barrier to adopting Cal.com, particularly if the OAS project anticipates needing to modify the core Cal.com code. While API-only integration appears lower risk from a licensing perspective, this requires legal validation. If modifications are necessary to meet specific OAS requirements (e.g., complex examiner assignment logic not achievable via API orchestration), the University must be comfortable with the strong copyleft obligations of sharing those modifications.

**4.5 Self-Hosting Considerations**

* **Complexity:** Self-hosting Cal.com is a technically involved process compared to using a SaaS solution.45 It requires personnel skilled in Node.js, PostgreSQL administration, potentially Docker containerization, and general Linux server management. The setup involves multiple steps: cloning the repository, installing dependencies via yarn, configuring environment variables in a .env file (database connection, secrets, etc.), running database migrations using Prisma, and potentially configuring a web server (like Nginx or Apache) as a reverse proxy, managing SSL certificates, and setting up process management. While documentation and deployment options like Docker 39 or platform-specific guides (e.g., Vercel, AWS AMI) exist to aid this, it remains a task for experienced system administrators or DevOps engineers. Features requiring background tasks may also need cron job setup.  
* **Infrastructure Costs:** Running Cal.com requires dedicated server resources (CPU, RAM, disk space) and a PostgreSQL database instance. While the application itself might run on minimal hardware for light use, a production environment supporting potentially thousands of students and examiners during peak assessment periods will require appropriately scaled resources. Costs will vary depending on whether the University uses existing internal infrastructure, cloud providers (like AWS, Azure, GCP), or dedicated hosting. Basic VPS and managed PostgreSQL databases can start from relatively low monthly costs ($5-$20 range) 72, but university-level requirements for reliability, backups, and performance may necessitate more substantial (and costly) infrastructure.74  
* **Maintenance Costs:** This is a significant, often underestimated, component of TCO for self-hosted solutions.76 Ongoing tasks include: applying Cal.com updates (pulling new code, running database migrations, checking for breaking changes) 39, managing and patching the underlying operating system, Node.js runtime, and PostgreSQL database, performing regular data backups, monitoring system performance and uptime, and troubleshooting issues.78 This requires dedicated staff time and expertise. Industry benchmarks suggest ongoing maintenance can consume 15-25% of the *initial development cost* annually 76, and potentially much more over the software's lifecycle.77 While Cal.com itself doesn't have an initial development cost (being FOSS), the maintenance effort is comparable to maintaining a custom-built application.  
* **Pros & Cons (Self-Hosting Cal.com):**  
  * *Pros:* **Full control over data** (resides on university infrastructure), **no subscription fees** for core software features 60, **high potential for customization** (subject to AGPLv3 license terms), potential for lower TCO compared to high-tier SaaS *if* internal expertise and infrastructure are efficiently utilized.  
  * *Cons:* **Requires significant in-house technical expertise** (Node.js, Postgres, SysAdmin/DevOps). **Substantial ongoing maintenance effort and cost** (staff time). Responsibility for **security, uptime, backups, and performance** rests solely with the university. **AGPLv3 license complexity and potential obligations.** May still need paid support or enterprise features from Cal.com for specific needs.44 Setup complexity is non-trivial.  
* **Assessment:** The "free" nature of Cal.com's software license 60 must be balanced against the tangible costs of infrastructure and, more significantly, the staff time required for initial setup and ongoing maintenance.76 The technical complexity and the AGPLv3 license implications are major factors. Self-hosting Cal.com is a viable path only if the University possesses the necessary technical resources, is prepared for the continuous maintenance commitment, and finds the AGPLv3 license terms acceptable after legal review. It offers maximum control but shifts costs from subscriptions to operations.

## **5\. Updated Review of Other FOSS & In-House Options**

This section briefly revisits other FOSS alternatives and the in-house development option, considering their standing relative to the evaluated paid APIs and the detailed Cal.com analysis.

**5.1 Easy\!Appointments**

Easy\!Appointments is another established open-source scheduling application.

* **Features:** Provides core scheduling functionalities including appointment and customer management, definition of services and providers (which could potentially model resources/examiners 88), configurable working hours and booking rules, email notifications, and Google Calendar synchronization.90 It explicitly supports group sessions by allowing multiple attendant slots per appointment.93 It includes basic user roles (Customer, Provider, Secretary, Admin) with associated permissions.94 The interface is designed to be mobile-friendly.93  
* **API/Integration:** Offers a REST API covering core entities like appointments, customers, services, providers, settings, and webhooks.96 Webhooks are supported for notifying external systems about booking events.96 API documentation is available.96 Integration guides for platforms like Joomla exist 100, demonstrating extensibility. The API's completeness and quality for complex OAS integration needs would require verification.  
* **License:** Licensed under the GNU General Public License version 3 (GPLv3).90  
  * *Implications:* GPLv3's copyleft provisions generally require that if modified versions of the software are *distributed* to third parties, the source code of those modifications must also be made available under GPLv3.70 Critically, for software used internally within an organization (like the University) and not distributed externally, modifications generally do *not* need to be publicly released.105 This makes GPLv3 significantly less restrictive than AGPLv3 for internal network use cases involving modifications. However, compliance still requires careful management (e.g., proper notices, handling dependencies 104) and university legal counsel should review the terms.70 A potential complication noted in one discussion is whether modifications to bundled components with different licenses might trigger sharing 102, requiring clarification.  
* **Self-Hosting:** Requires a standard LAMP/LEMP stack: Apache or Nginx web server, PHP (version 8.2+ recommended for latest versions 90), and MySQL database.90 Installation follows typical PHP application procedures (copy files, configure database connection in config.php, run web installer).90 Hosting costs are expected to be comparable to other self-hosted PHP applications.75 Requires standard PHP/MySQL administration skills.  
* **Community/Support:** The project appears active, hosted on GitHub with a notable number of stars and forks.90 It has an official support group and uses GitHub issues for bug reports and feature requests.90 Community forums exist, though recent reports suggest potential issues with spam and potentially requiring payment for new registrations.112 Premium support, customization, installation, and upgrade services are offered commercially.91 While active, the community buzz might seem less prominent than Cal.com's in some channels.114  
* **Scalability/Performance:** Recent versions have focused on refactoring for better performance, stability, and scalability.117 As a PHP/MySQL application, scalability depends heavily on the hosting environment (server resources, database tuning, caching strategies). While likely sufficient for many use cases, achieving very high concurrency might require more optimization compared to architectures built on asynchronous frameworks like Node.js.118  
* **Updated Assessment:** Easy\!Appointments remains a strong FOSS contender, particularly attractive due to its GPLv3 license, which poses fewer hurdles for internal modification compared to Cal.com's AGPLv3. Its feature set, including group sessions and an API with webhooks, appears capable. The PHP/MySQL technology stack might align well with existing university infrastructure and expertise. Potential drawbacks include possibly less vibrant community support compared to Cal.com and potentially requiring more effort to scale under very high load. It stands as a key FOSS alternative to Cal.com.

**5.2 MRBS (Meeting Room Booking System)**

MRBS is a long-standing FOSS application primarily designed for booking shared resources like meeting rooms.

* **Features:** Core functionality revolves around booking rooms grouped by areas/buildings.123 Supports repeating bookings, different user authentication levels (read-only, user, admin) 123, and booking by fixed time slots or periods (suitable for schools).123 Can be used to book any type of resource, not just rooms.123 Basic customization through configuration files and potentially custom fields is possible.127 User roles appear limited to basic access control.125  
* **API/Integration:** **A major limitation is the lack of a built-in, modern REST API or webhooks.** Integration typically requires direct database interaction, custom PHP wrappers, or leveraging existing authentication modules (e.g., LDAP, AD, Drupal).127 This makes tight integration with a modern system like OAS complex and potentially fragile.  
* **License:** Licensed under the GNU GPL (likely v2 or later, specific version should be confirmed from the distribution).123  
  * *Implications:* Similar to GPLv3 used by Easy\!Appointments, the obligations are primarily triggered by external distribution of modified code.67 Internal use and modification generally do not require public source code release, posing less risk than AGPLv3 for the university. Legal review is still advisable.  
* **Self-Hosting:** Requires a standard PHP environment (check specific version compatibility, e.g., PHP 7.3/8.0 supported by recent versions 135) and a MySQL or PostgreSQL database.127 Installation involves configuring the web server, setting up the database schema (tables.\*.sql), and editing the config.inc.php file.127 Community Docker images might be available.71 Hosting costs are comparable to other self-hosted PHP applications.72  
* **Community/Support:** MRBS is a mature project with a long history.123 Development activity seems less intense than newer projects like Cal.com. Code and issue tracking are now on GitHub.123 SourceForge hosts mailing lists and historical support tickets.135 Community forums and blog posts discuss its use.139 Support appears to rely more on existing documentation and community knowledge rather than rapid developer iteration.  
* **Scalability/Performance:** While used in various organizations 123, its scalability depends on the hosting environment. Potential performance bottlenecks under high concurrency or with very large datasets might exist without careful database tuning and server optimization.11 Its architecture may be less optimized for high-performance scenarios compared to modern frameworks.  
* **Updated Assessment:** MRBS is significantly hampered by its **lack of a modern API**, making it a poor choice for a project requiring robust integration like OAS. While its GPL license is less restrictive than AGPLv3, the technical limitations in integration and potentially basic feature set compared to alternatives outweigh this advantage. It is less suitable than Cal.com or Easy\!Appointments for this project.

**5.3 In-House Development**

Building a custom booking system from scratch remains an option.

* **Features:** Offers complete control to implement features precisely matching all OAS requirements, including potentially unique or complex logic for examiner assignment, group booking rules, workflow integration, and a user interface tailored specifically for the University of Melbourne context.  
* **API/Integration:** The API would be designed and built internally, ensuring perfect alignment with OAS and other university systems. Canvas CSV integration would be a core development task.  
* **License:** The University would own the intellectual property, avoiding external licensing constraints and obligations entirely.  
* **Cost/Effort:**  
  * *Development:* This path incurs the **highest upfront cost and effort**. It requires significant investment in planning, requirements analysis 78, architecture design, UI/UX design, backend development (database, API, business logic), frontend development, and comprehensive testing.148 Building a robust booking system, especially handling concurrency correctly 1, is a complex undertaking.148 Accurate effort estimation is notoriously difficult, with projects often exceeding initial budgets and timelines.158 Costs can easily run into the tens or hundreds of thousands of dollars, potentially millions for complex systems.166  
  * *Maintenance:* Requires a **substantial ongoing commitment** of internal resources for bug fixing, implementing enhancements, security patching, adapting to evolving platform dependencies (OS, libraries, browsers), and user support.78 Maintenance costs are often underestimated and can represent a significant portion (15-25% or more annually) of the TCO, potentially exceeding the initial development cost over the system's lifetime.76  
* **Scalability/Performance:** The system's ability to scale and perform under load depends entirely on the quality of the in-house design, architecture, and implementation. Achieving high scalability and reliable concurrency handling requires significant engineering expertise.1  
* **Updated Assessment:** In-house development provides the ultimate flexibility and avoids licensing issues but carries the highest risk, cost (both upfront and ongoing maintenance), and time-to-delivery. The existence of mature commercial APIs (Nylas, Cronofy, potentially Appointy for custom builds) and feature-rich, customizable FOSS platforms (Cal.com, Easy\!Appointments) significantly raises the bar for justifying a completely custom build. The opportunity cost of diverting skilled internal developers from other potentially higher-value projects must also be considered. This option should only be pursued if extensive analysis confirms that critical, unique OAS requirements cannot be met by *any* existing solution, even with significant configuration or customization (via API or FOSS code modification).

## **6\. Comparative Analysis and Cost Assessment**

This section synthesizes the findings, providing direct comparisons of the most promising candidates identified: leading paid APIs (Nylas, Cronofy), FOSS options (Cal.com, Easy\!Appointments), and In-House development.

**6.A Feature Fulfillment Comparison Matrix**

The following table summarizes the alignment of the leading candidates with key OAS requirements, based on the analysis in previous sections. Ratings indicate the degree of fulfillment: Fully Meets (FM), Partially Meets (PM), Does Not Meet (DNM), Requires Customization/API Dev (RC/API), Requires Verification (RV).

| Requirement | Nylas API (Core/Plus) | Cronofy API (Emerging/Growth) | Cal.com (Self-Hosted) | Easy\!Appointments (Self-Hosted) | In-House Dev |
| :---- | ----- | ----- | ----- | ----- | ----- |
| **Admin Slot Definition** | FM (via API) | FM (via API) | FM (UI & API) | FM (UI & API) | FM |
| **Student Individual Booking** | FM (via API/UI Comp.) | FM (via API/UI Comp.) | FM (UI & API) | FM (UI & API) | FM |
| **Student Group Booking** | PM/RV (API features) | PM/RV (API features) | FM ("Booking Seats") | FM ("Group Sessions") | FM |
| **Examiner Self-Assign/Resource** | PM/RC/API (API logic) | PM/RC/API (App Calendars) | PM/RC/API (Teams) | PM/RC/API (Providers) | FM |
| **Concurrency Handling** | FM (SaaS platform) | FM (SaaS platform) | FM (Requires tuning) | FM (Requires tuning) | RC/API |
| **Data Linking / API Access** | FM (CRUD API) | FM (CRUD API) | FM (CRUD API) | FM (CRUD API) | FM |
| **Notifications (Email/SMS)** | FM (via API/Platform) | FM (via API/Platform) | FM (Workflows) | FM (Built-in) | FM |
| **Canvas CSV Integration Support** | RC/API (OAS builds) | RC/API (OAS builds) | RC/API (OAS builds) | RC/API (OAS builds) | FM |
| **Customizability (Workflow/UI)** | High (API Driven) | High (API Driven) | Very High (FOSS) | High (FOSS/API) | Absolute |
| **Scalability Potential** | High (Vendor Managed) | High (Vendor Managed) | High (Self-Managed) | Medium/High (Self-Managed) | Variable |
| **Security Features / Compliance** | High (HIPAA option) | High (HIPAA, ISO) | Medium (Self-Managed) | Medium (Self-Managed) | Variable |

*Note: Ratings for API-based solutions assume the API provides necessary CRUD operations. FOSS scalability depends on hosting infrastructure. In-House assumes requirements are met by definition but requires building.*

**6.B API Quality, Integration Ease, and Scalability Comparison**

* **API Scope & Quality:**  
  * *Paid APIs (Nylas, Cronofy):* Offer robust, well-documented, CRUD-enabled APIs specifically designed for calendar integration. They handle complexities of syncing across multiple providers (Google, Microsoft). Provide SDKs and webhooks. Quality is backed by SLAs (for uptime).  
  * *FOSS APIs (Cal.com, Easy\!Appointments):* Both offer comprehensive REST APIs with CRUD operations for core objects and support webhooks.47 Cal.com's API seems particularly extensive, reflecting its API-first design.39 Documentation quality appears good for both, though community support might be needed for edge cases. Quality depends on ongoing open-source maintenance.  
  * *In-House:* API quality and scope depend entirely on internal development effort and expertise.  
  * *Limited APIs:* Calendly's API lacks event creation, and WCOnline's is read-only 32, making them unsuitable for deep integration.  
* **Integration Ease:**  
  * *Paid APIs:* Generally easier to integrate for cross-provider compatibility due to unified API layer. Require handling authentication (API keys/OAuth) and potentially vendor-specific SDKs. Cost is a factor.  
  * *FOSS APIs:* Require self-hosting setup first. Integration involves standard REST API calls. Authentication via API keys or potentially internal methods if modified. Open source nature allows direct inspection of API code if needed. Requires expertise with the specific platform's stack (Node.js/Postgres for Cal.com, PHP/MySQL for Easy\!Appointments).  
  * *In-House:* Integration is theoretically seamless as the API is custom-built, but requires building the API itself.  
* **Scalability & Performance:**  
  * *Paid APIs:* Scalability is managed by the vendor, typically offering high reliability and performance backed by SLAs. Suitable for large user bases without requiring internal infrastructure scaling.  
  * *FOSS APIs:* Scalability is dependent on the University's self-hosting infrastructure (servers, database tuning, load balancing) and administrative expertise.62 Cal.com's Node.js architecture may offer advantages for high concurrency compared to Easy\!Appointments' PHP stack, but both require careful management.40 Performance needs validation under expected load. Concurrency control is critical.1  
  * *In-House:* Scalability and performance are entirely dependent on the quality of the custom architecture and implementation. High risk if not engineered correctly.

**6.C Total Cost of Ownership (TCO) Analysis**

Estimating TCO involves considering upfront costs, recurring subscriptions, infrastructure, and ongoing maintenance effort (staff time). The following table provides an illustrative comparison over 3 years. Assumptions:

* *Staff Cost:* Assumed skilled developer/admin time costs $X per hour (University to substitute actual internal cost rate).  
* *In-House Dev Effort:* Estimated 6 person-months initial build, 1.5 person-months/year maintenance (highly variable).  
* *FOSS Setup Effort:* Estimated 0.5 person-months initial setup/integration.  
* *FOSS Maintenance Effort:* Estimated 1 person-month/year (applying \~20% of initial effort annually, aligning with benchmarks 76).  
* *Infrastructure Cost (Self-Hosted):* Estimated $50/month ($600/year) for adequate VPS/DB resources (based loosely on 72, university costs may differ).  
* *Paid API Usage (Illustrative):* Assumes a level requiring Nylas Core ($1.20/CA/mo) or Cronofy Emerging ($819/mo base). *Crucially assumes OAS can operate with \~100 "effective" CAs/App Calendars via API, avoiding mass user connections.* **This assumption needs validation.**

| Solution Candidate | Category | Initial Cost (Dev/Setup) | Recurring Yr 1 (Sub/Infra/Maint) | Recurring Yr 2 | Recurring Yr 3 | Est. 3-Year TCO (Illustrative) |
| :---- | :---- | ----- | ----- | ----- | ----- | ----- |
| **Nylas API (Core)** | Paid API | Low (Integration Effort) | \~$1,440 (Sub) \+ Maint Effort | \~$1,440 \+ Maint | \~$1,440 \+ Maint | \~$4,320 \+ Integration/Maint Staff Time |
| **Cronofy API (Emerging)** | Paid API | Low (Integration Effort) | \~$9,828 (Sub) \+ Maint Effort | \~$9,828 \+ Maint | \~$9,828 \+ Maint | \~$29,484 \+ Integration/Maint Staff Time |
| **Cal.com (Self-Hosted)** | FOSS Self-Hosted | Moderate (Setup Effort) | \~$600 (Infra) \+ Maint Effort | \~$600 \+ Maint | \~$600 \+ Maint | \~$1,800 \+ Setup/Maint Staff Time |
| **Easy\!Appointments (Self-Hosted)** | FOSS Self-Hosted | Moderate (Setup Effort) | \~$600 (Infra) \+ Maint Effort | \~$600 \+ Maint | \~$600 \+ Maint | \~$1,800 \+ Setup/Maint Staff Time |
| **In-House Development** | In-House | Very High (Dev Effort) | High (Maint Effort) | High (Maint) | High (Maint) | Very High (Significant Staff Time) |

*Note: Maint Effort refers to staff time cost. Paid API maintenance effort is lower than FOSS/In-House. TCO highly sensitive to assumptions, especially Paid API usage volume and staff costs.*

* **Cost Structures Discussion:**  
  * *Paid APIs:* Offer predictable subscription costs (potentially tiered by usage) but require careful estimation of usage metrics (e.g., Nylas CAs, Cronofy's multiple metrics). Vendor handles infrastructure/core maintenance. Nylas appears significantly cheaper than Cronofy at assumed usage levels, but validation is key.  
  * *FOSS Self-Hosted:* Avoids subscription fees for core software but incurs tangible infrastructure costs and significant, ongoing staff time costs for setup and maintenance.76 TCO depends heavily on internal resource costs and efficiency.  
  * *In-House:* Highest upfront cost (development) and highest ongoing maintenance cost (staff time). Offers maximum control but is the most resource-intensive option.

**6.D Licensing Considerations Summary**

* **Commercial SaaS (Nylas, Cronofy, Acuity, etc.):** Governed by vendor terms of service and privacy policies. Data processing agreements (DPAs) are crucial. Data resides on vendor infrastructure (unless on-premise option like Appointy is chosen). Risks include vendor lock-in, price changes, and data governance concerns.  
* **Cal.com (AGPLv3):** Strong copyleft. Network use of *modified* code triggers obligation to share modifications' source code. API-only use of unmodified code likely lower risk, but requires legal confirmation. Modifying code requires willingness to comply with source sharing.  
* **Easy\!Appointments (GPLv3) / MRBS (GPL):** Standard copyleft. Obligation to share modified source code triggered primarily by *external distribution*.103 Lower risk for internal modifications compared to AGPLv3. Still requires compliance management and legal review.  
* **In-House:** University owns IP. No external license constraints or risks, but also no external contributions or shared maintenance burden.

**6.E Pros & Cons Synthesis (Leading Candidates)**

* **Nylas API:**  
  * *Pros:* Robust CRUD API, handles multi-provider complexity, SDKs/Webhooks, scalable, reliable (SLA), security options (HIPAA).  
  * *Cons:* Potentially high cost depending on "Connected Account" definition/usage, might be overly complex if only basic scheduling needed.  
* **Cronofy API:**  
  * *Pros:* Enterprise-focused API, resource management features (App Calendars), strong security/compliance (HIPAA, ISO), high uptime SLA, white-label options.  
  * *Cons:* High entry price ($819/mo), complex usage-based pricing, requires careful cost estimation.  
* **Cal.com (Self-Hosted):**  
  * *Pros:* Free core software, full data control, highly customizable (FOSS), strong API, active community, feature-rich (Booking Seats).  
  * *Cons:* AGPLv3 license risk (especially if modified), requires significant technical expertise and ongoing maintenance effort/cost, scalability depends on internal management.  
* **Easy\!Appointments (Self-Hosted):**  
  * *Pros:* Free software, GPLv3 license less restrictive for internal modification than AGPLv3, standard PHP/MySQL stack, API/Webhooks available, group session support.  
  * *Cons:* Scalability potentially less proven than [Cal.com/SaaS](https://Cal.com/SaaS), community might be less active than Cal.com, requires self-hosting expertise/maintenance.  
* **In-House Development:**  
  * *Pros:* Absolute control, perfect feature fit, University owns IP.  
  * *Cons:* Highest cost, longest time-to-delivery, highest risk (estimation, complexity, maintenance), requires significant internal developer resources, concurrency is hard.1

## **7\. Conclusion and Recommendation**

**7.1 Summary of Key Findings**

The analysis reveals a diverse landscape of potential booking system solutions for the OAS project, significantly broadened by the inclusion of paid API options.

* **Commercial SaaS Limitations:** Several established commercial platforms (Calendly, WCOnline) were found to have critical API limitations (lack of programmatic creation or read-only access) rendering them unsuitable for deep integration with OAS. Others (Acuity Scheduling) gate API access behind expensive high-tier plans, requiring careful API capability verification before consideration.22  
* **Enterprise APIs (Nylas, Cronofy):** These platforms offer robust, CRUD-enabled Calendar APIs designed for integration, providing the necessary technical capabilities. They handle cross-provider complexity and offer enterprise features, scalability, and SLAs. However, their pricing models (per connected account for Nylas, multi-metric volume for Cronofy) require careful analysis based on the specific OAS usage pattern (API-driven vs. user-synced) to determine true cost-effectiveness. Cronofy has a significantly higher entry price point.  
* **FOSS (Cal.com, Easy\!Appointments):** Both offer comprehensive features, including group booking capabilities ("Booking Seats" 54, "Group Sessions" 93) and capable REST APIs with webhooks.47 They provide full data control via self-hosting but require significant internal technical expertise for setup and ongoing maintenance.  
  * **Cal.com:** Benefits from a very active community, modern tech stack (Node.js/Postgres), and extensive features/API.39 Its primary challenge is the AGPLv3 license, which carries risks if code modifications are needed.  
  * **Easy\!Appointments:** Uses the less restrictive GPLv3 license for internal use 103 and a potentially more common tech stack (PHP/MySQL).90 Its API and feature set appear solid, though scalability and community vibrancy might lag slightly behind Cal.com.  
* **In-House Development:** Offers maximum control but represents the highest cost, risk, and time investment, particularly concerning ongoing maintenance.76 Justifiable only if unique, critical requirements cannot be met by external solutions.

**7.2 Recommended Solution**

Based on the comprehensive analysis balancing features, integration capability, cost, risk, and control, the following recommendation is made:

**Primary Recommendation: Pursue Easy\!Appointments (Self-Hosted FOSS)**

**Secondary Recommendation (if FOSS deemed unsuitable after PoC/Legal Review): Evaluate Nylas API (Paid SaaS)**

**7.3 Justification**

* **Easy\!Appointments (Primary Recommendation):**  
  * **Licensing:** The GPLv3 license 90 presents a significantly lower barrier for internal university use compared to Cal.com's AGPLv3.64 Modifications made for internal use are unlikely to trigger public source code disclosure obligations 105, providing greater flexibility if customization is needed without navigating complex IP issues associated with AGPLv3.  
  * **Functionality & API:** Easy\!Appointments offers a solid feature set covering core OAS needs, including group sessions 93 and potentially resource/examiner mapping using its provider structure.88 Crucially, it provides a REST API and webhooks 96, enabling the necessary programmatic integration with OAS, unlike MRBS or the limited commercial options (Calendly/WCOnline).  
  * **Technology Stack:** Its PHP/MySQL stack 90 may align better with existing University infrastructure and technical expertise compared to Cal.com's Node.js/PostgreSQL stack, potentially simplifying deployment and maintenance.  
  * **Cost:** As FOSS, it avoids direct subscription costs. While self-hosting incurs infrastructure and maintenance costs 76, these are likely lower than high-tier SaaS API subscriptions (especially Cronofy) and significantly lower than full in-house development, assuming existing university infrastructure and personnel can be leveraged efficiently. Premium support is available if needed.91  
  * **Risk Mitigation:** While requiring self-management, it avoids vendor lock-in and provides full data control. The licensing risk is lower than AGPLv3 for internal modifications.  
* **Nylas API (Secondary Recommendation):**  
  * **Technical Capability:** If a FOSS solution proves unviable (e.g., due to unforeseen technical limitations discovered during a PoC, scalability concerns, or lack of internal resources for self-hosting/maintenance), Nylas offers the most technically capable and potentially cost-effective *paid* API solution among those evaluated. Its full CRUD API and Virtual Calendar feature appear well-suited for OAS integration needs.  
  * **Cost Consideration:** Its cost-effectiveness hinges *critically* on confirming that OAS can operate via the API using a limited number of service/application accounts rather than requiring thousands of individual student/examiner "Connected Accounts". If this is confirmed, its per-CA cost appears more manageable than Cronofy's high base price.  
  * **Vendor Management:** As a SaaS solution, Nylas handles infrastructure, core maintenance, and uptime, reducing the operational burden on the university compared to self-hosting.  
  * **Contingency:** This serves as a strong fallback if the preferred FOSS path encounters significant roadblocks.  
* **Why Not Cal.com?** While technically very capable with a strong community, the AGPLv3 license introduces significant uncertainty and potential compliance burdens, especially if modifications become necessary. For a risk-averse institution, the less restrictive GPLv3 of Easy\!Appointments is preferable, assuming feature parity is sufficient.  
* **Why Not In-House?** The complexity, cost, time, and ongoing maintenance burden of building a robust booking system from scratch are substantial.76 Given the availability of capable FOSS and paid API solutions, in-house development appears inefficient unless absolutely necessary due to truly unique, unmet requirements.

**7.4 Next Steps**

1. **Legal Review (FOSS):** Initiate a formal legal review of the GPLv3 license (for Easy\!Appointments) to confirm the interpretation regarding internal modifications and ensure compliance procedures are understood. If Cal.com remains a consideration despite the primary recommendation, AGPLv3 must also undergo rigorous legal review focusing on both API interaction and modification scenarios.  
2. **Technical Proof of Concept (PoC) \- Easy\!Appointments:** Deploy Easy\!Appointments in a test environment. Evaluate:  
   * Ease of installation and configuration on university infrastructure.  
   * API capabilities: Test key API endpoints required for OAS integration (creating slots, booking appointments, managing users/providers, querying data).  
   * Feature suitability: Verify group session functionality and the feasibility of mapping examiners/resources to 'providers'.  
   * Basic performance and usability assessment.  
3. **Cost Validation (Nylas \- Contingent):** If the FOSS path shows early signs of being unviable, engage with Nylas sales/technical support to clarify the "Connected Account" definition and obtain accurate cost projections for the specific OAS API-driven usage model (leveraging Virtual Calendars if applicable).  
4. **Refine Requirements:** Based on PoC findings and legal review, refine the detailed integration plan and confirm if any minor requirements need adjustment based on the chosen platform's capabilities.  
5. **Decision Confirmation:** Finalize the decision based on the outcomes of the legal review, technical PoC, and (if necessary) paid API cost validation.

#### **Works cited**

1. Issues in Concurrency Control for Different Databases Concurrency Control Methods for Different Databases a Survey of Concurrency Control Protocols \- RSIS International, accessed April 30, 2025, [https://rsisinternational.org/Issue13/49-57.pdf](https://rsisinternational.org/Issue13/49-57.pdf)  
2. Real-Time Concurrency Control and Transaction Scheduling \- DTIC, accessed April 30, 2025, [https://apps.dtic.mil/sti/tr/pdf/ADA218162.pdf](https://apps.dtic.mil/sti/tr/pdf/ADA218162.pdf)  
3. (PDF) Issues with Concurrency Control Techniques \- ResearchGate, accessed April 30, 2025, [https://www.researchgate.net/publication/317837714\_Issues\_with\_Concurrency\_Control\_Techniques](https://www.researchgate.net/publication/317837714_Issues_with_Concurrency_Control_Techniques)  
4. Notes on Concurrency \- Duke Computer Science, accessed April 30, 2025, [https://users.cs.duke.edu/\~chase/systems/concurrency.html](https://users.cs.duke.edu/~chase/systems/concurrency.html)  
5. Intro to Database Systems : Concurrency Control \- Scheduling problems \- Dan Crisan, accessed April 30, 2025, [http://blog.dancrisan.com/intro-to-database-systems-concurrency-control-scheduling-problems](http://blog.dancrisan.com/intro-to-database-systems-concurrency-control-scheduling-problems)  
6. Mastering Movie Ticket Reservation Systems: Key Considerations for Developers, accessed April 30, 2025, [https://corner.buka.sh/mastering-movie-ticket-reservation-systems-key-considerations-for-developers/](https://corner.buka.sh/mastering-movie-ticket-reservation-systems-key-considerations-for-developers/)  
7. Concurrency problems in DBMS Transactions | GeeksforGeeks, accessed April 30, 2025, [https://www.geeksforgeeks.org/concurrency-problems-in-dbms-transactions/](https://www.geeksforgeeks.org/concurrency-problems-in-dbms-transactions/)  
8. Concurrency Control in DBMS \- GeeksforGeeks, accessed April 30, 2025, [https://www.geeksforgeeks.org/concurrency-control-in-dbms/](https://www.geeksforgeeks.org/concurrency-control-in-dbms/)  
9. Concurrency control and scheduling for hard real-time systems \- Purdue e-Pubs, accessed April 30, 2025, [https://docs.lib.purdue.edu/dissertations/AAI9501772/](https://docs.lib.purdue.edu/dissertations/AAI9501772/)  
10. How to prevent concurrency problems when using the repository pattern?, accessed April 30, 2025, [https://softwareengineering.stackexchange.com/questions/403586/how-to-prevent-concurrency-problems-when-using-the-repository-pattern](https://softwareengineering.stackexchange.com/questions/403586/how-to-prevent-concurrency-problems-when-using-the-repository-pattern)  
11. Implementing Real-Time Inventory Updates in Your Booking System \- SITE123, accessed April 30, 2025, [https://www.site123.com/learn/implementing-real-time-inventory-updates-in-your-booking-system](https://www.site123.com/learn/implementing-real-time-inventory-updates-in-your-booking-system)  
12. Acuity Scheduling vs Calendly: Compare Pricing & Features \- MotoPress, accessed April 30, 2025, [https://motopress.com/blog/acuity-scheduling-vs-calendly/](https://motopress.com/blog/acuity-scheduling-vs-calendly/)  
13. Cal.com, the Hubspot Meetings Scheduling alternative, accessed April 30, 2025, [https://cal.com/scheduling/hubspot-alternative](https://cal.com/scheduling/hubspot-alternative)  
14. Calendly Free: Your Full Guide in 2025 \- Zeeg, accessed April 30, 2025, [https://zeeg.me/en/blog/post/calendly-free](https://zeeg.me/en/blog/post/calendly-free)  
15. Choose the right Calendly plan for your team – Help Center, accessed April 30, 2025, [https://help.calendly.com/hc/en-us/articles/8815568416535-Calendly-s-subscription-plans](https://help.calendly.com/hc/en-us/articles/8815568416535-Calendly-s-subscription-plans)  
16. Pricing \- Calendly.com, accessed April 30, 2025, [https://calendly.com/pricing](https://calendly.com/pricing)  
17. Calendly Pricing: Plans, Features, and Deals for Every Business \- Spendflo, accessed April 30, 2025, [https://www.spendflo.com/blog/calendly-pricing-guide](https://www.spendflo.com/blog/calendly-pricing-guide)  
18. Calendly: Free Online Appointment Scheduling Software, accessed April 30, 2025, [https://calendly.com/](https://calendly.com/)  
19. Rate Limits \- Calendly Developer, accessed April 30, 2025, [https://developer.calendly.com/api-docs/edca8074633f8-upcoming-changes](https://developer.calendly.com/api-docs/edca8074633f8-upcoming-changes)  
20. Calendly vs. Doodle: Which should you use? \[2025\] \- Zapier, accessed April 30, 2025, [https://zapier.com/blog/calendly-vs-doodle/](https://zapier.com/blog/calendly-vs-doodle/)  
21. I Review Squarespace's Acuity Scheduling: My Complete Guide \- Website Builder Expert, accessed April 30, 2025, [https://www.websitebuilderexpert.com/ecommerce-website-builders/acuity-review/](https://www.websitebuilderexpert.com/ecommerce-website-builders/acuity-review/)  
22. Pricing & Sign up \- Acuity Online Appointment Scheduler, accessed April 30, 2025, [https://acuityscheduling.com/signup.php](https://acuityscheduling.com/signup.php)  
23. Acuity Scheduling pricing, billing, and invoices \- Squarespace Help Center, accessed April 30, 2025, [https://support.squarespace.com/hc/en-us/articles/360034944391-Acuity-Scheduling-pricing-billing-and-invoices](https://support.squarespace.com/hc/en-us/articles/360034944391-Acuity-Scheduling-pricing-billing-and-invoices)  
24. Acuity Scheduling: Online Appointment Scheduling Software, accessed April 30, 2025, [https://acuityscheduling.com/](https://acuityscheduling.com/)  
25. Doodle Free and Doodle Professional differences at-a-glance, accessed April 30, 2025, [https://help.doodle.com/en/articles/10448913-doodle-free-and-doodle-professional-differences-at-a-glance](https://help.doodle.com/en/articles/10448913-doodle-free-and-doodle-professional-differences-at-a-glance)  
26. The top 5 Calendly alternatives 2025 \- SuperSaaS Blog, accessed April 30, 2025, [https://blog.supersaas.com/top\_5\_alternatives\_to\_calendly](https://blog.supersaas.com/top_5_alternatives_to_calendly)  
27. How much does Doodle cost?, accessed April 30, 2025, [https://help.doodle.com/en/articles/9457366-how-much-does-doodle-cost](https://help.doodle.com/en/articles/9457366-how-much-does-doodle-cost)  
28. General Terms and Conditions \- Doodle, accessed April 30, 2025, [https://doodle.com/en/general-terms-and-conditions/](https://doodle.com/en/general-terms-and-conditions/)  
29. Doodle vs. Zoho Bookings: Which is Right for Your Business?, accessed April 30, 2025, [https://doodle.com/en/doodle-vs-zoho-bookings/](https://doodle.com/en/doodle-vs-zoho-bookings/)  
30. Multiple Centers Sharing a Subscription \- WCONLINE, accessed April 30, 2025, [https://help8.mywconline.com/index.php?id=33\&sid=1043](https://help8.mywconline.com/index.php?id=33&sid=1043)  
31. WCONLINE | The Management Solution for Academic Centers, accessed April 30, 2025, [https://mywconline.com/](https://mywconline.com/)  
32. WCOnline API explainer \- Katie Kodes, accessed April 30, 2025, [https://katiekodes.com/wconline-api/](https://katiekodes.com/wconline-api/)  
33. Simple Subscription Pricing \- WCONLINE | The Management Solution for Academic Centers, accessed April 30, 2025, [https://mywconline.com/pricing](https://mywconline.com/pricing)  
34. Simple Subscription Pricing \- WCONLINE | The Management Solution for Academic Centers, accessed April 30, 2025, [https://mywconline.com/index.php/pricing](https://mywconline.com/index.php/pricing)  
35. Online Booking Tutorial: NodeJS | Getting Started \- Cronofy Docs, accessed April 30, 2025, [https://docs.cronofy.com/developers/getting-started/online-booking-tutorial/](https://docs.cronofy.com/developers/getting-started/online-booking-tutorial/)  
36. Appointment scheduling API for Events and Bookings \- DaySchedule, accessed April 30, 2025, [https://dayschedule.com/docs/api](https://dayschedule.com/docs/api)  
37. Pricing \- Free Appointment Scheduling Software \- DaySchedule, accessed April 30, 2025, [https://dayschedule.com/pricing](https://dayschedule.com/pricing)  
38. SpurwingIO/Appointment-Scheduling-API \- GitHub, accessed April 30, 2025, [https://github.com/SpurwingIO/Appointment-Scheduling-API](https://github.com/SpurwingIO/Appointment-Scheduling-API)  
39. calcom/cal.com: Scheduling infrastructure for absolutely everyone. \- GitHub, accessed April 30, 2025, [https://github.com/calcom/cal.com](https://github.com/calcom/cal.com)  
40. Cal.com v4.5 | Cal.com \- Open Scheduling Infrastructure, accessed April 30, 2025, [https://cal.com/blog/v-4-5](https://cal.com/blog/v-4-5)  
41. Cal.com v5.1 | Cal.com \- Open Scheduling Infrastructure, accessed April 30, 2025, [https://cal.com/blog/cal-com-v5-1](https://cal.com/blog/cal-com-v5-1)  
42. Cal.com \- Product Information, Latest Updates, and Reviews 2025 \- Product Hunt, accessed April 30, 2025, [https://www.producthunt.com/posts/cal-com-platform-starter-kit](https://www.producthunt.com/posts/cal-com-platform-starter-kit)  
43. Can maintainers of an AGPLv3 license sell the right of keeping code closed source?, accessed April 30, 2025, [https://www.reddit.com/r/opensource/comments/1do030s/can\_maintainers\_of\_an\_agplv3\_license\_sell\_the/](https://www.reddit.com/r/opensource/comments/1do030s/can_maintainers_of_an_agplv3_license_sell_the/)  
44. cal.com self-hosted is too limited : r/selfhosted \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/selfhosted/comments/198fqc4/calcom\_selfhosted\_is\_too\_limited/](https://www.reddit.com/r/selfhosted/comments/198fqc4/calcom_selfhosted_is_too_limited/)  
45. Navigating Open Source Scheduling Software: A Comprehensive Guide | Cal.com, accessed April 30, 2025, [https://cal.com/blog/navigating-open-source-scheduling-software-a-comprehensive-guide](https://cal.com/blog/navigating-open-source-scheduling-software-a-comprehensive-guide)  
46. Seamless Integration: Incorporating Open Source Schedulers into Your Existing Systems, accessed April 30, 2025, [https://cal.com/blog/seamless-integration-incorporating-open-source-schedulers-into-your-existing-syst](https://cal.com/blog/seamless-integration-incorporating-open-source-schedulers-into-your-existing-syst)  
47. Introduction to API v2 \- Cal.com Docs, accessed April 30, 2025, [https://cal.com/docs/api-reference/v2/introduction](https://cal.com/docs/api-reference/v2/introduction)  
48. API \- Cal.com, accessed April 30, 2025, [https://cal.com/scheduling/feature/api](https://cal.com/scheduling/feature/api)  
49. Cal.com | ElevenLabs Documentation, accessed April 30, 2025, [https://elevenlabs.io/docs/conversational-ai/guides/integrations/cal-com](https://elevenlabs.io/docs/conversational-ai/guides/integrations/cal-com)  
50. elevenlabs-docs/fern/conversational-ai/pages/guides/cal.com.mdx at main \- GitHub, accessed April 30, 2025, [https://github.com/elevenlabs/elevenlabs-docs/blob/main/fern/conversational-ai/pages/guides/cal.com.mdx?plain=1](https://github.com/elevenlabs/elevenlabs-docs/blob/main/fern/conversational-ai/pages/guides/cal.com.mdx?plain=1)  
51. Cal.com API Essential Guide \- Rollout, accessed April 30, 2025, [https://rollout.com/integration-guides/cal.com/api-essentials](https://rollout.com/integration-guides/cal.com/api-essentials)  
52. Introduction \- Cal.com Docs, accessed April 30, 2025, [https://cal.com/docs/developing/introduction](https://cal.com/docs/developing/introduction)  
53. How to build a Cal.com API integration \- Rollout, accessed April 30, 2025, [https://rollout.com/integration-guides/cal.com/sdk/step-by-step-guide-to-building-a-cal.com-api-integration-in-go](https://rollout.com/integration-guides/cal.com/sdk/step-by-step-guide-to-building-a-cal.com-api-integration-in-go)  
54. Creating multi-person booking slots | Cal.com \- Open Scheduling Infrastructure, accessed April 30, 2025, [https://cal.com/blog/creating-multi-person-booking-slots](https://cal.com/blog/creating-multi-person-booking-slots)  
55. Cal.com v3.3: Performance improvements & more.. | Cal.com Blog, accessed April 30, 2025, [https://cal.com/blog/v-3-3](https://cal.com/blog/v-3-3)  
56. concurrency issues \- Ask TOM, accessed April 30, 2025, [https://asktom.oracle.com/ords/asktom.search?tag=concurrency-issues](https://asktom.oracle.com/ords/asktom.search?tag=concurrency-issues)  
57. Cal.com Review: Is this Open-Source Scheduling Tool Worth Your Time? \- Maple Metric, accessed April 30, 2025, [https://maplemetric.com/cal-com-review/](https://maplemetric.com/cal-com-review/)  
58. Features \- Cal.com, accessed April 30, 2025, [https://cal.com/scheduling/features](https://cal.com/scheduling/features)  
59. Cal.com | Open Scheduling Infrastructure, accessed April 30, 2025, [https://cal.com/](https://cal.com/)  
60. Pricing \- Cal.com, accessed April 30, 2025, [https://cal.com/pricing](https://cal.com/pricing)  
61. Streamline Your Schedule with Cal.com: 5 Essential Features for Tutors and Educational Organizations, accessed April 30, 2025, [https://cal.com/blog/streamline-your-schedule-with-cal-com-5-essential-features-for-tutors-and-educati](https://cal.com/blog/streamline-your-schedule-with-cal-com-5-essential-features-for-tutors-and-educati)  
62. Cal.com Platform — Build your pixel-perfect booking experience with Atoms, accessed April 30, 2025, [https://cal.com/platform](https://cal.com/platform)  
63. Connect AI call agent to Cal.com \- Retell AI, accessed April 30, 2025, [https://www.retellai.com/integrations/cal-com](https://www.retellai.com/integrations/cal-com)  
64. Changing to AGPLv3 and introducing the Enterprise Edition | Cal.com \- Open Scheduling Infrastructure, accessed April 30, 2025, [https://cal.com/blog/changing-to-agplv3-and-introducing-enterprise-edition](https://cal.com/blog/changing-to-agplv3-and-introducing-enterprise-edition)  
65. awesome-selfhosted/awesome-selfhosted: A list of Free Software network services and web applications which can be hosted on your own servers \- GitHub, accessed April 30, 2025, [https://github.com/awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)  
66. Open Source Licenses: Types and Comparison \- Snyk, accessed April 30, 2025, [https://snyk.io/articles/open-source-licenses/](https://snyk.io/articles/open-source-licenses/)  
67. How to Use GNU Licenses for Your Own Software, accessed April 30, 2025, [https://www.gnu.org/licenses/gpl-howto.html](https://www.gnu.org/licenses/gpl-howto.html)  
68. Frequently Asked Questions about the GNU Licenses, accessed April 30, 2025, [http://www.gnu.org/licenses/gpl-faq.en.html](http://www.gnu.org/licenses/gpl-faq.en.html)  
69. License warning | Cloudron Forum, accessed April 30, 2025, [https://forum.cloudron.io/topic/10896/license-warning](https://forum.cloudron.io/topic/10896/license-warning)  
70. What is GPL? Here's What Developers and Legal Professionals Need to Know \- Pressable, accessed April 30, 2025, [https://pressable.com/blog/what-is-gpl/](https://pressable.com/blog/what-is-gpl/)  
71. Docker image for the meeting-room-booking-system including my modern-mrbs-theme \- GitHub, accessed April 30, 2025, [https://github.com/dorianim/mrbs-docker](https://github.com/dorianim/mrbs-docker)  
72. What's the most cost-effective way to host multiple PostgreSQL databases and Go backends for learning projects? : r/webdev \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/webdev/comments/1j6ne19/whats\_the\_most\_costeffective\_way\_to\_host\_multiple/](https://www.reddit.com/r/webdev/comments/1j6ne19/whats_the_most_costeffective_way_to_host_multiple/)  
73. Self-host database or pay for a service? : r/webdev \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/webdev/comments/1hkbh5t/selfhost\_database\_or\_pay\_for\_a\_service/](https://www.reddit.com/r/webdev/comments/1hkbh5t/selfhost_database_or_pay_for_a_service/)  
74. Cal.com Review & Set-Up Guide \- 20i, accessed April 30, 2025, [https://www.20i.com/blog/cal-review/](https://www.20i.com/blog/cal-review/)  
75. Book Easy with EasyAppointments: Reliable, Fast-Hosted Plans \- RSH Web Services, accessed April 30, 2025, [https://rshweb.com/apps-easyappointments](https://rshweb.com/apps-easyappointments)  
76. How Much Does Software Maintenance Cost? \[+Types\], accessed April 30, 2025, [https://www.spaceo.ca/blog/software-maintenance-cost/](https://www.spaceo.ca/blog/software-maintenance-cost/)  
77. How Much Does Software Maintenance Cost? Beginner's Guide\!, accessed April 30, 2025, [https://www.arkasoftwares.com/blog/software-maintenance-cost/](https://www.arkasoftwares.com/blog/software-maintenance-cost/)  
78. What Drives the Cost of Self-Service Portal Implementation? | e-point SA, accessed April 30, 2025, [https://www.e-point.com/blog/what-drives-the-cost-of-self-service-portal-implementation](https://www.e-point.com/blog/what-drives-the-cost-of-self-service-portal-implementation)  
79. How to sell planning & scheduling to your CEO \- Reliability Academy, accessed April 30, 2025, [https://reliabilityacademy.com/how-to-sell-planning-scheduling-to-your-ceo/](https://reliabilityacademy.com/how-to-sell-planning-scheduling-to-your-ceo/)  
80. Scheduling Resources Based on Actual Equipment Hours \- Microsoft Community, accessed April 30, 2025, [https://answers.microsoft.com/en-us/msoffice/forum/all/scheduling-resources-based-on-actual-equipment/0aa090d9-cf89-4af1-8709-b041cb521499](https://answers.microsoft.com/en-us/msoffice/forum/all/scheduling-resources-based-on-actual-equipment/0aa090d9-cf89-4af1-8709-b041cb521499)  
81. How Much Custom Software Development Costs \- SENLA, accessed April 30, 2025, [https://senlainc.com/blog/custom-software-development-costs/](https://senlainc.com/blog/custom-software-development-costs/)  
82. Unveiling Maintenance Scheduling: The Key to Efficient Equipment Management, accessed April 30, 2025, [https://www.fieldcircle.com/articles/what-is-maintenance-scheduling/](https://www.fieldcircle.com/articles/what-is-maintenance-scheduling/)  
83. Explore what contributes to software maintenance cost \- MarketBox, accessed April 30, 2025, [https://www.gomarketbox.com/blog/software-maintenance-costs-and-factors](https://www.gomarketbox.com/blog/software-maintenance-costs-and-factors)  
84. Free online service scheduling software for maintenance & repair \- SuperSaaS, accessed April 30, 2025, [https://www.supersaas.com/info/maintenance-and-repair-scheduling-software](https://www.supersaas.com/info/maintenance-and-repair-scheduling-software)  
85. Cal.com \- selfhostable open-source scheduling (high quality software, commercially backed, raised $34mil) \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/selfhosted/comments/11e3fh9/calcom\_selfhostable\_opensource\_scheduling\_high/](https://www.reddit.com/r/selfhosted/comments/11e3fh9/calcom_selfhostable_opensource_scheduling_high/)  
86. Rate Cal.com, accessed April 30, 2025, [https://cal.com/rate](https://cal.com/rate)  
87. Pricing \- Cal.com, accessed April 30, 2025, [https://cal.com/platform/pricing](https://cal.com/platform/pricing)  
88. EasyAppointments \- Quickstart | Elest.io, accessed April 30, 2025, [https://elest.io/open-source/easyappointments/resources/quickstart](https://elest.io/open-source/easyappointments/resources/quickstart)  
89. Easy Appointment Booking \- Availability Setup \- YouTube, accessed April 30, 2025, [https://www.youtube.com/watch?v=oU2n2yBpK4A](https://www.youtube.com/watch?v=oU2n2yBpK4A)  
90. alextselegidis/easyappointments: :date: Easy\!Appointments \- Self Hosted Appointment Scheduler \- GitHub, accessed April 30, 2025, [https://github.com/alextselegidis/easyappointments](https://github.com/alextselegidis/easyappointments)  
91. Easy\!Appointments: Online Appointment Scheduler, accessed April 30, 2025, [https://easyappointments.org/](https://easyappointments.org/)  
92. This is booking system by easy-appointment \- PHP framework \- GitHub, accessed April 30, 2025, [https://github.com/whitehat0917/booking-system](https://github.com/whitehat0917/booking-system)  
93. Features \- Easy\!Appointments, accessed April 30, 2025, [https://easyappointments.org/features/](https://easyappointments.org/features/)  
94. 10th anniversary \- How did it all start? \- Easy\!Appointments, accessed April 30, 2025, [https://easyappointments.org/blog/10th-anniversary-how-did-it-all-start/](https://easyappointments.org/blog/10th-anniversary-how-did-it-all-start/)  
95. User roles and permissions explained \- Easy\!Appointments, accessed April 30, 2025, [https://easyappointments.org/2021/06/14/user-roles-and-permissions-explained/](https://easyappointments.org/2021/06/14/user-roles-and-permissions-explained/)  
96. Swagger UI \- Easy\!Appointments, accessed April 30, 2025, [https://developers.easyappointments.org/api/](https://developers.easyappointments.org/api/)  
97. API, webhook, and integration \- EasyPractice, accessed April 30, 2025, [https://easypractice.net/api/](https://easypractice.net/api/)  
98. Setting up Webhooks | Easy Appointment Booking Help Center \- Intercom, accessed April 30, 2025, [https://intercom.help/easy-appointment-booking/en/articles/11049431-setting-up-webhooks](https://intercom.help/easy-appointment-booking/en/articles/11049431-setting-up-webhooks)  
99. Documentation \- Easy\!Appointments, accessed April 30, 2025, [https://easyappointments.org/docs.html](https://easyappointments.org/docs.html)  
100. alextselegidis/easyappointments-joomla: Add appointment bookings to your Joomla site \- GitHub, accessed April 30, 2025, [https://github.com/alextselegidis/easyappointments-joomla](https://github.com/alextselegidis/easyappointments-joomla)  
101. easyappointments/LICENSE at main \- GitHub, accessed April 30, 2025, [https://github.com/alextselegidis/easyappointments/blob/main/LICENSE](https://github.com/alextselegidis/easyappointments/blob/main/LICENSE)  
102. Question about GPL License · Issue \#1601 · alextselegidis/easyappointments \- GitHub, accessed April 30, 2025, [https://github.com/alextselegidis/easyappointments/issues/1601](https://github.com/alextselegidis/easyappointments/issues/1601)  
103. Understanding the GPL License in Simple Terms \- TiDB, accessed April 30, 2025, [https://www.pingcap.com/article/understanding-gpl-license-simple-terms/](https://www.pingcap.com/article/understanding-gpl-license-simple-terms/)  
104. Why is GPL considered a risk for licensing? : r/softwaredevelopment \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/softwaredevelopment/comments/nh7cj8/why\_is\_gpl\_considered\_a\_risk\_for\_licensing/](https://www.reddit.com/r/softwaredevelopment/comments/nh7cj8/why_is_gpl_considered_a_risk_for_licensing/)  
105. What are the consequences of GPL dependencies? \- Software Engineering Stack Exchange, accessed April 30, 2025, [https://softwareengineering.stackexchange.com/questions/44936/what-are-the-consequences-of-gpl-dependencies](https://softwareengineering.stackexchange.com/questions/44936/what-are-the-consequences-of-gpl-dependencies)  
106. GPL License \- Top 10 Questions Answered \- Mend.io, accessed April 30, 2025, [https://www.mend.io/blog/top-10-gpl-license-questions-answered/](https://www.mend.io/blog/top-10-gpl-license-questions-answered/)  
107. Copyleft and the GNU General Public License: A Comprehensive Tutorial and Guide, accessed April 30, 2025, [https://copyleft.org/guide/monolithic/](https://copyleft.org/guide/monolithic/)  
108. Frequently Asked Questions about the GNU Licenses, accessed April 30, 2025, [http://www.gnu.org/licenses/gpl-faq.html](http://www.gnu.org/licenses/gpl-faq.html)  
109. Easy\!Appointments \- :date: Easy\!Appointments \- Self Hosted Appointment Scheduler | Awesome Homelab, accessed April 30, 2025, [https://www.awesome-homelab.com/products/alextselegidis/easyappointments](https://www.awesome-homelab.com/products/alextselegidis/easyappointments)  
110. Easy\!Appointments Developers, accessed April 30, 2025, [https://developers.easyappointments.org/](https://developers.easyappointments.org/)  
111. How to install Easy\!Appointments on Raspberry PI: Open Source Reservation Tool, accessed April 30, 2025, [https://peppe8o.com/easyappointments-raspberry-pi-reservation-tool/](https://peppe8o.com/easyappointments-raspberry-pi-reservation-tool/)  
112. Easy\!Appointments \- General Discussion \- Mautic Forums, accessed April 30, 2025, [https://forum.mautic.org/t/easy-appointments/22480](https://forum.mautic.org/t/easy-appointments/22480)  
113. Support forum \- Easy Appointments, accessed April 30, 2025, [https://easy-appointments.com/support-forum/](https://easy-appointments.com/support-forum/)  
114. Three open source alternatives to Calendly | OpenSauced, accessed April 30, 2025, [https://opensauced.pizza/docs/community-resources/three-open-source-alternatives-to-calendly/](https://opensauced.pizza/docs/community-resources/three-open-source-alternatives-to-calendly/)  
115. Open Source Appointment Scheduling: An Overview \- Cal.com, accessed April 30, 2025, [https://cal.com/blog/open-source-appointment-scheduling-an-overview](https://cal.com/blog/open-source-appointment-scheduling-an-overview)  
116. System notifications explained \- Easy\!Appointments, accessed April 30, 2025, [https://easyappointments.org/2021/04/06/system-notifications-explained/](https://easyappointments.org/2021/04/06/system-notifications-explained/)  
117. What's new in Easy\!Appointments 1.5, accessed April 30, 2025, [https://easyappointments.org/2022/01/31/preview-whats-new-in-easyappointments-1-5/](https://easyappointments.org/2022/01/31/preview-whats-new-in-easyappointments-1-5/)  
118. AI Appointment Booking: Automate Scheduling and Client Inquiries \- Synthflow AI, accessed April 30, 2025, [https://synthflow.ai/ai-appointment-booking](https://synthflow.ai/ai-appointment-booking)  
119. AI Appointment Setter: Automate Scheduling & Follow-ups \- Synthflow AI, accessed April 30, 2025, [https://synthflow.ai/ai-appointment-setter](https://synthflow.ai/ai-appointment-setter)  
120. Appointment Booking Websites: Why Your Business Needs it in 2024 \- G2 Learning Hub, accessed April 30, 2025, [https://learn.g2.com/appointment-booking-websites](https://learn.g2.com/appointment-booking-websites)  
121. Best Easy\!Appointments Alternatives & Competitors \- SourceForge, accessed April 30, 2025, [https://sourceforge.net/software/product/Easy-Appointments/alternatives](https://sourceforge.net/software/product/Easy-Appointments/alternatives)  
122. Alternatives page for Easy Appointments \- 10Web, accessed April 30, 2025, [https://10web.io/wordpress-plugin/easy-appointments/alternatives/](https://10web.io/wordpress-plugin/easy-appointments/alternatives/)  
123. MRBS: Introduction, accessed April 30, 2025, [https://mrbs.sourceforge.io/](https://mrbs.sourceforge.io/)  
124. Meeting Room Booking System download | SourceForge.net, accessed April 30, 2025, [https://sourceforge.net/projects/mrbs/](https://sourceforge.net/projects/mrbs/)  
125. Documentation : AUTHENTICATION \- MRBS \- SourceForge, accessed April 30, 2025, [https://mrbs.sourceforge.io/view\_text.php?section=Documentation\&file=AUTHENTICATION](https://mrbs.sourceforge.io/view_text.php?section=Documentation&file=AUTHENTICATION)  
126. MRBS-v-1.9.4 \- Microsoft Azure Marketplace, accessed April 30, 2025, [https://azuremarketplace.microsoft.com/en-us/marketplace/apps/nilespartnersinc1617691698386.mrbs-v-1-9-4-27-07-2021?tab=overview](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/nilespartnersinc1617691698386.mrbs-v-1-9-4-27-07-2021?tab=overview)  
127. Mrbs Meeting Room Booking System | PDF | Active Directory | Software \- Scribd, accessed April 30, 2025, [https://www.scribd.com/document/551203673/wks09-mrbs](https://www.scribd.com/document/551203673/wks09-mrbs)  
128. Documentation : INSTALL \- MRBS \- SourceForge, accessed April 30, 2025, [https://mrbs.sourceforge.io/view\_text.php?section=Documentation\&file=INSTALL](https://mrbs.sourceforge.io/view_text.php?section=Documentation&file=INSTALL)  
129. GLOBAL MANUFACTURING RECORD BOOK STRUCTURE AND CONTENT (Subsea Product) \- STANDARD INSTRUCTIONS \- TechnipFMC, accessed April 30, 2025, [https://www.technipfmc.com/media/avbdc1yp/gsop\_prd\_10009\_rev\_01.pdf](https://www.technipfmc.com/media/avbdc1yp/gsop_prd_10009_rev_01.pdf)  
130. MRBS integration \- ChurchCRM \- Read the Docs, accessed April 30, 2025, [https://church-web-crm.readthedocs.io/en/2.3.5/user-guide/ReadmeMRBS/](https://church-web-crm.readthedocs.io/en/2.3.5/user-guide/ReadmeMRBS/)  
131. how to implenting the Azure Organization AD Authentication in MRBS a web application based on PHP? \- Stack Overflow, accessed April 30, 2025, [https://stackoverflow.com/questions/77992538/how-to-implenting-the-azure-organization-ad-authentication-in-mrbs-a-web-applica](https://stackoverflow.com/questions/77992538/how-to-implenting-the-azure-organization-ad-authentication-in-mrbs-a-web-applica)  
132. Dialogic® PowerMedia™ Media Resource Broker (MRB) Technology Guide, accessed April 30, 2025, [https://www.dialogic.com/webhelp/XMS/3.2/XMS\_MRBTechGuide.pdf](https://www.dialogic.com/webhelp/XMS/3.2/XMS_MRBTechGuide.pdf)  
133. MRBS integration | Drupal Groups, accessed April 30, 2025, [https://groups.drupal.org/node/19163](https://groups.drupal.org/node/19163)  
134. What software license allows me to have GPL for academic use and paid use by industry for my open-source project? \- Academia Stack Exchange, accessed April 30, 2025, [https://academia.stackexchange.com/questions/23564/what-software-license-allows-me-to-have-gpl-for-academic-use-and-paid-use-by-ind](https://academia.stackexchange.com/questions/23564/what-software-license-allows-me-to-have-gpl-for-academic-use-and-paid-use-by-ind)  
135. Meeting Room Booking System / DO NOT USE \- Support Requests / \#2398 MRBS 1.7.3 PHP Compatibility \- SourceForge, accessed April 30, 2025, [https://sourceforge.net/p/mrbs/support-requests/2398/](https://sourceforge.net/p/mrbs/support-requests/2398/)  
136. PostgreSQL PHP Generator \- SQL Maestro Group, accessed April 30, 2025, [https://www.sqlmaestro.com/products/postgresql/phpgenerator/](https://www.sqlmaestro.com/products/postgresql/phpgenerator/)  
137. Meeting Room Booking System / DO NOT USE \- Support Requests \- SourceForge, accessed April 30, 2025, [https://sourceforge.net/p/mrbs/support-requests/](https://sourceforge.net/p/mrbs/support-requests/)  
138. Thread: \[MRBS-general\] max bookings per user | Meeting Room Booking System, accessed April 30, 2025, [https://sourceforge.net/p/mrbs/mailman/mrbs-general/thread/201103090910.31688.priestjs%40appstate.edu/](https://sourceforge.net/p/mrbs/mailman/mrbs-general/thread/201103090910.31688.priestjs%40appstate.edu/)  
139. jazzy639's Content \- EduGeek.net, accessed April 30, 2025, [https://www.edugeek.net/profile/808-jazzy639/content/?type=forums\_topic\_post\&change\_section=1](https://www.edugeek.net/profile/808-jazzy639/content/?type=forums_topic_post&change_section=1)  
140. Revolutionizing Library Hall Bookings in our College with MRBS: A Success Story, accessed April 30, 2025, [https://maheshpalamuttath.info/index.php/2023/04/20/revolutionizing-library-hall-bookings-in-our-college-with-mrbs-a-success-story/](https://maheshpalamuttath.info/index.php/2023/04/20/revolutionizing-library-hall-bookings-in-our-college-with-mrbs-a-success-story/)  
141. The 8 Most Popular Free and Open Source Meeting Room Booking Systems \- GoodFirms, accessed April 30, 2025, [https://www.goodfirms.co/meeting-room-booking-system-software/blog/most-popular-free-open-source-meeting-room-booking-system](https://www.goodfirms.co/meeting-room-booking-system-software/blog/most-popular-free-open-source-meeting-room-booking-system)  
142. MRBS Archives | MAHESH PALAMUTTATH, accessed April 30, 2025, [https://maheshpalamuttath.info/index.php/category/mrbs/](https://maheshpalamuttath.info/index.php/category/mrbs/)  
143. display todays bookings from mysql mrbs calendar \- Stack Overflow, accessed April 30, 2025, [https://stackoverflow.com/questions/9795360/display-todays-bookings-from-mysql-mrbs-calendar](https://stackoverflow.com/questions/9795360/display-todays-bookings-from-mysql-mrbs-calendar)  
144. Annual Reports, accessed April 30, 2025, [https://www.annualreports.com/HostedData/AnnualReportArchive/p/NYSE\_PRI\_2022.pdf](https://www.annualreports.com/HostedData/AnnualReportArchive/p/NYSE_PRI_2022.pdf)  
145. Make your office more efficient with the Meeting Room Booking System (MRBS) in Taiwan, accessed April 30, 2025, [https://ones.software/blog/2022/11/24/make-your-office-more-efficient-with-the-meeting-room-booking-system-mrbs-in-taiwan/](https://ones.software/blog/2022/11/24/make-your-office-more-efficient-with-the-meeting-room-booking-system-mrbs-in-taiwan/)  
146. Talk:Roadmap \- MoodleDocs, accessed April 30, 2025, [https://docs.moodle.org/19/en/Talk:Roadmap](https://docs.moodle.org/19/en/Talk:Roadmap)  
147. The Full Guide on How to Estimate Software Development Time, accessed April 30, 2025, [https://ddi-dev.com/blog/it-news/how-to-estimate-software-development-time/](https://ddi-dev.com/blog/it-news/how-to-estimate-software-development-time/)  
148. Booking System & Online Scheduling Development Services \- Onix-Systems, accessed April 30, 2025, [https://onix-systems.com/scheduling-and-booking-system-development-services](https://onix-systems.com/scheduling-and-booking-system-development-services)  
149. How To Make a Booking Website: From Domains to Marketing, accessed April 30, 2025, [https://www.websitebuilderexpert.com/building-websites/how-to-make-a-booking-website/](https://www.websitebuilderexpert.com/building-websites/how-to-make-a-booking-website/)  
150. Unlock the power of online bookings: A step-by-step guide to building a website with a booking system | Calendesk, accessed April 30, 2025, [https://calendesk.com/blog/unlock-the-power-of-online-bookings-a-step-by-step-guide-to-building-a-website-with-a-booking-system](https://calendesk.com/blog/unlock-the-power-of-online-bookings-a-step-by-step-guide-to-building-a-website-with-a-booking-system)  
151. Create an Online Booking System In 3 Steps \- Five, accessed April 30, 2025, [https://five.co/blog/create-an-online-booking-system/](https://five.co/blog/create-an-online-booking-system/)  
152. How to Make a Booking Website \- Square, accessed April 30, 2025, [https://squareup.com/us/en/the-bottom-line/selling-anywhere/make-booking-website](https://squareup.com/us/en/the-bottom-line/selling-anywhere/make-booking-website)  
153. From Bits to Beds: Design and Implementation of a Hotel Booking System A Coding Project \- Sycamore Scholars, accessed April 30, 2025, [https://scholars.indianastate.edu/cgi/viewcontent.cgi?article=1001\&context=honorsp](https://scholars.indianastate.edu/cgi/viewcontent.cgi?article=1001&context=honorsp)  
154. How complex is developing a hotel booking engine (with client-end mobile app) for several properties? : r/webdev \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/webdev/comments/kx2vbl/how\_complex\_is\_developing\_a\_hotel\_booking\_engine/](https://www.reddit.com/r/webdev/comments/kx2vbl/how_complex_is_developing_a_hotel_booking_engine/)  
155. How to Build a Time-Saving Appointment and Event Booking Website | Codrops, accessed April 30, 2025, [https://tympanus.net/codrops/2020/03/19/how-to-build-a-time-saving-appointment-and-event-booking-website/](https://tympanus.net/codrops/2020/03/19/how-to-build-a-time-saving-appointment-and-event-booking-website/)  
156. Making someone a website with appointment booking feature : r/webdev \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/webdev/comments/tnwkr9/making\_someone\_a\_website\_with\_appointment\_booking/](https://www.reddit.com/r/webdev/comments/tnwkr9/making_someone_a_website_with_appointment_booking/)  
157. Build A Booking Calendar App From Scratch (Step by Step Tutorial) \- YouTube, accessed April 30, 2025, [https://m.youtube.com/watch?v=DD2Ds3NOOXQ\&pp=ygUJI2Jvb2vEsW5n](https://m.youtube.com/watch?v=DD2Ds3NOOXQ&pp=ygUJI2Jvb2vEsW5n)  
158. Software development effort estimation \- Wikipedia, accessed April 30, 2025, [https://en.wikipedia.org/wiki/Software\_development\_effort\_estimation](https://en.wikipedia.org/wiki/Software_development_effort_estimation)  
159. Rules of Thumb for Software Development Estimations : r/programming \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/programming/comments/134z77q/rules\_of\_thumb\_for\_software\_development/](https://www.reddit.com/r/programming/comments/134z77q/rules_of_thumb_for_software_development/)  
160. The Ultimate Guide to Software Development Time Estimation \- Syndell, accessed April 30, 2025, [https://syndelltech.com/software-development-time-estimation/](https://syndelltech.com/software-development-time-estimation/)  
161. The Complete Guide on Software Development Time Estimation \- TimeCamp, accessed April 30, 2025, [https://www.timecamp.com/blog/the-complete-guide-on-software-development-time-estimation/](https://www.timecamp.com/blog/the-complete-guide-on-software-development-time-estimation/)  
162. Estimating Software Development Projects: 9 Techniques \- Atomic Object, accessed April 30, 2025, [https://atomicobject.com/client-resources/better-custom-software-estimates](https://atomicobject.com/client-resources/better-custom-software-estimates)  
163. How to do L1, L2, L3 effort estimation for Applications Support, accessed April 30, 2025, [https://pm.stackexchange.com/questions/25002/how-to-do-l1-l2-l3-effort-estimation-for-applications-support](https://pm.stackexchange.com/questions/25002/how-to-do-l1-l2-l3-effort-estimation-for-applications-support)  
164. How do you estimate software development efforts? : r/ExperiencedDevs \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/ExperiencedDevs/comments/12vb9yd/how\_do\_you\_estimate\_software\_development\_efforts/](https://www.reddit.com/r/ExperiencedDevs/comments/12vb9yd/how_do_you_estimate_software_development_efforts/)  
165. Software Estimation: Demystifying the Black Art (Developer Best Practices) \- Amazon.com, accessed April 30, 2025, [https://www.amazon.com/Software-Estimation-Demystifying-Developer-Practices/dp/0735605351](https://www.amazon.com/Software-Estimation-Demystifying-Developer-Practices/dp/0735605351)  
166. How much would it cost to create an employee scheduling software? \- Reddit, accessed April 30, 2025, [https://www.reddit.com/r/learnprogramming/comments/1iudtgk/how\_much\_would\_it\_cost\_to\_create\_an\_employee/](https://www.reddit.com/r/learnprogramming/comments/1iudtgk/how_much_would_it_cost_to_create_an_employee/)