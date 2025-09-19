"""
Route Blueprints for Kurs-Master
Clean separation of concerns
"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import json

# Blueprint definitions
main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__)
auth_bp = Blueprint('auth', __name__)


# =============================================================================
# Main Routes - Page Rendering
# =============================================================================

@main_bp.route('/')
def index():
    """Landing page - shows course overview or login"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    from app import get_db
    db = get_db()
    
    # Get user's course
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    course = db.execute('SELECT * FROM courses WHERE tenant_id = ? LIMIT 1', 
                       (user['tenant_id'],)).fetchone()
    
    return render_template('index.html', user=user, course=course)


@main_bp.route('/content/<content_type>')
def content_view(content_type):
    """Render content based on type (begriff, quiz, etc.)"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    from app import get_db
    db = get_db()
    
    # Get content for this type
    content_raw = db.execute('''
        SELECT c.*, 
               COALESCE(p.completed, 0) as is_completed,
               p.score, p.notes
        FROM course_content c
        LEFT JOIN user_progress p ON c.id = p.content_id AND p.user_id = ?
        WHERE c.type = ? AND c.status = 'active'
        ORDER BY c.order_index
    ''', (session['user_id'], content_type)).fetchall()
    
    # Parse JSON content_data for templates
    content = []
    for item in content_raw:
        item_dict = dict(item)
        try:
            item_dict['content_data'] = json.loads(item['content_data']) if item['content_data'] else {}
            item_dict['translations'] = json.loads(item['translations']) if item['translations'] else {}
        except json.JSONDecodeError:
            item_dict['content_data'] = {}
            item_dict['translations'] = {}
        content.append(item_dict)
    
    # Map content type to template
    template_map = {
        'begriff': 'content/begriffswand.html',
        'quiz': 'content/quiz.html',
        'lernkarte': 'content/flashcards.html',
        'video': 'content/video.html'
    }
    
    template = template_map.get(content_type, 'content/default.html')
    
    return render_template(template, 
                         content=content, 
                         content_type=content_type,
                         user_language=session.get('user_language', 'de'))


@main_bp.route('/dashboard')
def dashboard():
    """User dashboard with progress overview"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    from app import get_db
    db = get_db()
    
    # Check if user is dozent/admin
    if session.get('role') in ['admin', 'dozent']:
        return redirect(url_for('main.dozent_dashboard'))
    
    # Get user progress statistics
    stats = db.execute('''
        SELECT 
            COUNT(DISTINCT c.id) as total_content,
            COUNT(DISTINCT p.content_id) as started_content,
            SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as completed_content,
            AVG(p.score) as average_score
        FROM course_content c
        LEFT JOIN user_progress p ON c.id = p.content_id AND p.user_id = ?
        WHERE c.status = 'active'
    ''', (session['user_id'],)).fetchone()
    
    return render_template('dashboard/user.html', stats=stats)


@main_bp.route('/dozent')
def dozent_dashboard():
    """Dozent dashboard with course management"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    if session.get('role') not in ['admin', 'dozent']:
        return redirect(url_for('main.index'))
    
    from app import get_db
    db = get_db()
    
    # Get course info
    course = db.execute('SELECT * FROM courses LIMIT 1').fetchone()
    
    # Get statistics
    stats = db.execute('''
        SELECT 
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT c.id) as total_content,
            COUNT(DISTINCT CASE WHEN c.type = 'begriff' THEN c.id END) as begriffe_count,
            ROUND(AVG(CASE WHEN p.completed = 1 THEN 100.0 ELSE 0 END), 1) as avg_progress,
            ROUND(AVG(p.score), 1) as quiz_avg,
            COUNT(DISTINCT p.id) as total_attempts
        FROM users u
        LEFT JOIN user_progress p ON u.id = p.user_id
        LEFT JOIN course_content c ON p.content_id = c.id
        WHERE u.role = 'student'
    ''').fetchone()
    
    return render_template('dashboard/dozent.html', course=course, stats=stats)


# =============================================================================
# API Routes - Content Management
# =============================================================================

@api_bp.route('/content/<int:content_id>/progress', methods=['POST'])
def update_progress(content_id):
    """Update user progress for content"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    from app import get_db
    db = get_db()
    
    data = request.get_json()
    completed = data.get('completed', False)
    score = data.get('score')
    notes = data.get('notes', '')
    
    # Upsert progress
    db.execute('''
        INSERT INTO user_progress (user_id, content_id, completed, score, notes, attempts)
        VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(user_id, content_id) DO UPDATE SET
            completed = ?,
            score = CASE WHEN ? IS NOT NULL THEN ? ELSE score END,
            notes = ?,
            attempts = attempts + 1,
            last_activity = CURRENT_TIMESTAMP
    ''', (session['user_id'], content_id, completed, score, notes,
          completed, score, score, notes))
    
    db.commit()
    
    return jsonify({'success': True})


