# IHK Privatrecht - Multi-Tenant Course Platform Architecture

## 🏗️ System Overview

### Frontend (b6t.de)
- User Registration & Billing
- Tenant/Subdomain Management  
- AI Course Generation Interface
- Credit System für Erweiterungen

### Backend (This Container)
- Multi-Tenant Course Engine
- Dynamic Content Rendering
- User Progress Tracking
- Dozenten Dashboard

## 📊 Database Architecture

```sql
-- Core Tables
tenants {
  id, subdomain, name, branding_config, plan_type, created_at
}

courses {
  id, tenant_id, title, description, target_audience, 
  level, language, ai_generated_at
}

course_content {
  id, course_id, type, title, content_json, 
  translations_json, order_index, status
}

users {
  id, tenant_id, username, email, preferred_language,
  translate_to_language, role, created_at
}

user_progress {
  id, user_id, content_id, completed, score, 
  attempts, last_activity, notes
}

-- Content Types
'begriff' → Begriffswand mit Übersetzungen
'quiz' → Quiz mit Multiple Choice
'lernkarte' → Flashcards
'fallstudie' → Case Studies
'übung' → Exercises
'video' → Video Content
```

## 🎨 Template Architecture

```
templates/
├── base.html                    # Master Layout mit Bulma
├── components/
│   ├── navigation.html         # Dynamic Navbar
│   ├── progress-bar.html       # User Progress Display
│   └── content-types/
│       ├── begriffswand.html   # Begriff Cards + Translations
│       ├── quiz.html           # Quiz Interface
│       ├── flashcards.html     # Lernkarten System
│       └── [content-type].html # Weitere Content Types
├── dashboards/
│   ├── user/
│   │   ├── overview.html       # User Dashboard
│   │   └── progress.html       # Detaillierte Fortschritte
│   └── dozent/
│       ├── dashboard.html      # Dozenten Overview
│       ├── analytics.html      # Kurs-Statistiken
│       └── participants.html   # Teilnehmer-Verwaltung
└── layouts/
    ├── course.html             # Course-specific Layout
    └── admin.html              # Admin/Dozent Layout
```

## 🔄 Content Flow

### 1. Initial Course Creation
```python
# Backend (b6t.de) → AI generates content
course_request = {
    'title': 'Rechnungswesen',
    'audience': '20-30 Jahre',
    'level': 'Hauptschule',
    'components': ['begriffe', 'quiz', 'lernkarten']
}

# AI generates → Stores in DB → Deploys Container
```

### 2. Dynamic Content Rendering
```python
@app.route('/course/<content_type>')
def render_course_content(content_type):
    # Get user preferences
    user = get_current_user()
    
    # Load content with translations
    content = db.query("""
        SELECT * FROM course_content 
        WHERE type = ? AND course_id = ?
        ORDER BY order_index
    """, content_type, user.course_id)
    
    # Auto-translate if needed
    if user.translate_to_language:
        content = apply_translations(content, user.translate_to_language)
    
    # Select template based on content type
    template = f'components/content-types/{content_type}.html'
    
    return render_template(template, 
                         content=content,
                         user_progress=get_progress(user.id, content_type))
```

## 📈 Progress Tracking

### User Progress Features
- ✅ Begriffe als "gelernt" markieren
- 📊 Quiz-Scores und Versuche
- 📝 Persönliche Notizen pro Begriff
- 🎯 Fortschritts-Prozentanzeige
- 📅 Lernzeit-Tracking

### Dozenten Dashboard Features
- 👥 Teilnehmer-Übersicht
- 📊 Kurs-Statistiken (Durchschnitt, Fortschritt)
- 🎓 Individual-Fortschritte
- 📈 Schwierige Begriffe identifizieren
- 📧 Teilnehmer-Kommunikation

## 🎨 Multi-Language Support

### Registration Language Selection
```python
# User selects during registration:
preferred_language = 'de'  # Native language
translate_to = 'tr'        # Desired translation
```

### Content Display Logic
```python
# Begriffswand Example
if content.type == 'begriff':
    # Show German term always
    display_content = {
        'term': content.term_de,
        'definition': content.definition_de
    }
    
    # Add user's preferred translation
    if user.translate_to == 'en':
        display_content['translation'] = content.term_en
    elif user.translate_to == 'tr':
        display_content['translation'] = content.term_tr
    # etc...
```

## 🔌 Extension System (Credits)

### Live Content Extensions
```python
@app.route('/api/extend-course', methods=['POST'])
def extend_course():
    # Verify credits
    if not verify_credits(user.tenant_id, request.credits_required):
        return {'error': 'Insufficient credits'}
    
    # Generate new content via AI
    new_content = ai_service.generate(
        type=request.content_type,
        topic=request.topic,
        level=course.level
    )
    
    # Insert into database
    db.insert('course_content', new_content)
    
    # Deduct credits
    deduct_credits(user.tenant_id, request.credits_required)
    
    return {'success': True, 'content_id': new_content.id}
```

## 🚀 Deployment Notes

### Environment Variables
```bash
TENANT_ID=max-academy
DATABASE_URL=postgresql://...
AI_SERVICE_URL=https://b6t.de/api/ai
SECRET_KEY=...
```

### Container Scaling
- One container per tenant (isolated)
- Shared database with tenant_id separation
- Static assets CDN-ready
- Redis for session management

## 🔒 Security Considerations
- Row-level security by tenant_id
- API authentication for AI service
- Credit verification before extensions
- Secure session management

## 📋 TODO for Full Implementation
- [ ] Implement tenant context middleware
- [ ] Build content type components
- [ ] Create progress tracking system
- [ ] Design dozent dashboard views
- [ ] Add credit system integration
- [ ] Multi-language content management
- [ ] Analytics and reporting system