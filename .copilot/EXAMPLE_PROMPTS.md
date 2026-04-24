# Example Prompts für GitHub Copilot Agents

Verwende diese Beispiel-Prompts als Template für deine eigenen Anfragen.

---

## 🎯 Feature Request (via Coordinator)

### Example 1: Simple UI Feature

```
@coordinator

Goal: Add a recipe search box to the recipe list page
Business Value: Users can find recipes by name without scrolling
Scope In: Search input field, real-time filtering, URL state sync
Scope Out: Advanced filters (next P1 feature)
Constraints: Keep search responsive (<200ms), search in recipe.title + description only
Timeline: P1, target this week if possible

Acceptance Criteria:
1. Search input on recipe list page
2. Typing filters recipes in real-time
3. URL updates with ?search=query parameter
4. Clearing search restores all recipes
```

Coordinator wird planen:
- UI Designer: Search box layout + states
- Security Expert: XSS prevention
- Testing Agent: Test scenarios
- Feature Developer: Implementation
- Code Reviewer: Final check

---

### Example 2: Backend Feature

```
@coordinator

Goal: Implement Recipe deletion by owner
Business Value: Users can manage their own content lifecycle
Scope In: DELETE API endpoint, ownership check, permission enforcement
Scope Out: Admin hard-delete (different scope), audit trails (P2)
Constraints: RBAC: members delete own only, editors/admins delete any
Timeline: P0 Foundation, ASAP

Acceptance Criteria:
1. Members can delete own recipes via API
2. Members cannot delete other users' recipes (403)
3. Editors+ can delete any recipe
4. Deleted recipes removed from database
5. Delete button only shows on owner's recipes in UI
```

---

### Example 3: Complex Feature

```
@coordinator

Goal: Implement Recipe Rating System
Business Value: Users can rate recipes, helps surface good content
Scope In: 
  - 5-star rating component
  - Save ratings to database
  - Show average rating on recipe cards
Scope Out:
  - Reviews (just ratings)
  - Rating-based recommendations (P2)
Constraints:
  - Only members can rate (guests see ratings but can't rate)
  - Users can change their rating anytime
  - Don't show individual rater names (privacy)
Timeline: P1, 2x 1-hour sessions

Acceptance Criteria:
1. Members see star rating component on recipe detail
2. Members can rate and see their rating persist
3. Average rating shows on recipe cards (1 decimal: 4.3 stars)
4. Guests see ratings but can't interact
5. Database stores ratings securely (user_id, recipe_id, stars)
```

---

## 🧪 Test Scenarios (via Testing Agent)

```
@testing-agent

Feature: Delete Recipe

Please define failing tests for:
1. Happy path: Member deletes own recipe → 200, recipe gone
2. Security boundary: Member deletes other's recipe → 403 Forbidden
3. Security boundary: Guest tries to delete → 401 Unauthorized
4. Edge case: Delete non-existent recipe → 404 Not Found
5. Regression: Other recipes unaffected after delete

For each test:
- Specify test file location
- Test name (what it checks)
- Initial fail reason
- Expected pass condition
```

---

## 🔐 Security Validation (via Security Expert)

```
@security-expert

Please review this authentication flow for vulnerabilities:

User signup:
1. User enters email + password on signup form
2. Frontend sends to POST /auth/signup
3. Backend hashes password with bcrypt
4. Backend stores user + hashed password in database
5. Backend generates JWT token
6. Frontend stores JWT in localStorage

Concerns:
- Is JWT in localStorage safe?
- What about password reset?
- Should we use HTTP-only cookies instead?
```

---

## 🏗️ Architecture Question (via Solution Architect)

```
@solution-architect

We need to implement recipe search with filtering.

Questions:
1. API design: What query parameters?
2. Database: Full-text search or LIKE queries?
3. Pagination: Limit/offset or cursor-based?
4. Frontend state: Sync search state with URL?
5. Performance: Caching strategy if applicable?

Timeline: We have 2-3 hours to design.
```

---

## 🎨 UX/Design (via UI Designer)

