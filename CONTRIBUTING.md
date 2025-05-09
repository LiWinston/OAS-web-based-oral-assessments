# Contributing Guidelines

## Documentation

Add them in `Docs/`.

## Git Usage Standards for Development

This document outlines the standardized practices for using Git in our development workflow. Adhering to these standards will help maintain a clean, understandable, and efficient version control history, facilitating collaboration and ensuring code quality.

### I. Branching Strategy

Our branching strategy is designed to maintain stable `main` and `dev` branches while allowing for flexible feature development.

*   **`main` Branch:**
    *   This branch represents the production-ready code.
    *   **Only linear commits are allowed.** This means no merge commits directly into `main`.
    *   **Force pushing is strictly prohibited** to prevent history rewriting of the production code.
    *   All changes must be merged via Pull Requests (PRs) using a **squash merge**.
        *   **Why we chose this:** Squashing commits keeps the `main` branch history clean and concise. Each merge represents a complete feature or fix, making it easier to understand the history and revert changes if necessary.

*   **`dev` Branch:**
    *   This branch serves as the primary integration branch for ongoing development.
    *   **Only linear commits are allowed.** This means no merge commits directly into `dev`.
    *   **Force pushing is strictly prohibited** to prevent history rewriting of the integration branch.
    *   All changes must be merged via Pull Requests (PRs) using a **rebase merge**.
        *   **Why we chose this:** Rebasing ensures that commits from feature branches are applied on top of the latest `dev` branch changes, maintaining a linear and cleaner history. This makes it easier to follow the progression of development.

*   **Feature Branches:**
    *   All new development, including features, bug fixes, and documentation, must be done in separate feature branches.
    *   **Creation:** Feature branches **must be created directly from the GitHub Project board**. This ensures direct traceability between tasks and code changes.
    *   **Staying Updated:** Developers should regularly merge the remote `dev` branch into their feature branch to keep it up-to-date with the latest changes and resolve conflicts locally.
        ```bash
        git checkout feature-branch
        git fetch origin
        git merge origin/dev
        ```
    *   **Force Pushing:** Force pushing (`git push --force-with-lease`) **is allowed on your own feature branches**. This is useful for cleaning up your commit history (e.g., interactive rebase) before creating a PR.
        *   **Why we chose this:** Allows developers to maintain a clean and logical commit history within their feature branches before proposing changes for review, making the review process smoother.

### II. Commit Practices

Clean and descriptive commit messages are crucial for understanding the project's history.

*   **Commit Messages:**
    *   Commit messages **must follow the Conventional Commits specification**. This provides a standardized format for commit messages, making them more readable and enabling automated changelog generation.
    *   **Format:** `<type>([optional scope]): <description>`
    *   **Common Types:**
        *   `feat:` (new feature for the user, not a new feature for build script)
        *   `fix:` (bug fix for the user, not a fix to a build script)
        *   `docs:` (changes to the documentation)
        *   `style:` (formatting, missing semi colons, etc.; no production code change)
        *   `refactor:` (refactoring production code, e.g. renaming a variable)
        *   `test:` (adding missing tests, refactoring tests; no production code change)
        *   `chore:` (updating grunt tasks etc; no production code change)
        *   `perf:` (changes that improve performance)
        *   `ci:` (changes to CI configuration files and scripts)
        *   `build:` (changes that affect the build system or external dependencies)
        *   `revert:` (reverts a previous commit)
    *   The description should be meaningful as it will be part of the squashed commit message on `main` or the rebased commits on `dev`.
        *   **Why we chose this:** Standardized commit messages improve readability, help in quickly understanding the nature of changes, and can be used by tools for automated tasks like changelog generation.

### III. Pull Request (PR) Process

All code changes intended for `main` or `dev` branches must go through a Pull Request process.

*   **Target Branches:** PRs should target either the `dev` branch (for ongoing development) or, in specific controlled cases (e.g., hotfixes), the `main` branch.
*   **PR Creation:**
    *   Ensure your feature branch is up-to-date with the target branch (`dev` or `main`) before creating a PR.
    *   Provide a clear and descriptive title and summary for the PR, outlining the changes made and the problem it solves.