@api_bp.route('/content/extend', methods=['POST'])
def extend_content():
    """Add new content to course (requires credits)"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # TODO: Implement credit check
    # TODO: Call AI service to generate content
    # TODO: Insert new content into database
    
    return jsonify({'success': True, 'message': 'Content extension endpoint'})


@api_bp.route('/content/stats')
def content_stats():
    """Get course statistics for login page"""
    from app import get_db
    db = get_db()
    
    try:
        # Get content count
        content_count = db.execute('SELECT COUNT(*) as count FROM course_content WHERE status = "active"').fetchone()
        
        # Get user count
        user_count = db.execute('SELECT COUNT(*) as count FROM users').fetchone()
        
        return jsonify({
            'total_content': content_count['count'] if content_count else 200,
            'active_users': user_count['count'] if user_count else 50
        })
    except Exception:
        return jsonify({
            'total_content': 200,
            'active_users': 50
        })


# =============================================================================
# Dozent API Routes
# =============================================================================

@api_bp.route('/dozent/overview')
def dozent_overview():
    """Get dozent dashboard overview data"""
    if 'user_id' not in session or session.get('role') not in ['admin', 'dozent']:
        return jsonify({'error': 'Access denied'}), 403
    
    from app import get_db
    db = get_db()
    
    # Get top performers
    top_performers = db.execute('''
        SELECT u.username, u.email,
               ROUND(AVG(CASE WHEN p.completed = 1 THEN 100.0 ELSE 0 END), 1) as progress,
               ROUND(AVG(p.score), 1) as quiz_score,
               MAX(p.last_activity) as last_activity
        FROM users u
        LEFT JOIN user_progress p ON u.id = p.user_id
        WHERE u.role = 'student'
        GROUP BY u.id
        ORDER BY progress DESC, quiz_score DESC
        LIMIT 5
    ''').fetchall()
    
    # Get difficult content
    difficult_content = db.execute('''
        SELECT c.title, c.type,
               COUNT(p.id) as attempts,
               ROUND(AVG(CASE WHEN p.score < 60 THEN 1.0 ELSE 0 END) * 100, 1) as error_rate
        FROM course_content c
        LEFT JOIN user_progress p ON c.id = p.content_id
        WHERE c.status = 'active'
        GROUP BY c.id
        HAVING attempts > 0 AND error_rate > 30
        ORDER BY error_rate DESC
        LIMIT 5
    ''').fetchall()
    
    return jsonify({
        'top_performers': [dict(p) for p in top_performers],
        'difficult_content': [dict(d) for d in difficult_content]
    })


@api_bp.route('/dozent/users')
def dozent_users():
    """Get all users with progress data"""
    if 'user_id' not in session or session.get('role') not in ['admin', 'dozent']:
        return jsonify({'error': 'Access denied'}), 403
    
    from app import get_db
    db = get_db()
    
    users = db.execute('''
        SELECT u.id, u.username, u.email, u.preferred_language, u.translate_to,
               ROUND(AVG(CASE WHEN p.completed = 1 THEN 100.0 ELSE 0 END), 1) as progress,
               ROUND(AVG(p.score), 1) as quiz_score,
               MAX(p.last_activity) as last_activity
        FROM users u
        LEFT JOIN user_progress p ON u.id = p.user_id
        WHERE u.role = 'student'
        GROUP BY u.id
        ORDER BY u.username
    ''').fetchall()
    
    return jsonify([dict(u) for u in users])


@api_bp.route('/dozent/content')
def dozent_content():
    """Get all course content for management"""
    if 'user_id' not in session or session.get('role') not in ['admin', 'dozent']:
        return jsonify({'error': 'Access denied'}), 403
    
    from app import get_db
    db = get_db()
    
    content = db.execute('''
        SELECT id, type, title, content_data, status, order_index
        FROM course_content
        ORDER BY type, order_index
    ''').fetchall()
    
    return jsonify([dict(c) for c in content])


# =============================================================================
# Auth Routes - User Management
# =============================================================================

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    from app import get_db
    db = get_db()
    
    # Get course for dynamic branding
    course = db.execute('SELECT * FROM courses LIMIT 1').fetchone()
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = db.execute('SELECT * FROM users WHERE username = ?', 
                         (username,)).fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['user_language'] = user['preferred_language']
            session['translate_to'] = user['translate_to']
            
            return redirect(url_for('main.index'))
        
        return render_template('auth/login.html', error='Invalid credentials', course=course)
    
    return render_template('auth/login.html', course=course)


@auth_bp.route('/logout')
def logout():
    """User logout"""
    session.clear()
    return redirect(url_for('auth.login'))


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration with language preference"""
    from app import get_db
    db = get_db()
    
    # Get course for dynamic branding
    course = db.execute('SELECT * FROM courses LIMIT 1').fetchone()
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        preferred_language = request.form.get('preferred_language', 'de')
        translate_to = request.form.get('translate_to')
        
        # Get tenant from environment or subdomain
        tenant_id = request.host.split('.')[0] if '.' in request.host else 'demo-tenant'
        
        try:
            db.execute('''
                INSERT INTO users (tenant_id, username, email, password_hash, 
                                 preferred_language, translate_to)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (tenant_id, username, email, generate_password_hash(password),
                  preferred_language, translate_to))
            db.commit()
            
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            return render_template('auth/login.html', 
                                 error='Username already exists', course=course)
    
    return render_template('auth/login.html', course=course)