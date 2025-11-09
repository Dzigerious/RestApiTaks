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
    
    if(!token){
        console.log('There is no token in the program!');
        return res.status(403).send({message: 'forbidden'});
    }

    next()    
})

app.use(express.static(__dirname + `/public`));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/tasks', (req, res) => {
    const filePath = path.join(__dirname, 'api', 'data', 'tasks.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error cuz of reading file");
        }

        try {
            const students = JSON.parse(data);
            res.status(200).json(students); 
        }

        catch (parseError){
            console.error(parseError);
            res.status(500).send('Could not parse data file');
        }
    })})

app.post('/tasks/add', (req, res) => {
  const filePath = path.join(__dirname, 'api', 'data', 'tasks.json');
  const { title, description } = req.body;
  const isCompleted = req.body.completed === 'true';

  const data = fs.readFileSync(filePath, 'utf-8');
  const tasks = JSON.parse(data);

  const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0;

  const newTask = {
    id: maxId + 1,
    title,
    description,
    completed: isCompleted
  };

  tasks.push(newTask);
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));

  res.status(201).json({ message: 'Task added', task: newTask });
});




app.listen(port, () => {
    console.log(`Server is working on http://localhost:${port}`)
})