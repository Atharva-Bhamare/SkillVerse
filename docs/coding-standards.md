# SkillVerse Coding Standards

Version: 1.0

Last Updated: 26 June 2026

---

# 1. Project Philosophy

SkillVerse is an industry-level SaaS application.

Every implementation should prioritize:

- Readability
- Scalability
- Security
- Maintainability
- Consistency

If there are two solutions:

- One is shorter.
- One is cleaner.

Always choose the cleaner solution.

---

# 2. Folder Naming Convention

Use lowercase folder names.

Example:

controllers/
middlewares/
services/
routes/
validators/
utils/

Avoid:

Controllers/
Middlewares/
Utils/

---

# 3. File Naming Convention

Use:

feature.type.js

Examples:

auth.controller.js
auth.service.js
auth.routes.js
auth.middleware.js
user.model.js

---

# 4. Import Order

1. External Packages
2. Configuration
3. Models
4. Services
5. Utilities

---

# 5. Function Naming

Good:

createUser()
loginUser()
generateToken()

Avoid:

run()
handle()
check()

---

# 6. Variable Naming

Boolean:

isVerified
isAdmin

Arrays:

users
applications

Objects:

user
company

---

# 7. Constants

Never hardcode strings.

Use:

ROLES.STUDENT

Instead of:

"student"

---

# 8. Error Messages

Error messages should clearly explain the issue.

Good:

User not found.

Better:

User with email "example@email.com" not found.

---

# 9. Standard API Response

Success

{
  "success": true,
  "message": "...",
  "data": {}
}

Failure

{
  "success": false,
  "message": "...",
  "errors": []
}

---

# 10. Comments

Comment WHY the code exists.

Avoid commenting WHAT the code does.

---

# 11. Logging

Never use console.log() in production code.

Use the centralized logger.

---

# 12. Git Commit Convention

Examples:

feat(auth): implement JWT authentication

fix(auth): validate login credentials

refactor(config): improve environment validation

docs(setup): update installation guide

---

# 13. Security

Never commit:

- .env
- Passwords
- API Keys
- Secrets

Always validate user input on the backend.

---

# 14. Development Workflow

Requirement

↓

Architecture

↓

Implementation

↓

Testing

↓

Debugging

↓

Documentation

↓

Git Commit

---

This document will evolve as SkillVerse grows.