$(document).ready(function() {
    // Initialize Toast
    const toast = new bootstrap.Toast(document.getElementById('toastNotification'));
    
    // Display current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $('#currentDate').text(now.toLocaleDateString('en-US', options));
    
    // Load saved logs from localStorage
    let workLogs = JSON.parse(localStorage.getItem('workLogs')) || [];
    renderLogHistory();
    
    // Add new task input
    $(document).on('click', '.add-task-btn', function() {
        const taskInput = $(this).siblings('.task-input');
        const taskText = taskInput.val().trim();
        
        if (taskText) {
            const taskId = Date.now();
            const taskHtml = `
                <div class="task-item d-flex justify-content-between align-items-center fade-in" data-task-id="${taskId}">
                    <div class="form-check">
                        <input class="form-check-input task-checkbox" type="checkbox" id="task-${taskId}">
                        <label class="form-check-label task-label" for="task-${taskId}">${taskText}</label>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-outline-danger delete-task">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            $(this).closest('.input-group').after(taskHtml);
            taskInput.val('');
            updateLogPreview();
        }
    });
    
    // Allow pressing Enter to add task
    $(document).on('keypress', '.task-input', function(e) {
        if (e.which === 13) {
            $(this).next('.add-task-btn').click();
        }
    });
    
    // Toggle task completion
    $(document).on('change', '.task-checkbox', function() {
        const label = $(this).siblings('.task-label');
        if ($(this).is(':checked')) {
            label.addClass('completed');
        } else {
            label.removeClass('completed');
        }
        updateLogPreview();
    });
    
    // Delete task
    $(document).on('click', '.delete-task', function() {
        $(this).closest('.task-item').remove();
        updateLogPreview();
    });
    
    // New Log button
    $('#newLogBtn').click(function() {
        $('#taskContainer').find('.task-item').remove();
        $('#taskContainer').append(`
            <div class="input-group mb-3">
                <input type="text" class="form-control bg-dark text-light border-secondary task-input" placeholder="Add a new task...">
                <button class="btn btn-outline-primary add-task-btn" type="button">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        `);
        updateLogPreview();
    });
    
    // Save Log button
    $('#saveLogBtn').click(function() {
        const tasks = [];
        $('.task-item').each(function() {
            tasks.push({
                text: $(this).find('.task-label').text(),
                completed: $(this).find('.task-checkbox').is(':checked')
            });
        });
        
        if (tasks.length > 0) {
            const logEntry = {
                date: now.toISOString(),
                tasks: tasks
            };
            
            // Check if today's log already exists
            const todayLogIndex = workLogs.findIndex(log => {
                const logDate = new Date(log.date);
                return logDate.toDateString() === now.toDateString();
            });
            
            if (todayLogIndex !== -1) {
                workLogs[todayLogIndex] = logEntry;
            } else {
                workLogs.unshift(logEntry);
            }
            
            localStorage.setItem('workLogs', JSON.stringify(workLogs));
            renderLogHistory();
            
            // Show success notification
            $('.toast-body').text('Today\'s work log saved successfully!');
            toast.show();
        } else {
            $('.toast-body').text('No tasks to save!');
            $('.toast-header').removeClass('bg-success').addClass('bg-danger');
            toast.show();
            setTimeout(() => {
                $('.toast-header').removeClass('bg-danger').addClass('bg-success');
            }, 3000);
        }
    });
    
    // Copy Log button
    $('#copyLogBtn').click(function() {
        const previewHtml = $('#logPreview').html();
        const tempTextarea = $('<textarea>');
        $('body').append(tempTextarea);
        
        // Create plain text version for copying
        let plainText = `🗒️ Work Log - ${now.toLocaleDateString('en-US', options)}\n\n`;
        $('.task-item').each(function() {
            const isCompleted = $(this).find('.task-checkbox').is(':checked');
            const taskText = $(this).find('.task-label').text();
            plainText += `${isCompleted ? '✅' : '⏳'} ${taskText}\n`;
        });
        
        tempTextarea.val(plainText).select();
        document.execCommand('copy');
        tempTextarea.remove();
        
        $('.toast-body').text('Work log copied to clipboard!');
        toast.show();
    });
    
    // Load log from history
    $(document).on('click', '.log-history-item', function() {
        const logId = $(this).data('log-id');
        const logEntry = workLogs.find(log => log.date === logId);
        
        if (logEntry) {
            // Clear current tasks
            $('#taskContainer').find('.task-item').remove();
            
            // Add tasks from history
            logEntry.tasks.forEach(task => {
                const taskId = Date.now();
                const taskHtml = `
                    <div class="task-item d-flex justify-content-between align-items-center" data-task-id="${taskId}">
                        <div class="form-check">
                            <input class="form-check-input task-checkbox" type="checkbox" id="task-${taskId}" ${task.completed ? 'checked' : ''}>
                            <label class="form-check-label task-label ${task.completed ? 'completed' : ''}" for="task-${taskId}">${task.text}</label>
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-sm btn-outline-danger delete-task">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                $('#taskContainer').append(taskHtml);
            });
            
            // Add new task input at the bottom
            $('#taskContainer').append(`
                <div class="input-group mb-3">
                    <input type="text" class="form-control bg-dark text-light border-secondary task-input" placeholder="Add a new task...">
                    <button class="btn btn-outline-primary add-task-btn" type="button">
                        <i class="bi bi-plus"></i>
                    </button>
                </div>
            `);
            
            updateLogPreview();
        }
    });
    
    // Delete log from history
    $(document).on('click', '.delete-log', function(e) {
        e.stopPropagation();
        const logId = $(this).closest('.log-history-item').data('log-id');
        workLogs = workLogs.filter(log => log.date !== logId);
        localStorage.setItem('workLogs', JSON.stringify(workLogs));
        renderLogHistory();
        
        $('.toast-body').text('Log deleted successfully!');
        $('.toast-header').removeClass('bg-success').addClass('bg-warning');
        toast.show();
        setTimeout(() => {
            $('.toast-header').removeClass('bg-warning').addClass('bg-success');
        }, 3000);
    });
    
    // Update log preview
    function updateLogPreview() {
        const tasks = [];
        $('.task-item').each(function() {
            tasks.push({
                text: $(this).find('.task-label').text(),
                completed: $(this).find('.task-checkbox').is(':checked')
            });
        });
        
        if (tasks.length > 0) {
            let previewHtml = `
                <div class="log-entry">
                    <div class="log-date">${now.toLocaleDateString('en-US', options)}</div>
                    <div class="log-tasks">
                        <ul class="list-unstyled">
            `;
            
            tasks.forEach(task => {
                previewHtml += `
                    <li class="mb-2">
                        <i class="bi ${task.completed ? 'bi-check-circle-fill text-success' : 'bi-circle'}"></i>
                        ${task.text}
                    </li>
                `;
            });
            
            previewHtml += `
                        </ul>
                    </div>
                </div>
            `;
            
            $('#logPreview').html(previewHtml);
        } else {
            $('#logPreview').html(`
                <div class="text-center text-muted py-5">
                    <i class="bi bi-journal-text display-4"></i>
                    <p class="mt-3">Your work log will appear here</p>
                </div>
            `);
        }
    }
    
    // Render log history
    function renderLogHistory() {
        $('#logHistory').empty();
        
        if (workLogs.length === 0) {
            $('#logHistory').append(`
                <div class="text-center text-muted py-3">
                    No saved logs yet
                </div>
            `);
            return;
        }
        
        workLogs.forEach(log => {
            const logDate = new Date(log.date);
            const dateStr = logDate.toLocaleDateString('en-US', options);
            const taskCount = log.tasks.length;
            const completedCount = log.tasks.filter(task => task.completed).length;
            
            $('#logHistory').append(`
                <div class="list-group-item log-history-item" data-log-id="${log.date}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${dateStr}</strong><br>
                            <small>${completedCount}/${taskCount} tasks completed</small>
                        </div>
                        <button class="btn btn-sm btn-outline-danger delete-log">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `);
        });
    }
});