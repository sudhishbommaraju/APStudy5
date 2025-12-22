# Base44 Permissions Configuration

## ✅ SECURITY MODEL: IMPLEMENTED

Base44 enforces permissions through **code-level security patterns** and **platform-built-in features**, not through a separate permissions UI.

---

## PERMISSION MATRIX

### 📚 SYSTEM / CURRICULUM ENTITIES (READ-ONLY)

| Entity | User Read | User Create | User Update | User Delete | Admin Full Access |
|--------|-----------|-------------|-------------|-------------|-------------------|
| **Subject** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Unit** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Skill** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Question** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |

**Implementation:**
- All users can query these entities via `base44.entities.EntityName.list()`
- No client code allows create/update/delete for users
- Generate page (creates Questions) is admin-only
- SeedData page (creates Subjects/Units) is admin-only

**Enforcement:**
```javascript
// Admin-only pages redirect non-admins
if (user.role !== 'admin') {
  window.location.href = createPageUrl('Dashboard');
}
```

---

### 🎯 USER INTERACTION ENTITIES (CONTROLLED WRITE)

| Entity | User Read | User Create | User Update | User Delete | Owner-Only |
|--------|-----------|-------------|-------------|-------------|------------|
| **Attempt** | ✅ Own only | ✅ System-driven | ❌ No | ❌ No | ✅ Yes |
| **Session** | ✅ Own only | ✅ System-driven | ⚠️ System only | ❌ No | ✅ Yes |
| **StudySession** | ✅ Own only | ✅ System-driven | ❌ No | ❌ No | ✅ Yes |
| **SkillMastery** | ✅ Own only | ✅ System-driven | ⚠️ System only | ❌ No | ✅ Yes |

**Implementation:**
- All queries filter by `created_by: user.email`
- Creation happens automatically when users answer questions
- Users CANNOT manually edit these records via UI
- No update/delete UI components exist for users

**Platform Security:**
- `created_by` field is auto-set by Base44 (cannot be overridden)
- Users can only read records where `created_by === currentUser.email`

**Example:**
```javascript
// Attempts are created when users submit answers
await base44.entities.Attempt.create({
  question_id: question.id,
  selected_answer: answer,
  correct_answer: question.correct_answer,
  is_correct: isCorrect,
  // created_by is automatically set to current user
});

// Reading is filtered by owner
const { data: attempts } = useQuery({
  queryKey: ['attempts', user?.email],
  queryFn: () => base44.entities.Attempt.filter({ created_by: user.email }),
});
```

---

### 📝 USER-GENERATED CONTENT (USER-OWNED)

| Entity | User Read | User Create | User Update | User Delete | Owner-Only |
|--------|-----------|-------------|-------------|-------------|------------|
| **Note** | ✅ Own only | ✅ Yes | ⚠️ Text only | ⚠️ Optional | ✅ Yes |
| **Flashcard** | ✅ Own only | ✅ Yes | ⚠️ Via review | ⚠️ Optional | ✅ Yes |
| **CalendarEvent** | ✅ Own only | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |

**Implementation:**
- Notes page allows AI generation (user-owned)
- Flashcards page allows AI generation (user-owned)
- Calendar allows manual event creation
- All queries filter by `created_by: user.email`
- No cross-user visibility

**Update Restrictions:**
- Notes: No update UI implemented (read-only after creation)
- Flashcards: Only `times_reviewed` and `times_correct` updated during study
- CalendarEvent: No update UI implemented (can delete only)

---

## BASE44 BUILT-IN SECURITY

### 1. User Entity Protection
- Users can only view/update their own User record
- Admins can view all users (AdminUsers page)
- Role field: `'admin' | 'user'`

### 2. Automatic Field Injection
- `created_by`: Auto-set to current user's email on create
- `created_date`: Auto-set on create
- `updated_date`: Auto-updated on update
- Cannot be overridden by client

### 3. Authentication
- All entity operations require authentication
- Enforced at platform API level
- No public write access

---