*   **PR Requirements (Common to both `main` and `dev` targeted PRs):**
    *   **Assignees:** At least one assignee must be designated for the PR. This is typically the author or the person primarily responsible for the changes.
    *   **Reviewers:** A minimum of **two reviewers** must be selected for each PR.
        *   **Why we chose this:** Multiple reviewers increase the likelihood of catching bugs, improving code quality, and sharing knowledge across the team.
    *   **Linked Issues:** PRs **must be linked to the corresponding issue(s)** on the GitHub Project board.
        *   **Why we chose this:** Maintains a clear link between the planned work and the implemented code, improving project tracking and traceability.
    *   **Labels:** Appropriate labels (e.g., `documentation`, `bug`, `feature`, `enhancement`, `needs-testing`) must be added to the PR.
        *   **Why we chose this:** Labels help in organizing, prioritizing, and filtering PRs, providing a quick understanding of the PR's content and status.
    *   **Require approval of the most recent reviewable push:** This setting is enabled.
        *   **Why we chose this:** Ensures that any new changes pushed to the PR after a review has been submitted must also be approved, preventing unreviewed code from being merged.
    *   **Require conversation resolution before merging:** This setting is enabled.
        *   **Why we chose this:** Ensures all review comments and discussions are addressed and resolved before the PR can be merged, promoting thorough reviews and clear communication.
    *   **Request pull request review from Copilot:** This setting is enabled.
        *   **Why we chose this:** Leverages AI to automatically request reviews, potentially speeding up the review process and providing initial feedback.

#### A. Specific Rules for PRs targeting `main`

*   **Required Approvals:** A minimum of **4 approving reviews** are required before a PR can be merged into `main`.
*   **Dismiss stale pull request approvals when new commits are pushed:** This setting is **NOT** enabled.
*   **Require review from Code Owners:** This setting is **NOT** enabled.
*   **Allowed Merge Method:** **Squash**
    *   **Why we chose this:** As mentioned earlier, squashing keeps the `main` branch history clean and focused on completed features/fixes. The detailed commit history remains in the (now closed) PR and the squashed feature branch.

#### B. Specific Rules for PRs targeting `dev`

*   **Required Approvals:** A minimum of **2 approving reviews** are required before a PR can be merged into `dev`.
*   **Dismiss stale pull request approvals when new commits are pushed:** This setting is **NOT** enabled.
*   **Require review from Code Owners:** This setting **IS** enabled.
    *   **Why we chose this:** Ensures that designated owners for specific parts of the codebase review changes affecting their areas of responsibility, promoting code quality and domain expertise oversight.
*   **Allowed Merge Method:** **Rebase**
    *   **Why we chose this:** Rebasing integrates the feature branch commits onto the `dev` branch tip, creating a linear history without merge commits. This makes the history easier to read and follow sequentially.

### IV. GitHub Project Integration

*   **Task Management:** All development tasks should originate from and be tracked on the GitHub Project board.
*   **Branch Creation:** As stated, create feature branches directly from the GitHub Project board to automatically link the work.

### Summary of Why These Choices Benefit Us:

*   **Clean and Readable History:** Linear history on `main` and `dev`, along with squash and rebase strategies, makes it easy to understand the project's evolution.
*   **Improved Code Quality:** Mandatory PRs, multiple reviewers, Code Owner reviews (for `dev`), and required conversation resolution ensure thorough vetting of code.
*   **Enhanced Collaboration:** Clear processes and tools like GitHub Projects facilitate better teamwork and communication.
*   **Traceability:** Linking PRs to issues provides a clear audit trail from task creation to code integration.
*   **Developer Autonomy on Feature Branches:** Allowing force pushes on feature branches empowers developers to refine their work before review.
*   **Meaningful Commits:** Conventional Commits standardizes messages for clarity and automation potential.

By adhering to these Git usage standards, we aim to create a more robust, maintainable, and collaborative development environment.