```
@ui-designer

Screen: Recipe Upload Form

User Goal: User wants to create a new recipe with:
- Title, description
- Ingredients list (add/remove rows)
- Cooking steps (add/remove rows)
- Upload recipe image
- Select category

Please specify:
- Component layout
- Responsive behavior (mobile -> desktop)
- Loading states during upload
- Error states (invalid input, upload failed)
- Success state (where do we navigate after?)
- Keyboard accessibility
```

---

## 🔍 Discovery (via Researcher)

```
@researcher

Question: Should we do JWT or HTTP-only Cookie auth?

Please research:
1. What are the tradeoffs?
2. Which is more secure for SPAs?
3. Which works better with cloud deployment?
4. What do modern projects use?
5. What's the easiest to maintain in Chellys Kitchen?

Context: We have React frontend + Node.js backend
```

---

## 📝 Code Review (via Code Reviewer)

```
@code-reviewer

Please review this recipe deletion feature for:
1. Correctness (does it work as designed?)
2. Security (ownership checks, permission enforcement)
3. Test coverage (are tests adequate?)
4. Regressions (could this break existing features?)
5. Code quality (clarity, maintainability)

Files changed:
- backend/src/api/recipes.ts (DELETE endpoint)
- frontend/src/pages/RecipeDetailPage.tsx (delete button + modal)
- frontend/src/pages/__tests__/RecipeDetailPage.test.tsx (tests)

Test results: All passing

Let me know if anything blocks merge.
```

---

## 🎯 Direct Developer Questions

### For Feature Developer
```
@feature-developer

The tests are ready for recipe deletion.
Can you implement the DELETE /recipes/:id endpoint?

Tests are in: backend/recipes.test.mjs
Expected: All tests pass after implementation
Pattern to follow: Like existing GET /recipes/:id pattern
Constraints: Use PostgreSQL, check ownership in backend
```

### For Testing Agent
```
@testing-agent

These tests for recipe creation feel incomplete.
Can you add test cases for:
1. Admin can create recipes for other users
2. Editor can edit any recipe
3. Concurrent recipe creation
```

### For UI Designer
```
@ui-designer

The design spec for recipe list is unclear on mobile.
How should the recipe cards layout on small screens?
- Stack vertically 1 per row?
- 2 per row?
- Full width with horizontal scroll?

Also, where should the search box go on mobile?
```

---

## 📊 Requests by Role

### If You're a Product Manager
- Use `@coordinator` for all feature planning
- Let it orchestrate the specialists
- You'll get a coherent plan

### If You're a Developer
- Use `@feature-developer` for implementation
- Use `@testing-agent` to understand what to build
- Use `@code-reviewer` before pushing code
- Use `@coordinator` for complex/uncertain tasks

### If You're Leading Security
- Use `@security-expert` for all auth flows
- Use `@coordinator` for security implications of features
- Use `@researcher` for security tech decisions

### If You're Doing Code Review
- Use `@code-reviewer` for automated checks
- Mention specific concerns: performance, security, maintainability

---

## ✅ Complete Example Workflow

```
DAY 1 - PLANNING

User: @coordinator
Goal: Implement recipe favoriting for users
Business Value: Users can save favorite recipes to come back to
Scope In: Heart icon on cards, favorites list, database persistence
Scope Out: Favorites recommendations (future P2)
Timeline: P1, this week

[Coordinator plans and delegates...]

---

DAY 1 - DESIGN

UI Designer: Heart icon, toggle behavior, favorites page layout
Security Expert: Favorites are private (only own visible)
Testing Agent: Test scenarios defined

---

DAY 2 - IMPLEMENTATION

Feature Developer: Implements based on tests (Red → Green)
Tests passing: ✅

---

DAY 2 - REVIEW

Code Reviewer: Approves, no issues found

---

DAY 2 - DEPLOY

Code merged to main, deployed to staging/production
```

---

## 💡 Tips

1. **Be specific** - "Implement recipe creation" is vague
   - Better: "Users create recipes with title + ingredients + steps, modal form"

2. **Define done early** - What does success look like?
   - Document acceptance criteria before starting

3. **Ask why, not just what** - Give context
   - Better: "Why? Users are frustrated finding recipes"

4. **Use coordinator for complex work** - It saves time
   - Coordinator planning 30 min → saves 2-3 hours in implementation

5. **Keep tests first** - Testing Agent then Feature Developer
   - Red tests first → Green implementation → Code review