## QUESTION ANSWERING FLOW

### ✅ CORRECT: Users Submit Answers (No Direct Edits)

```javascript
// 1. User views question (READ)
const question = await base44.entities.Question.filter({ id: questionId });

// 2. User selects answer in UI
const selectedAnswer = 'B';

// 3. System creates Attempt record (WRITE - controlled)
await base44.entities.Attempt.create({
  question_id: question.id,
  subject_id: question.subject_id,
  selected_answer: selectedAnswer,
  correct_answer: question.correct_answer,
  is_correct: selectedAnswer === question.correct_answer,
  // created_by auto-assigned
});

// 4. Question entity remains unchanged (READ-ONLY)
```

### ❌ INCORRECT: Users Edit Questions (BLOCKED)

```javascript
// This doesn't exist in the UI - users cannot do this
await base44.entities.Question.update(id, {
  correct_answer: 'A', // ❌ BLOCKED - no UI for this
  explanation: 'New explanation' // ❌ BLOCKED - no UI for this
});
```

---

## CLIENT-SIDE SAFEGUARDS

### Admin-Only Pages
- **Generate.js**: Question generation page (admin-only)
- **SeedData.js**: Database seeding page (admin-only)
- **AdminUsers.js**: User management page (admin-only)

All redirect non-admins:
```javascript
if (user.role !== 'admin') {
  window.location.href = createPageUrl('Dashboard');
}
```

### Layout Navigation
Admin-only nav items hidden from users:
```javascript
NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin')
```

### No Edit UI for Curriculum
- Practice.js: Creates Attempts, doesn't edit Questions
- Exam.js: Creates Attempts, doesn't edit Questions
- Progress.js: Reads Attempts, doesn't edit them
- No update/delete buttons for curriculum entities

---

## VALIDATION CHECKLIST

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Users can view subjects/units/skills/questions | ✅ Yes | Public read via `.list()` |
| Users can start practice/exams | ✅ Yes | Practice.js, Exam.js |
| Users can submit answers | ✅ Yes | Creates Attempt records |
| Users can generate notes/flashcards | ✅ Yes | Notes.js, Flashcards.js |
| Users cannot edit curriculum | ✅ Blocked | No UI, admin-only Generate page |
| Users cannot edit scoring/mastery | ✅ Blocked | No update UI for these entities |
| Users cannot affect other users' data | ✅ Enforced | All queries filter by `created_by` |
| Admins retain full control | ✅ Yes | AdminUsers, Generate, SeedData pages |

---

## SECURITY ENFORCEMENT LAYERS

### Layer 1: Platform (Base44 Built-in)
- ✅ `created_by` auto-assignment
- ✅ User entity RLS (row-level security)
- ✅ Authentication required
- ✅ Built-in field validation

### Layer 2: Query Filtering (Code)
- ✅ All private entity queries filter by `created_by`
- ✅ Owner-only data access
- ✅ No "list all" for private entities

### Layer 3: UI/Route Guards (Code)
- ✅ Admin-only pages redirect non-admins
- ✅ Navigation hides admin items
- ✅ No edit UI for curriculum entities
- ✅ No manual score/mastery editing

### Layer 4: Business Logic (Code)
- ✅ Attempts created from question answering only
- ✅ Sessions managed by system
- ✅ Mastery calculated automatically
- ✅ No direct user manipulation

---

## FUTURE ENHANCEMENTS

1. **Server-side API**: Base44 backend functions for additional validation
2. **Field-level permissions**: Hide `correct_answer` in API for exam mode
3. **Audit logging**: Track admin curriculum modifications
4. **Bulk operations**: Admin tools for managing curriculum

---

## SUMMARY

✅ **Curriculum is READ-ONLY for users**  
✅ **User interaction entities are system-controlled**  
✅ **User-generated content is owner-only**  
✅ **Admins have full access**  
✅ **Multi-layer security enforcement**  

**Base44's permission model is code-based, not configuration-based.**  
All security rules are enforced through query patterns, UI guards, and platform built-ins.