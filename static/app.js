// Get the form and task list elements
const form = document.querySelector('#add-todo-form');
const taskList = document.querySelector('#task-list');

// Function to create a checkbox
const createCheckbox = () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input';
    return checkbox;
};

// Function to create a trash icon
const createTrashIcon = () => {
    const icon = document.createElement('i');
    icon.className = 'fas fa-trash-alt delete-icon';
    return icon;
};

// Function to create a list item with checkbox and trash icon
const createTaskListItem = (task) => {
    const listItem = document.createElement('li');
    const checkbox = createCheckbox();
    const taskText = document.createTextNode(task.text);
    const trashIcon = createTrashIcon();

    // Check the checkbox if the task is completed
    checkbox.checked = task.isCompleted;
    if (task.isCompleted) {
        listItem.style.textDecoration = 'line-through';
    }

    // Append elements to the list item
    listItem.style.listStyleType = 'none';
    listItem.className = 'task-item';
    listItem.appendChild(checkbox);
    listItem.appendChild(taskText);
    listItem.appendChild(trashIcon);

    // Attach event listeners
    checkbox.addEventListener('change', () => handleCheckboxChange(task.text, checkbox.checked));
    trashIcon.addEventListener('click', () => handleDeleteTask(task.text));

    return listItem;
};

// Fetch tasks from the server and display them
const fetchTasks = async () => {
    const response = await fetch('/get_tasks');
    const tasks = await response.json();

    // Clear the task list
    taskList.innerHTML = '';

    // Append each task to the task list with a checkbox and trash icon
    tasks.forEach(task => {
        const listItem = createTaskListItem(task);
        taskList.appendChild(listItem);
    });
};

// Function to filter tasks
const filterAllTasks = () => {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        item.style.display = 'block';
    });
}

const filterCompletedTasks = () => {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        if (item.querySelector('input').checked) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

const filterPendingTasks = () => {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        if (item.querySelector('input').checked) {
            item.style.display = 'none';
        } else {
            item.style.display = 'block';
        }
    });
}

// Send a new task to the server
const sendTask = async (formData) => {
    const response = await fetch('/add_todo', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        // Fetch the updated task list
        fetchTasks();
    } else {
        console.error('Failed to send task to server');
    }
};

// Handle the form submission event
form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Get the form data
    const formData = new FormData(form);

    // Send the form data to the server
    sendTask(formData);

    // Clear the input field
    form.reset();
});

// Function to handle checkbox change
const handleCheckboxChange = (taskText, isCompleted) => {
    // Send a request to update the isCompleted field in the server
    fetch('/update_todo_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task_text: taskText, is_completed: isCompleted })
    })
    .then(response => {
        if (response.ok) {
            // Fetch the updated task list
            fetchTasks();
        } else {
            console.error('Failed to update task status on the server');
        }
    });
};

// Function to handle delete task
const handleDeleteTask = (taskText) => {
    const confirmation = confirm('Do you confirm to delete the task?');

    if (confirmation) {
        // Send a request to delete the task from the server
        fetch('/delete_todo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ task_text: taskText })
        })
        .then(response => {
            if (response.ok) {
                // Fetch the updated task list
                fetchTasks();
            } else {
                console.error('Failed to delete task from server');
            }
        });
    }
};

// Add click event listeners to the navbar items
const allTasksItem = document.querySelector('.nav-link[href="#all"]');
const pendingTasksItem = document.querySelector('.nav-link[href="#pending"]');
const completedTasksItem = document.querySelector('.nav-link[href="#completed"]');

allTasksItem.addEventListener('click', filterAllTasks);
pendingTasksItem.addEventListener('click', filterPendingTasks);
completedTasksItem.addEventListener('click', filterCompletedTasks);

// Fetch the initial task list
fetchTasks();