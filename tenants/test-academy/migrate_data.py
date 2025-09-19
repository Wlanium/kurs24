#!/usr/bin/env python3
"""
Data Migration Script - IHK Privatrecht to Kurs-Master
Migrates users and begriffe to new multi-tenant structure
"""

import sqlite3
import json
import os
from datetime import datetime

# Database paths
OLD_DB = '/home/tba/docker/ihk-privatrecht/data/begriffe.db'
NEW_DB = '/home/tba/docker/kurs-master/data/courses.db'

def migrate_data():
    """Migrate users and content from old system to new multi-tenant structure"""
    
    # Connect to databases
    old_conn = sqlite3.connect(OLD_DB)
    old_conn.row_factory = sqlite3.Row
    
    # Create new database directory
    os.makedirs(os.path.dirname(NEW_DB), exist_ok=True)
    
    new_conn = sqlite3.connect(NEW_DB)
    new_conn.row_factory = sqlite3.Row
    
    print("🚀 Starting data migration...")
    
    try:
        # 0. Create database schema
        print("🏗️ Creating database schema...")
        create_schema(new_conn)
        
        # 1. Create course entry
        print("📚 Creating course entry...")
        course_id = create_course(new_conn)
        
        # 2. Migrate users
        print("👥 Migrating users...")
        migrate_users(old_conn, new_conn)
        
        # 3. Migrate begriffe as course content
        print("📖 Migrating begriffe to course content...")
        migrate_begriffe(old_conn, new_conn, course_id)
        
        # 4. Create sample quiz content
        print("🧠 Creating sample quiz content...")
        create_quiz_content(new_conn, course_id)
        
        # 5. Create sample flashcard content
        print("💳 Creating sample flashcard content...")
        create_flashcard_content(new_conn, course_id)
        
        new_conn.commit()
        print("✅ Migration completed successfully!")
        
        # Print statistics
        print_statistics(new_conn)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        new_conn.rollback()
        raise
    finally:
        old_conn.close()
        new_conn.close()

def create_schema(conn):
    """Create database schema"""
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
    
    # Insert demo tenant
    cursor.execute('''
        INSERT OR IGNORE INTO tenants (id, name, subdomain) 
        VALUES ('demo-tenant', 'Demo Academy', 'demo')
    ''')
    
    conn.commit()

def create_course(conn):
    """Create main course entry"""
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO courses (tenant_id, title, description, target_audience, level, language)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        'demo-tenant',
        'IHK Privatrecht',
        'Interaktive Lernplattform für Privatrecht - Grundlagen des Vertragsrechts, Kaufvertrags und Gewährleistung',
        'Auszubildende und Studierende',
        'Grundkurs',
        'de'
    ))
    
    return cursor.lastrowid

def migrate_users(old_conn, new_conn):
    """Migrate users from old system"""
    old_cursor = old_conn.cursor()
    new_cursor = new_conn.cursor()
    
    # Get all users from old system
    old_cursor.execute('SELECT * FROM users')
    users = old_cursor.fetchall()
    
    for user in users:
        # Map old fields to new structure
        translate_to = None
        if user['preferred_language'] != 'de':
            translate_to = user['preferred_language']
        
        new_cursor.execute('''
            INSERT INTO users (
                tenant_id, username, email, password_hash, 
                preferred_language, translate_to, role,
                is_verified, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'demo-tenant',
            user['username'],
            user['email'] or f"{user['username']}@example.com",
            user['password_hash'],
            'de',  # Default to German
            translate_to,
            'admin' if user['is_admin'] else 'student',
            user['is_verified'],
            user['created_at']
        ))
    
    print(f"   Migrated {len(users)} users")

def migrate_begriffe(old_conn, new_conn, course_id):
    """Migrate begriffe to course_content"""
    old_cursor = old_conn.cursor()
    new_cursor = new_conn.cursor()
    
    # Get all begriffe
    old_cursor.execute('SELECT * FROM begriffe ORDER BY id')
    begriffe = old_cursor.fetchall()
    
    for idx, begriff in enumerate(begriffe):
        # Create content_data JSON
        content_data = {
            'definition': begriff['erklaerung'],
            'beispiel': begriff['beispiel'],
            'tipp': begriff['tipp'],
            'kategorie': begriff['kategorie'],
            'schwierigkeit': begriff['schwierigkeit']
        }
        
        # Create translations JSON
        translations = {}
        if begriff['englisch']:
            translations['en'] = begriff['englisch']
        if begriff['arabisch']:
            translations['ar'] = begriff['arabisch']
        if begriff['tuerkisch']:
            translations['tr'] = begriff['tuerkisch']
        
        new_cursor.execute('''
            INSERT INTO course_content (
                course_id, type, title, content_data, translations, order_index, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            course_id,
            'begriff',
            begriff['begriff'],
            json.dumps(content_data),
            json.dumps(translations),
            idx + 1,
            'active'
        ))
    
    print(f"   Migrated {len(begriffe)} begriffe to course content")

