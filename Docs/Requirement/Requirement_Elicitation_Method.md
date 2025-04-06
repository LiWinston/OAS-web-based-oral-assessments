# Requirement Elicitation Methods

## Steps

| Step | Description | Elaboration |
|------|-------------|-------------|
| 1 | **Identify Stakeholders** | Identify administrators, examiners and students involved in the online assessment platform project to ensure comprehensive needs coverage. |
| 2 | **List all requirements** | Collect and document the client's explicit and implicit requirements based on the provided overview and meeting notes. |
| 3 | **Assign importance to each requirement** | Use the MoSCoW prioritization (Must Have, Should Have, Could Have, Won’t Have) to make stakeholder value demands explicit. |
| 4 | **Categorize Final Requirements** | The requirements are divided into functional and non-functional, which facilitates structured development. |

---

## Prepare

### Prepare Resources

- #### **Understand the Client’s Business**
  In-depth research on the education assessment process, including Canvas platform integration methods and academic scoring standards.

- #### **Review Existing Documentation**
  Study the provided project documentation carefully to ensure thorough and consistent understanding and to avoid unnecessary work.

- #### **Set Clear Objectives**
  Define the goal of the meetings, implement the content of each meeting, and ensure that the task of each sprint is completed.

- #### **Set up Kanban**
  Utilize Kanban in Github to manage tasks, sprints, and overall project progress. The tool helps to track the development process and ensure team accountability.

---

### Prepare Questions

#### User Flow / Feature Description
- Are there any existing systems or tools currently being used that we should be aware of? (Current way of doing thing)
- What level of customization is needed for feedback templates and rubrics? Can you explain this customization process in detail?
- Can you describe an ideal student booking experience? Also, an ideal examiner marking experience? (The interaction between system, admin, examiner, and student)
- How should the system handle group vs. individual assessment components? (Any difference?)
- How should the system handle assessment rescheduling or cancellations? Could you please provide an ideal rescheduling and cancellation user interaction? (include system behavior, e.g. no-more reschedule available after a certain time frame, administrator approval, notifications when new spots are open, etc.)
- What specific data needs to be captured during the assessment?

#### Canvas Integration
- Can you provide more details about the Canvas integration requirements? (“smooth data exchange”: please specify what data should be able to be exchanged via canvas, as well as what the process needs to be. i.e. from admin or each user manually or automated)
- Do we need to integrate with Unimelb SSO for students to log in? If yes, how about booking group assignments, are every student in a group able to book/cancel the slot for the group? How do we know each students’ group?
- How exactly does it need to be integrated with canvas? E.g. Only SSO Login? UI? Is there any example? (Feedback fruit?)

#### Tech Stack, System, Tools Selection
- Should the application's UI primarily be designed for web-based or mobile platforms?
- Do you have any preferences for deployment or hosting? Are there specific server or cloud service providers you prefer?

#### Feature Priority
- Which features are absolute must-haves versus nice-to-haves?

#### Data Security and Privacy
- What are your expectations regarding data security and privacy?
- For collecting data, do we need to provide a Unimelb private policy page for students to sign/agree?
- Need an example of data format for “student data csv” (are professors able to get this data easily from the uni system?)
- Need an example of data format for “generate a Canvas-compatible CSV file”.

#### Others
- Are there any additional systems this platform should integrate with?
- How would you like to approach user testing and feedback during development?

These questions will be clearly answered in the client interview, and the project content will be clarified according to the answers combined with the project description.

---

### Interview Strategy

- #### Semi-structured Interviews
  Semi-structured interviews can flexibly adjust the direction of questioning and dig into the details of requirements while systematically covering the predefined topics.

---

## Perform

### Client Meeting

- #### Meeting Details
  Clearly documented meeting minutes capturing detailed client requirements.

- #### Approach
  Prepare structured questions in advance to ensure comprehensive requirements elicitation (See Prepare Questions in the Prepare section for details).

