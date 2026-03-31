
# CodeVerse Project Diary

This document tracks the progress, decisions, and milestones in the development of the CodeVerse platform.

---

### **Week 1-2: Conceptualization & Technology Stack**
*   **Objective:** Define the core problem and project goals. Select the technology stack.
*   **Activities:**
    *   Identified the core problem: Learning to code is often disengaging and lacks immediate feedback.
    *   Brainstormed the core solution: A platform that merges gamified learning with AI-powered tutoring.
    *   **Decision:** Selected the tech stack:
        *   **Next.js:** For its robust framework, server-side rendering, and strong React ecosystem.
        *   **Supabase:** Chosen as an all-in-one backend solution (PostgreSQL DB, Auth, Storage) to simplify development and ensure scalability.
        *   **Tailwind CSS & ShadCN UI:** For rapid, utility-first styling and a professional component library.
        *   **Google Genkit & Gemini:** Selected for AI integration due to its structured flow management and powerful generative capabilities.
*   **Outcome:** A clear project vision and a modern, cohesive technology stack. Initial project scaffolding was created.

---

### **Week 3-4: Core Data Structures & Authentication**
*   **Objective:** Set up the database schema and user authentication.
*   **Activities:**
    *   Designed the database schema in Supabase, defining tables for `courses`, `chapters`, `topics`, `users` (profiles), and `games`.
    *   Implemented user sign-up and login functionality using Supabase Auth. Created middleware to protect authenticated routes (like the dashboard) and admin routes.
    *   Developed the initial layouts for the main application (`AppLayout`) and the administrative area (`AdminLayout`).
*   **Outcome:** A secure application with a solid data foundation. Users can register, log in, and access different parts of the app based on their role.

---

### **Week 5-6: Admin Panel & Course Management (CRUD)**
*   **Objective:** Build the administrative backend to manage platform content.
*   **Activities:**
    *   Developed a full CRUD (Create, Read, Update, Delete) interface for Courses. The AI partner generated the forms and server actions needed to handle these operations.
    *   Implemented the complex, multi-level form for creating and editing courses, including adding chapters and topics dynamically.
    *   Integrated the first AI feature: An "AI Generate Description" button in the course creation form, which calls a Genkit flow to write a compelling course summary based on the title.
*   **Outcome:** A functional admin panel allowing for complete control over the learning content on the platform.

---

### **Week 7-8: Game Management & The Playground Concept**
*   **Objective:** Build the management system for the coding games and start developing the game interface.
*   **Activities:**
    *   Designed and implemented the database schema for `games`, `game_chapters`, and `game_levels`.
    *   Created the CRUD interface for managing games in the admin panel, mirroring the course management system.
    *   Developed the initial UI for the "Playground," including the game map concept for navigating through chapters and levels.
    *   **Key Challenge & Fix:** A bug was discovered where clicking a level on the game map incorrectly redirected to the dashboard. The issue was traced to a faulty enrollment check in the client component. The fix involved moving the auth/enrollment logic to the server-side page component, ensuring the correct data was available on initial render and preventing hydration errors.
*   **Outcome:** A system for creating coding games is in place, and the user-facing game map is functional.

---

### **Week 9-10 (up to October): Implementing Game Mechanics & AI Content**
*   **Objective:** Build the core gameplay loop and integrate AI for dynamic content.
*   **Activities:**
    *   Developed the "Code Bubble" game component (`CodeBubbleGame`). This involved creating the game loop, handling user input (shooting), collision detection, and managing game state (lives, score).
    *   **AI Integration:** Implemented the `generateDistractors` Genkit flow. This flow is called when a level starts, and it generates incorrect but plausible code snippets to act as "enemy" bubbles, making the game more challenging and educational.
    *   Implemented the system for awarding XP upon level completion. The `completeGameLevel` action was created to save a user's progress and update their total XP on their profile.
    *   **Key Challenge & Fix:** A persistent bug prevented the "Continue Playing" card from appearing on the dashboard. After several incorrect attempts, the root cause was identified: the `completeGameLevel` action was not being called with the correct `game_id`. The function signature was updated, and the call site on the game level page was corrected to pass the necessary ID, finally resolving the issue and ensuring progress was saved correctly.
*   **Outcome:** A fully playable game loop with dynamic, AI-generated challenges and a rewarding progression system. The dashboard now correctly reflects the user's ongoing game progress.

---

### **Next Steps**
*   Finalize the AI-powered code review feature for practice sessions.
*   Build out the user's public profile and leaderboard page.
*   Flesh out the remaining placeholder pages (Cart, Wishlist).
*   Conduct final testing and prepare for the PS1 exam presentation.