def create_quiz_content(conn, course_id):
    """Create sample quiz questions based on begriffe"""
    cursor = conn.cursor()
    
    # Get some begriffe to create quiz questions
    cursor.execute('SELECT * FROM course_content WHERE type = "begriff" LIMIT 10')
    begriffe = cursor.fetchall()
    
    quiz_questions = []
    for idx, begriff in enumerate(begriffe):
        content_data = json.loads(begriff['content_data'])
        
        # Create multiple choice question
        question_data = {
            'fragen': [{
                'frage': f"Was bedeutet '{begriff['title']}'?",
                'antworten': [
                    {'text': content_data['definition'], 'correct': True},
                    {'text': 'Eine Form der Rechnungsstellung', 'correct': False},
                    {'text': 'Ein Verfahren zur Steuerberechnung', 'correct': False},
                    {'text': 'Eine Art der Buchführung', 'correct': False}
                ]
            }],
            'kategorie': content_data.get('kategorie', 'Allgemein'),
            'schwierigkeit': content_data.get('schwierigkeit', 'mittel'),
            'punkte': 1
        }
        
        cursor.execute('''
            INSERT INTO course_content (
                course_id, type, title, content_data, translations, order_index, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            course_id,
            'quiz',
            f"Quiz: {begriff['title']}",
            json.dumps(question_data),
            json.dumps({}),
            100 + idx,
            'active'
        ))
    
    print(f"   Created {len(begriffe)} quiz questions")

def create_flashcard_content(conn, course_id):
    """Create flashcard content based on begriffe"""
    cursor = conn.cursor()
    
    # Get begriffe for flashcards
    cursor.execute('SELECT * FROM course_content WHERE type = "begriff"')
    begriffe = cursor.fetchall()
    
    for idx, begriff in enumerate(begriffe):
        content_data = json.loads(begriff['content_data'])
        
        # Create flashcard data
        flashcard_data = {
            'front': begriff['title'],
            'back': content_data['definition'],
            'beispiel': content_data.get('beispiel', ''),
            'kategorie': content_data.get('kategorie', 'Allgemein'),
            'schwierigkeit': content_data.get('schwierigkeit', 'mittel'),
            'interval': 1,  # Starting interval for spaced repetition
            'ease_factor': 2.5,  # Starting ease factor
            'repetition_count': 0
        }
        
        cursor.execute('''
            INSERT INTO course_content (
                course_id, type, title, content_data, translations, order_index, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            course_id,
            'lernkarte',
            begriff['title'],
            json.dumps(flashcard_data),
            begriff['translations'],
            200 + idx,
            'active'
        ))
    
    print(f"   Created {len(begriffe)} flashcards")

def print_statistics(conn):
    """Print migration statistics"""
    cursor = conn.cursor()
    
    print("\n📊 Migration Statistics:")
    print("=" * 40)
    
    # Users
    cursor.execute('SELECT COUNT(*) as count FROM users')
    user_count = cursor.fetchone()['count']
    print(f"👥 Users: {user_count}")
    
    # Courses
    cursor.execute('SELECT COUNT(*) as count FROM courses')
    course_count = cursor.fetchone()['count']
    print(f"📚 Courses: {course_count}")
    
    # Content by type
    cursor.execute('''
        SELECT type, COUNT(*) as count 
        FROM course_content 
        GROUP BY type
    ''')
    content_stats = cursor.fetchall()
    
    print("📖 Content:")
    for stat in content_stats:
        print(f"   {stat['type'].capitalize()}: {stat['count']}")
    
    # Total content
    cursor.execute('SELECT COUNT(*) as count FROM course_content')
    total_content = cursor.fetchone()['count']
    print(f"📋 Total Content Items: {total_content}")

if __name__ == '__main__':
    # Check if old database exists
    if not os.path.exists(OLD_DB):
        print(f"❌ Old database not found: {OLD_DB}")
        exit(1)
    
    # Create new database directory if needed
    os.makedirs(os.path.dirname(NEW_DB), exist_ok=True)
    
    migrate_data()
    print("\n🎉 Data migration completed successfully!")
    print(f"New database created at: {NEW_DB}")