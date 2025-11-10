const express = require('express');
const path = require('path'); 
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

const port = 3000;

app.use((req, res, next) => {
    const token = req.query.token;
    console.log(`The token is: ${token}`);
    
    if (!token) {
        console.log('There is no token in the program!');
        return res.status(403).send({ message: 'forbidden' });
    }

    next();
});

app.use(express.static(__dirname + `/public`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const filePathTasks = path.join(__dirname, 'api', 'data', 'tasks.json');

const parseTasks = function (filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf-8', (err, data) => {
            if (err) return reject(err);

            try {
                const tasks = JSON.parse(data);
                resolve(tasks);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
};

const saveTasks = async (filepath, tasks) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, JSON.stringify(tasks, null, 2), 'utf-8', (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await parseTasks(filePathTasks);
        res.status(200).json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load tasks');
    }
});

app.post('/tasks/add', async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                message: 'Fields "title" and "description" are required'
            });
        }

        const isCompletedRaw = req.body.completed;
        const isCompleted =
            isCompletedRaw === 'true' ||
            isCompletedRaw === true ||
            isCompletedRaw === 'on';

        const tasks = await parseTasks(filePathTasks);

        const maxId = tasks.length
            ? Math.max(
                  ...tasks.map(t =>
                      typeof t.id === 'number' ? t.id : Number(t.id) || 0
                  )
              )
            : 0;

        const newTask = {
            id: maxId + 1,
            title,
            description,
            completed: !!isCompleted
        };

        tasks.push(newTask);

        await saveTasks(filePathTasks, tasks);

        res.status(201).json({
            message: 'Task successfully added',
            task: newTask
        });
    } catch (err) {
        console.error('Error in /tasks/add:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message
        });
    }
});


app.put('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    let { title, description, completed } = req.body;

    if (typeof completed === 'string') {
        completed = completed === 'true';
    }

    let tasks = [];

    if (fs.existsSync(filePathTasks)) {
        try {
            const raw = fs.readFileSync(filePathTasks, 'utf-8').trim();
            tasks = raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.error('Error reading/parsing tasks.json:', err);
            return res.status(500).json({ message: 'Error with data file' });
        }
    }

    const index = tasks.findIndex(task => task.id === id);

    if (index !== -1) {
        const updatedTask = {
            ...tasks[index],
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(completed !== undefined && { completed })
        };

        tasks[index] = updatedTask;
        fs.writeFileSync(filePathTasks, JSON.stringify(tasks, null, 2));

        return res.status(200).json({
            message: `Task with id=${id} updated`,
            task: updatedTask
        });
    }

    const newTask = {
        id,
        title: title ?? '',
        description: description ?? '',
        completed: completed ?? false
    };

    tasks.push(newTask);
    fs.writeFileSync(filePathTasks, JSON.stringify(tasks, null, 2));

    return res.status(201).json({
        message: `Task with id=${id} created`,
        task: newTask
    });
});

app.listen(port, () => {
    console.log(`Server is working on http://localhost:${port}`);
});
