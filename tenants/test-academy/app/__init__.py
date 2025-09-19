"""
Kurs-Master: Multi-Tenant Course Platform
Clean MVC Architecture with Bulma Frontend
"""

from flask import Flask
from flask_cors import CORS
import os
import sqlite3

def create_app():
    """Application Factory Pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['DATABASE'] = os.path.join(app.root_path, '..', 'data', 'courses.db')
    app.config['TENANT_ID'] = os.environ.get('TENANT_ID', 'demo-tenant')
    
    # Enable CORS for API endpoints
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    init_db(app)
    
    # Register Blueprints
    from app.routes import main_bp, api_bp, auth_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    return app


def init_db(app):
    """Initialize database with content-driven schema"""
    db_path = app.config['DATABASE']
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    if not os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Tenant information
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tenants (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                subdomain TEXT UNIQUE NOT NULL,
                branding_config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Courses per tenant
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                target_audience TEXT,
                level TEXT,
                language TEXT DEFAULT 'de',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        ''')
        
        # Dynamic content storage
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS course_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content_data TEXT NOT NULL,
                translations TEXT,
                order_index INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id)
            )
        ''')
        
        # Users with multi-language support
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'student',
                preferred_language TEXT DEFAULT 'de',
                translate_to TEXT,
                is_verified BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        ''')
        
        # User progress tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content_id INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                score INTEGER,
                attempts INTEGER DEFAULT 0,
                notes TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (content_id) REFERENCES course_content(id),
                UNIQUE(user_id, content_id)
            )
        ''')
        
        # Insert demo data
        cursor.execute('''
            INSERT INTO tenants (id, name, subdomain) 
            VALUES ('demo-tenant', 'Demo Academy', 'demo')
        ''')
        
        conn.commit()
        conn.close()


def get_db():
    """Get database connection"""
    import sqlite3
    from flask import g, current_app
    
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    
    return g.db