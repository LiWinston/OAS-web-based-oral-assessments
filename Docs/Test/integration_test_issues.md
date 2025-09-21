## Integration Test Issues Summary (1–11)

| ID  | Page/Module                                   | Brief Issue Description                                                                 | Responsibility                             |
| --- | --------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Course Admin → Dashboard                      | Assignment Status Overview and Assessment Calendar show mock data, not real content      | Frontend (should request real API data)    |
| 2   | Dashboard → Getting Started Guide             | Clicking “Start Onboarding Journey” has no return button; behaves like reset but is fake | Frontend (interaction logic / feature design) |
| 3   | Create Assignment                             | Default Start/End Time is current time; client expects 00:00 for start, 23:59 for end    | Frontend (default values setting)          |
| 4   | Create Assignment → Upload Examiner CSV → Preview | CSV has 1 row, but returns `totalCount=2` (counting error)                              | Backend (data parsing/counting)            |
| 5   | Create Assignment → Summary                   | “Configure Components” is clickable but errors out; should be disabled. Button label wrongly shows “Time Slot” | Frontend (interaction + text) |
| 6   | Create Assignment → Weight input box          | Mouse wheel changes value and scrolls page simultaneously (bad UX)                      | Frontend (input control)                   |
| 7   | Assignment Card Display                       | Button label still shows “Time Slot”; student count missing (backend not returning data) | Frontend (label) + Backend (missing data) |
| 8   | User Management → Add single Student/Examiner | “Added on” date shows 1970/1/1 because return field is empty                            | Frontend (empty value handling) + Backend (wrong/missing data) |
| 9   | Registration Step 3/3 → Set Password          | Confirm Password field sometimes shows two “eye” icons                                  | Frontend (UI rendering duplication)        |
| 10  | Add Student to Course                         | Student does not receive email after joining course (optional feature)                  | Backend (notification mechanism, optional) |
| 11  | Multi-user login in same browser windows      | Later login overrides earlier user’s permission, causing previous account page errors   | Frontend (token storage or refresh mechanism) |
