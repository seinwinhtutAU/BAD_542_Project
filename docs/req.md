Worth: 20%

Proposal: 5%

Presentation: 5%

Project Quality: 10%

Team: Max 3 students

Due date: Wednesday, 23 September 2026 (2 Months)

Project Selection: You are free to choose any project domain you wish (e.g., E-commerce, Social Media, Logistics, EdTech). However, regardless of the domain, your project must strictly fulfill all the Core Requirements listed below.

Core Requirements to hit Course Objectives

Infrastructure: Deployed on a hardened Linux VPS (Oracle Cloud or Azure).

Networking & Deployment: Exposed via Nginx Reverse Proxy with Let's Encrypt SSL. The project must be deployed under a new, distinct URL path (e.g., https://your-domain.com/project). This requires writing custom Nginx location blocks or Docker port mappings that do not break your existing /content (WordPress) or /api (Lab) routes.

Backend: Node.js (Express) or Go REST API.

Database: Relational Database (MySQL/PostgreSQL) managed via Prisma ORM with migrations.

Security & Identity (User Auth): JWT Authentication with Role-Based Access Control (RBAC),

integrating the University's Microsoft Active Directory (AD) for user authentication (using MSAL, OAuth2, or OIDC).

Secrets Management (Azure Key Vault): You must NOT use local .env files for production secrets. Instead, your application must authenticate with the centralized Class Azure Key Vault server (credentials will be provided) to securely fetch your database connection strings, JWT secrets, and API keys at runtime.

External Integration (3rd Party): The backend must connect to and utilize at least one external public API or AI service (e.g., OpenAI, Gemini, Google Maps, SendGrid, Weather API) to augment its business logic.

Service-to-Service Integration (Peer API): You must partner with another student/team in the class.

Expose: You must build an endpoint specifically for their backend to consume. This endpoint must be protected by a static API Key (e.g., expecting an x-api-key header) that you generate and issue exclusively to them.

Consume: Your backend must fetch and utilize data from their API, authenticating your requests using the API Key they issued to you.

Source Code Management: All code must be hosted in a GitHub repository.

Automation: Automated deployment script (or Docker Compose).

Project Deliverables & Submission

To successfully complete this project, you must submit the following:

Proposal 5%

Due Date: Wednesday, 22 July 2026

A document outlining your project domain, database schema (ERD), intended RBAC roles, and the specific APIs (both 3rd Party and Peer API) you plan to integrate.

Look like: Design Doc

Video Presentation 5%

Record a maximum 10-minute video demonstrating your live, deployed project.

Walk through your codebase (specifically highlighting the Azure Key Vault integration and Prisma schema).

Demonstrate the successful execution of core required features..

Submit the video link directly in the designated MS Teams assignment.

Project Components 10%

GitHub Repository 5%

Your complete source code.

A professional, well-formed README.md that includes:

Architecture overview and setup instructions.

Peer API Documentation: Explicitly state which classmate's API you are consuming, what data you are fetching, and what endpoint you have exposed for them.

Live system for testing 5%
