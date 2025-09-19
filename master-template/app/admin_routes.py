from flask import Blueprint, render_template, redirect, url_for, request, jsonify, session, flash
from functools import wraps
import sqlite3
import os
from werkzeug.security import generate_password_hash

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        
        conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
        cursor = conn.cursor()
        cursor.execute('SELECT is_admin FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not user[0]:
            flash('Zugang verweigert. Admin-Berechtigung erforderlich.', 'error')
            return redirect(url_for('main.index'))
        
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/users')
@admin_required
def users():
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, username, email, phone, contact_type, is_verified, is_approved, 
               is_active, is_admin, created_at, last_login
        FROM users
        ORDER BY created_at DESC
    ''')
    users = cursor.fetchall()
    conn.close()
    
    return render_template('admin_users_new.html', users=users)

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@admin_required
def approve_user(user_id):
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_approved = 1 WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    flash('Benutzer wurde freigegeben.', 'success')
    return redirect(url_for('admin.users'))

@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@admin_required
def reject_user(user_id):
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_approved = 0 WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    flash('Benutzerfreigabe wurde zurückgenommen.', 'warning')
    return redirect(url_for('admin.users'))

@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@admin_required
def toggle_admin(user_id):
    # Prevent self-demotion
    if user_id == session['user_id']:
        flash('Sie können Ihre eigenen Admin-Rechte nicht ändern.', 'error')
        return redirect(url_for('admin.users'))
    
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
    cursor = conn.cursor()
    cursor.execute('SELECT is_admin FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user:
        new_admin_status = 0 if user[0] else 1
        cursor.execute('UPDATE users SET is_admin = ? WHERE id = ?', (new_admin_status, user_id))
        conn.commit()
        flash(f'Admin-Status wurde {"aktiviert" if new_admin_status else "deaktiviert"}.', 'success')
    
    conn.close()
    return redirect(url_for('admin.users'))

@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_active(user_id):
    # Prevent self-deactivation
    if user_id == session['user_id']:
        flash('Sie können Ihren eigenen Account nicht deaktivieren.', 'error')
        return redirect(url_for('admin.users'))
    
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
    cursor = conn.cursor()
    cursor.execute('SELECT is_active FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user:
        new_active_status = 0 if user[0] else 1
        cursor.execute('UPDATE users SET is_active = ? WHERE id = ?', (new_active_status, user_id))
        conn.commit()
        flash(f'Benutzer wurde {"aktiviert" if new_active_status else "deaktiviert"}.', 'success')
    
    conn.close()
    return redirect(url_for('admin.users'))

@admin_bp.route('/make-dozent/<username>', methods=['POST'])
@admin_required
def make_dozent(username):
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/app/data/begriffe.db'))
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_admin = 1, is_approved = 1 WHERE username = ?', (username,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    
    if affected > 0:
        flash(f'Benutzer "{username}" wurde als Dozent mit Admin-Rechten eingerichtet.', 'success')
    else:
        flash(f'Benutzer "{username}" wurde nicht gefunden.', 'error')
    
    return redirect(url_for('admin.users'))