- #### Others
  [*Record for the first client meeting (21/03/2025)*](https://unimelb.zoom.us/rec/share/h8NYR-Qk0mKuzVJLqdAZBL43MP-W311jedwkJOMfseRsseMTV5g0DP1W1H6VSTGR.ro7c3XlSYSJQXTEk)
  Passcode: yi93Hn&n

---

### Team Meeting

- #### Frequency and Location
  It usually takes place every Saturday at 2 p.m. Conducted via Zoom live meeting.

- #### Approach
  Analyze the requirements proposed by the client to ensure the unified understanding of the requirements within the team. Identify tasks that are currently completed, in progress, and not started. Create or adjust strategy for the next step.

- #### Others
  [*Record for the first team (urgent) meeting (22/03/2025)*](https://unimelb.zoom.us/rec/share/VKa0QwglL76NQy8TMQ2sRZnsK3Vzc8LIFLKmHj4BpwbkwwWwofIxbjPe935WGjfC.79l0sb6OE2o61DDw)
  Passcode: Xk3xYd?r

---

### Stand-up Meeting

- #### Frequency and Location
  It usually takes place every Thursday morning at 9 a.m. Will be held at Melbourne Connect Level 8 room 8109.

- #### Approach
  Update requirements to get progress status. Get a quick overview of the team's performance on tasks. Solve problems the team faces.

- #### Others
  Meetings must be attended in person in order to better communicate progress and ensure the smooth completion of the tasks. Meetings won’t be recorded.

---

### Requirement Elicitation Techniques

| Technique      | Description                                                                                                                                                     | Included |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| Interviews     | Conduct remote meetings with client to directly ask for requirements. Dig into the client's thoughts, record the details, and clarify the context of requirements. | Yes      |
| Workshops      | Group interactive discussions with stakeholders are not in the project scope.                                                                                   | No       |
| Focus Groups   | Organizing specific groups of users or stakeholders to focus discussion on specific topics is not in the project scope.                                          | No       |
| Observations   | There are currently no existing available products for process observation and documentation.                                                                    | No       |
| Questionnaires | There is no established relatively large user group, no need for questionnaire survey.                                                                           | No       |
| System Analysis| There are currently no existing available products for system analysis.                                                                                         | No       |
| UI Analysis    | After completing the Figma prototype, analyze and optimize the user experience of the system to ensure that the system is easy to understand and operate.         | Yes      |
| Document Analysis | Systematically identify and summarize requirements by reviewing project profiles, requirements documents, client meeting records, and other relevant materials provided by the client to ensure that the requirements are complete and consistent with the client's initial expectations. | Yes      |

---

## Output of Elicitation

### Stakeholders Identification

#### Primary Stakeholders

- **Students**
- **Examiners (Tutors)**
- **Administrators (Subject Coordinators)**
- **Client (Hasti Samadi, CIS Melbourne)**

#### Secondary Stakeholders

- **University IT Department**
- **Faculty Administration**
- **University Privacy Officer**
- **Canvas LMS Support Team**

#### Tertiary Stakeholders

- **Future System Maintainers**
- **Other Academic Departments**

Detailed in [*Stakeholder Analysis*](../Stakeholder_Analysis.md).

---

### Overall Requirements Output
After requirement elicitation, the collected requirements are summarized in the table:
| Req ID | User Role      | Requirement Description                                                                                              | Size   | Priority   |
|--------|----------------|----------------------------------------------------------------------------------------------------------------------|--------|------------|
| 1.1    | Administrator  | Upload a CSV file containing student and group information for automatic data import.                                | Medium | Must Have  |
| 1.2    | Administrator  | Re-upload a CSV file to update student or group information to ensure data accuracy.                                   | Medium | Must Have  |
| 1.3    | Administrator  | Preview changes before overwriting during CSV re-upload to prevent data errors.                                      | Large  | Could Have |
| 1.4    | Administrator  | Export a Canvas-compatible CSV file for uploading assessment results to the LMS.                                     | Medium | Must Have  |
| 2.1    | Student        | Create an account in the system to access features appropriate for the role.                                         | Small  | Must Have  |
| 2.2    | User           | Log in securely to the system to protect user data and actions.                                                      | Small  | Must Have  |
| 3.1    | Examiner       | View assigned assessments to know when and where to conduct them.                                                    | Small  | Must Have  |
| 3.4    | Examiner       | Provide individual feedback for students to assess personal performance.                                             | Large  | Must Have  |
| 5.1    | Administrator  | Define available time slots (date, time) and locations for oral assessments linked to specific assignments.            | Medium | Must Have  |
| 6.1    | Administrator  | View and calculate total marks based on rubric components and a grading algorithm for an accurate final grade.         | Large  | Must Have  |

The complete table is detailed in [*User Story*](./user_stories.md).
The priorities are determined in accordance with MoSCoW prioritisation.

---

### Project Scope Definition

#### In-Scope
- **User Account Management**
- **Assessment Configuration**
- **Scheduling and Booking**
- **Assessment Execution**
- **Mark Management and Reporting**
- **Integration with Canvas LMS**
- **Notification System**
- **System Security and Compliance**

  
#### Out-of-Scope
- **Direct Integration with University Systems**
- **Mobile Application Development**
- **Advanced Analytics and Reporting**
- **Automated Grading or AI-Assisted Assessment**
- **Live Video Assessment Capabilities**

Detailed in **Project Scope Statement** section from [*Project Backround*](../Project_Background.md).

---

## Follow Up

### Organize & Share
- [**Project Background**](../Project_Background.md)  
Provide an overview of the project background and the initial requirements collected.

- **Documentation and Analysis for Meetings or Updates**  
[*20_03 Draft Mentor & Client meeting minutes.docx*](https://docs.google.com/document/d/1BrEN_26Kv2GFaYCKYCaGpbpFoAsZmLfBX2_fW6mLC80/edit?tab=t.0)
