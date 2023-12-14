from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from pymongo import MongoClient
from bson import ObjectId
import hashlib
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Connect to MongoDB
client = MongoClient('mongodb+srv://Max0922:Lmf20031027@cluster0.zd4ije3.mongodb.net/?retryWrites=true&w=majority')
db = client['Todo']
todos_collection = db['Todo']
users_collection = db['user']


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        id = users_collection.count_documents({}) + 1
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        # Hash the password before storing it
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Check if the email is already taken
        if users_collection.find_one({'email': email}):
            return render_template('signup.html', error='Email already taken')

        # Insert the new user into the Users collection
        users_collection.insert_one({'_id': id, 'username': username, 'password': hashed_password , 'email': email})

        # Log in the user by setting the session variable
        session['username'] = username

        return redirect(url_for('index'))

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Hash the password for comparison
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Check if the email and password match a user in the Users collection
        user = users_collection.find_one({'email': email, 'password': hashed_password})

        if user:
            # Log in the user by setting the session variable
            session['email'] = email
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid email or password')

    return render_template('login.html')

@app.route('/logout')
def logout():
    # Log out the user by removing the session variable
    session.pop('email', None)
    return redirect(url_for('index'))

@app.route('/')
def index():
    if 'email' in session:
        email = session['email']
        user = users_collection.find_one({'email': email})

        if user:
            user_id = user['_id']
            todos = todos_collection.find({'user_id': user_id})
            username = user['username']
            return render_template('index.html', todos=todos, username=username)

    return redirect(url_for('login'))



@app.route('/get_tasks', methods=['GET'])
def get_tasks():
    if 'email' in session:
        email = session['email']
        user = users_collection.find_one({'email': email})

        if user:
            user_id = user['_id']
            todos = todos_collection.find({'user_id': user_id})
            todos_list = [todo for todo in todos]
            return jsonify(todos_list)

    return jsonify([])


@app.route('/add_todo', methods=['POST'])
def add_todo():
    if 'email' in session:
        email = session['email']
        user = users_collection.find_one({'email': email})

        if user:
            user_id = user['_id']
            todo_text = request.form.get('task')
            todo_id = todos_collection.count_documents({}) + 1
            isCompleted = False
            todos_collection.insert_one({'_id': todo_id, 'text': todo_text, 'user_id': user_id, 'isCompleted': isCompleted})
            return redirect(url_for('index'))

    return redirect(url_for('login'))




@app.route('/update_todo_status', methods=['POST'])
def update_todo_status():
    if 'email' in session:
        email = session['email']
        user = users_collection.find_one({'email': email})

        if user:
            user_id = user['_id']
            task_text = request.json.get('task_text')
            is_completed = request.json.get('is_completed')
            todos_collection.update_one({'text': task_text, 'user_id': user_id}, {'$set': {'isCompleted': is_completed}})
            return jsonify({'status': 'success'})

    return jsonify({'status': 'error'})


@app.route('/delete_todo', methods=['POST'])
def delete_todo():
    if 'email' in session:
        email = session['email']
        user = users_collection.find_one({'email': email})

        if user:
            user_id = user['_id']
            task_text = request.json.get('task_text')
            todos_collection.delete_one({'text': task_text, 'user_id': user_id})
            return jsonify({'message': 'Task deleted successfully'})

    return jsonify({'error': 'Unauthorized'}), 401



if __name__ == '__main__':
    app.run(debug=True)
