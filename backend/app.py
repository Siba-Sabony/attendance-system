from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.utils import secure_filename
import glob
import os
import face_recognition
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'port': 3308,
    'user': 'root',
    'password': '123456789',
    'database': 'attendance_system'
}

if not os.path.exists('faces'):
    os.makedirs('faces')

def get_db_connection():
    return mysql.connector.connect(**db_config)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            return jsonify({'success': True, 'role': user['role'], 'username': user['username']})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/attendance', methods=['POST'])
def take_attendance():
    try:
        image_file = request.files['image']
        action = request.form.get('action')
        username = request.form.get('username')

        if not image_file or not action or not username:
            return jsonify({'success': False, 'message': 'Missing action, username or image'}), 400

        temp_path = 'temp_face.jpg'
        image_file.save(temp_path)
        unknown_image = face_recognition.load_image_file(temp_path)
        unknown_encodings = face_recognition.face_encodings(unknown_image)

        if not unknown_encodings:
            os.remove(temp_path)
            return jsonify({'success': False, 'message': 'No face detected in uploaded image'}), 400

        unknown_encoding = unknown_encodings[0]

        name_pattern = os.path.join('faces', f"{username.replace(' ', '_')}_*.jpg")
        matched_files = glob.glob(name_pattern)

        if not matched_files:
            os.remove(temp_path)
            return jsonify({'success': False, 'message': 'No reference images found for this employee'}), 404

        known_encodings = []
        for file_path in matched_files:
            image = face_recognition.load_image_file(file_path)
            encs = face_recognition.face_encodings(image)
            if encs:
                known_encodings.append(encs[0])

        os.remove(temp_path)

        if not known_encodings:
            return jsonify({'success': False, 'message': 'No face encodings found in reference images'}), 500

        is_match = face_recognition.compare_faces(known_encodings, unknown_encoding, tolerance=0.45)

        if not any(is_match):
            return jsonify({'success': False, 'message': 'Face mismatch. Access denied.'}), 401

        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
        end_of_day = start_of_day + timedelta(days=1)

        conn = get_db_connection()
        cursor = conn.cursor()

        if action == 'checkin':
            cursor.execute("INSERT INTO attendance (employee_name, check_in) VALUES (%s, %s)", (username, now))
        elif action == 'checkout':
            # البحث عن آخر تسجيل دخول لليوم بدون تسجيل خروج
            cursor.execute("""
                SELECT id FROM attendance
                WHERE employee_name = %s
                AND check_in >= %s AND check_in < %s
                AND check_out IS NULL
                ORDER BY check_in DESC LIMIT 1
            """, (username, start_of_day, end_of_day))
            result = cursor.fetchone()
            if result:
                attendance_id = result[0]
                cursor.execute("UPDATE attendance SET check_out = %s WHERE id = %s", (now, attendance_id))
            else:
                return jsonify({'success': False, 'message': 'No check-in record found for today'}), 404
        else:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': f'{action.capitalize()} successful for {username}', 'timestamp': now.strftime('%Y-%m-%d %H:%M:%S')})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/attendance', methods=['GET'])
def get_attendance():
    try:
        username = request.args.get('username')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        if username:
            cursor.execute("SELECT * FROM attendance WHERE employee_name = %s ORDER BY check_in DESC", (username,))
        else:
            cursor.execute("SELECT * FROM attendance ORDER BY check_in DESC")
        records = cursor.fetchall()
        print("Fetched records:", records)

        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': records})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/employees', methods=['GET'])
def get_employees():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM employees")
        employees = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(employees)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/employees', methods=['POST'])
def add_employee():
    try:
        name = request.form.get('name')
        gender = request.form.get('gender')
        type_ = request.form.get('type')
        password = request.form.get('password')
        images = request.files.getlist('images')

        if not all([name, gender, type_, password]) or not images:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        for idx, image in enumerate(images):
            if image:
                safe_name = secure_filename(f"{name.replace(' ', '_')}_{idx + 1}.jpg")
                image_path = os.path.join('faces', safe_name)
                image.save(image_path)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO employees (name, gender, type) VALUES (%s, %s, %s)", (name, gender, type_))
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'employee')", (name, password))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Employee added with multiple images successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/employees/<int:id>', methods=['PUT'])
def update_employee(id):
    try:
        name = request.form.get('name')
        gender = request.form.get('gender')
        type_ = request.form.get('type')
        password = request.form.get('password')
        image = request.files.get('image')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE employees SET name=%s, gender=%s, type=%s WHERE id=%s", (name, gender, type_, id))

        if password:
            cursor.execute("UPDATE users SET password=%s WHERE username=%s", (password, name))

        if image:
            image_name = secure_filename(f"{name.replace(' ', '_')}.jpg")
            image_path = os.path.join('faces', image_name)
            image.save(image_path)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Employee updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/employees/<int:id>', methods=['DELETE'])
def delete_employee(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM employees WHERE id = %s", (id,))
        result = cursor.fetchone()

        if result:
            name = result[0]

            cursor.execute("DELETE FROM attendance WHERE employee_name = %s", (name,))
            cursor.execute("DELETE FROM users WHERE username = %s", (name,))
            cursor.execute("DELETE FROM employees WHERE id = %s", (id,))
            conn.commit()

            pattern = os.path.join('faces', f"{name.replace(' ', '_')}_*.jpg")
            matched_images = glob.glob(pattern)
            for img in matched_images:
                try:
                    os.remove(img)
                except Exception as e:
                    print(f"⚠️ Error deleting image {img}: {e}")

        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'Employee and related data deleted successfully'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': f'Connected to DB: {db_name}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/user-settings', methods=['GET'])
def get_user_settings():
    username = request.args.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Username required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT username, password FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            return jsonify({'success': True, 'user': user})
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/user-settings', methods=['PUT'])
def update_user_settings():
    data = request.get_json()
    username = data.get('username')
    new_username = data.get('newUsername')
    password = data.get('password')

    if not username or not new_username or not password:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users 
            SET username = %s, password = %s 
            WHERE username = %s
        """, (new_username, password, username))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'Settings updated'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
@app.route('/api/add-manager', methods=['POST'])
@app.route('/api/add-manager', methods=['POST'])
def add_manager():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username already exists
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        existing = cursor.fetchone()
        if existing:
            return jsonify({'success': False, 'message': 'Username already exists'}), 409

        # ✅ Add with role='admin'
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'admin')", (username, password))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Manager added successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3001)
