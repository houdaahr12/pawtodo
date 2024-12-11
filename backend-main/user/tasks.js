import express from 'express';
import db from './db.js';

const router = express.Router();

// Ensure all paths include `/api`
const apiBasePath = '/api';

// Middleware to prefix all routes with `/api`
router.use(apiBasePath, (req, res, next) => {
  next();
});

// Get the number of tasks due today
router.get('/tasks/today', (req, res) => {
  const query = `
    SELECT COUNT(*) AS taskCount
    FROM tasks
    WHERE DATE(due_date) = CURDATE() 
      AND (status = 'pas commencé' OR status = 'en cours')
  `;

  db.query(query, (err, results) => { 
    if (err) {
      console.error('Error fetching tasks due today:', err);
      return res.status(500).send('Server Error');
    }
    res.json({ taskCount: results[0].taskCount });
  });
});

//get all the tasks of today
router.get('/tasks', (req, res) => {
  const query = `
    SELECT * 
    FROM tasks
    WHERE DATE(due_date) = CURDATE()  
      AND (status = 'pas commence' OR status = 'en cours' OR status = 'termine')
    ORDER BY FIELD(priority, 'urgent', 'important', 'moins important')
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).send('Server Error');
    }
    res.json(results); 
  });
});



// API endpoint to fetch tasks grouped by status
router.get('/tasks-by-status', (req, res) => {
  const query = `
    SELECT * 
    FROM tasks
    ORDER BY FIELD(status, 'pas commence', 'en cours', 'termine')`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des tâches :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    const groupedTasks = {
      "pas commence": [],
      "en cours": [],
      "termine": [],
    };

    results.forEach((task) => {
      if (groupedTasks[task.status]) {
        groupedTasks[task.status].push(task);
      }
    });

    res.json(groupedTasks);
  });
});

//add task
router.post('/tasks-add', (req, res) => {
  const { task_name, category, due_date, due_time, priority } = req.body;

  console.log('Route /tasks-add appelée avec les données :', req.body);

  // Validation de la priorité
  const validPriorities = ['moins important', 'important', 'urgent'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ message: "Priorité invalide." });
  }

  // Validation de la date d'échéance
  const currentDate = new Date(); // Date actuelle
  const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  let dueDateObj;
  if (due_date) {
    dueDateObj = new Date(due_date); // Convertir la date d'échéance
    const dueDateOnly = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

    if (dueDateOnly < currentDateOnly) {
      return res.status(400).json({ message: "La date d'échéance ne peut pas être dans le passé." });
    }
  }

  // Requête SQL pour insérer la tâche
  const query = `INSERT INTO tasks (task_name, category, due_date, due_time, priority) VALUES (?, ?, ?, ?, ?)`;
  const values = [
    task_name || null, // Nom de la tâche
    category || null, // Catégorie
    due_date || null, // Date d'échéance
    due_time || null, // Heure d'échéance
    priority || null  // Priorité
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erreur lors de l'insertion de la tâche :", err);
      return res.status(500).json({ message: "Erreur lors de l'insertion de la tâche." });
    }

    res.status(201).json({ message: "Tâche insérée avec succès !", taskId: result.insertId });
  });
});

//route pour modifier les informations d'une tache
router.put('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { task_name, category, due_date, due_time, priority, status } = req.body;

  if (!taskId) {
    return res.status(400).json({ message: 'Task ID is required.' });
  }

  const updates = [];
  const values = [];

  if (task_name) {
    updates.push('task_name = ?');
    values.push(task_name);
  }
  if (category) {
    updates.push('category = ?');
    values.push(category);
  }

  // Only update the due_date if it's provided (avoid overwriting the date)
  if (due_date) {
    const dueDateTime = due_time ? `${due_date} ${due_time}` : `${due_date} 00:00:00`;
    updates.push('due_date = ?');
    values.push(dueDateTime);
  }

  if (priority) {
    updates.push('priority = ?');
    values.push(priority);
  }
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No data to update.' });
  }

  const updateQuery = `
    UPDATE tasks 
    SET ${updates.join(', ')} 
    WHERE id = ?;
  `;
  values.push(taskId);

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ message: 'Internal error while updating task.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ message: 'Task updated successfully!' });
  });
});


// Endpoint to get completed tasks
router.get('/history', (req, res) => {
  const query = 'SELECT * FROM tasks WHERE status = "termine"';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching tasks');
    } else {
      res.json(results);
    }
  });
});

// Endpoint to get deleted tasks=> trashh
router.get('/deleted', (req, res) => {
  const query = 'SELECT * FROM tasks WHERE status = "annule"';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    return res.json(results);
  });
});

// Delete task endpoint
router.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  if (!taskId) {
    return res.status(400).json({ message: 'Task ID is required.' });
  }

  const deleteQuery = 'DELETE FROM tasks WHERE id = ?';
  
  db.query(deleteQuery, [taskId], (err, result) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ message: 'Internal error while deleting task.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ message: 'Task deleted successfully!' });
  });
});

// PUT endpoint to restore a task by changing its status
router.put("/restore/:id", (req, res) => {
  const taskId = req.params.id;

  // Only update the status to "pas commence"
  const query = "UPDATE tasks SET status = ? WHERE id = ?";
  const newStatus = "pas commence";

  db.query(query, [newStatus, taskId], (err, results) => {
    if (err) {
      console.error("Error restoring task:", err);
      return res.status(500).send("Error restoring task.");
    }

    if (results.affectedRows === 0) {
      return res.status(404).send("Task not found.");
    }

    res.send({ message: "Task restored successfully.", taskId, status: newStatus });
  });
});

router.put("/tasks/:id/status", async (req, res) => {
  const taskId = req.params.id;
  const { completed } = req.body;

  // Determine the new status based on `completed`
  const newStatus = completed ? "termine" : "pas commence";

  try {
    // Update the task status in the database
    const query = "UPDATE tasks SET status = ? WHERE id = ?";
    const result = await db.query(query, [newStatus, taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.status(200).json({
      message: "Task status updated successfully.",
      taskId,
      newStatus,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "An error occurred while updating the task status." });
  }
});

// Endpoint to update task status to 'annule'
router.put('/tasks/cancel/:id', (req, res) => {
  const taskId = req.params.id;

  // Update the task status in the database
  const query = 'UPDATE tasks SET status = ? WHERE id = ?';
  db.query(query, ['annule', taskId], (error, results) => {
    if (error) {
      console.error('Error updating task status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no rows are affected, the task might not exist
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task status updated to "annule"' });
  });
});


export default router;
