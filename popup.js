document.addEventListener('DOMContentLoaded', function() {
    // Set up sign-in button listener
    document.getElementById('sign-in-button').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'signIn' });
    });

    // Set up sign-out button listener
    document.getElementById('sign-out-button').addEventListener('click', function() {
        chrome.identity.getAuthToken({ interactive: false }, function(token) {
            if (chrome.runtime.lastError) {
                console.error('Sign-out error:', chrome.runtime.lastError);
            } else {
                chrome.identity.removeCachedAuthToken({ token: token }, function() {
                    chrome.storage.local.remove(['authToken', 'userData', 'tasks'], function() {
                        console.log('User signed out');
                        updateUIForSignOut();
                    });
                });
            }
        });
    });

    // Set up add task button listener
    document.getElementById('add-task-button').addEventListener('click', function() {
        const taskInput = document.getElementById('task-input');
        const startTimeInput = document.getElementById('task-start-time');
        const endTimeInput = document.getElementById('task-end-time');
        const newTask = taskInput.value.trim();
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;

        if (newTask && startTime && endTime) {
            chrome.storage.local.get('tasks', function(result) {
                const tasks = result.tasks || [];
                tasks.push({ task: newTask, startTime: startTime, endTime: endTime });
                chrome.storage.local.set({ tasks: tasks }, function() {
                    renderTasks();
                    taskInput.value = '';
                    startTimeInput.value = '';
                    endTimeInput.value = '';
                    createCalendarEventForTask(newTask, startTime, endTime);
                });
            });
        } else {
            alert('Please fill in all fields.');
        }
    });

    // Function to create a calendar event for the new task
    function createCalendarEventForTask(task, startTime, endTime) {
        const eventDetails = {
            summary: task,
            start: {
                dateTime: new Date(startTime).toISOString(),
                timeZone: 'America/Los_Angeles'
            },
            end: {
                dateTime: new Date(endTime).toISOString(),
                timeZone: 'America/Los_Angeles'
            }
        };
        chrome.runtime.sendMessage({ action: 'createCalendarEvent', eventDetails: eventDetails });
    }

    // Function to render tasks
    function renderTasks() {
        chrome.storage.local.get('tasks', function(result) {
            const tasks = result.tasks || [];
            const taskList = document.getElementById('task-list');
            taskList.innerHTML = '';
            tasks.forEach((taskItem, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${taskItem.task} (From: ${new Date(taskItem.startTime).toLocaleString()} To: ${new Date(taskItem.endTime).toLocaleString()})`;

                // Create a wrapper for buttons
                const buttonWrapper = document.createElement('div');
                buttonWrapper.className = 'button-wrapper';

                // Create edit button
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'task-button';
                editButton.addEventListener('click', function() {
                    const updatedTask = prompt('Edit task:', taskItem.task);
                    const updatedStartTime = prompt('Edit start time:', taskItem.startTime);
                    const updatedEndTime = prompt('Edit end time:', taskItem.endTime);
                    if (updatedTask !== null && updatedStartTime !== null && updatedEndTime !== null) {
                        updateTask(index, updatedTask, updatedStartTime, updatedEndTime);
                    }
                });

                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'task-button';
                deleteButton.addEventListener('click', function() {
                    deleteTask(index);
                });

                buttonWrapper.appendChild(editButton);
                buttonWrapper.appendChild(deleteButton);
                listItem.appendChild(buttonWrapper);
                taskList.appendChild(listItem);
            });
        });
    }

    // Function to update a task
    function updateTask(index, updatedTask, updatedStartTime, updatedEndTime) {
        chrome.storage.local.get('tasks', function(result) {
            const tasks = result.tasks || [];
            if (index >= 0 && index < tasks.length) {
                tasks[index] = { task: updatedTask, startTime: updatedStartTime, endTime: updatedEndTime };
                chrome.storage.local.set({ tasks: tasks }, function() {
                    renderTasks();
                });
            }
        });
    }

    // Function to delete a task
    function deleteTask(index) {
        chrome.storage.local.get('tasks', function(result) {
            const tasks = result.tasks || [];
            if (index >= 0 && index < tasks.length) {
                tasks.splice(index, 1);
                chrome.storage.local.set({ tasks: tasks }, function() {
                    renderTasks();
                });
            }
        });
    }

    // Function to render user information
    function renderUserInfo() {
        chrome.storage.local.get('userData', function(items) {
            const userData = items.userData || {};
            document.getElementById('email').textContent = `Email: ${userData.email || 'Not available'}`;
        });
    }

    // Function to update UI for sign-out
    function updateUIForSignOut() {
        document.getElementById('sign-in-section').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }

    // Check if user is signed in
    chrome.storage.local.get('authToken', function(items) {
        if (items.authToken) {
            document.getElementById('sign-in-section').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            renderTasks();
            renderUserInfo();
        } else {
            updateUIForSignOut();
        }
    });
});
