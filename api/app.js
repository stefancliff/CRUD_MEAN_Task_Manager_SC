const express = require('express');
const app = express();

const {mongoose} = require('./db/mongoose');

const bodyParser = require('body-parser');

// Can be done this way by making an index.js file to handle all models, importing has been made simpler
const { List, Task, User } = require('./db/models');

const jwt = require('jsonwebtoken');

/*
Loading the mongoose models
const { List } = require('./db/models/list.model');
const { Task } = require('./db/models/task.model');
*/

// MIDDLEWARE START

// Loading middleware
app.use(bodyParser.json());

// the following code for the middleware I got from enable-cors.org

// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});
let authenticate = (req, res, next) => {
    // check if the request has a valid jwt token
    let token = req.header('x-access-token');

    //verify the jwt
    jwt.verify(token, User.getJWTSecret(), (err, decoded) =>{
        if(err) {
            // there was an error meaning the jwt is invalid 
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    });
}


// Verify Refresh Token Middleware (which will check the session)
let verifySession = (req, res, next) => {
    // Grab the refresh token from the header
    let refreshToken = req.header('x-refresh-token');

    // Grab the id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) =>{
        if(!user){
            // User could not be found
            return Promise.reject({
                'error': 'User not found, make sure the refresh token and user id are valid!'
            });
        }

        // if the code reaches here - the user was found
        // which means the session is valid and the refresh token is in the database - but still have to check the expiration

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) =>{
            if (session.token == refreshToken){
                // Check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) == false){
                    // refresh token has not expired yet
                    isSessionValid = true;
                }
            }
        });
        if (isSessionValid){
            // The session is VALID - call next() to continue with the processing of the web request
            next();
        }
        else {
            // The session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is not valid!'
            });
        }
    }).catch((e) =>{
        res.status(401).send('Something else went wrong in app.js lmao', e);
    });
}

// MIDDLEWARE END

/* ROUTE HANDLERS START*/

/* LIST ROUTES START */ 
/* 
    GET /lists
    Purpose: Get all lists
*/


app.get('/lists', authenticate, (req, res)=>{
    // Here we will list an array of all the lists in the database that belong to the authenticated user
    List.find({
    _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
});

/* 
    POST /lists
    Purpose: Create a new lists
*/
app.post('/lists', authenticate, (req, res) => {
    // Here we want to create a new list and return the new list document back to the database (id included)
    // List info will be passed via JSON request body

    // To do this, we need a body parse which I installed with npm install body-parse --save
    let title = req.body.title;
    
    let newList = new List({
        title,
        _userId: req.user_id
    });

    newList.save().then((listDoc) => {
        // full list document is returned
        res.send(listDoc);
    });
});

/*
    PATCH /lists/:id
    Purpose: Update a specified list via id 
*/
app.patch('/lists/:id', authenticate, (req, res) => {
    // We want to update the specified list with the values in the JSON body of the request
    List.findOneAndUpdate({ 
        _id: req.params.id,
        _userId: req.user_id 
    }, {
        $set: req.body
        }
    ).then(() => {
        res.send({'message' : 'Updated List!'});
    });
});

/*
    DELETE /lists/:id
    Purpose: Delete a specified list via id 
*/
app.delete('/lists/:id', authenticate, (req,res) => {
    // We want to delete the specified list with the values in the JSON body of the request
    List.findOneAndRemove({ 
        _id: req.params.id,
        _userId: req.user_id 
    }).then((removedListDocument) => {
        res.send(removedListDocument);

        // delete all the tasks that are in the deleted list
        deleteTasksFromList(removedListDocument._id);
    });
});

// LIST ROUTES END

/* TASK ROUTES START */ 

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks in a specific list
 */
app.get('/lists/:listId/tasks', authenticate, (req,res) => {
    // here we return all tasks that belong to a specific list (by Id)
    Task.find({
        _listId: req.params.listId
    }).then((tasks) =>{
        res.send(tasks);
    })
});


/**
 * GET /lists/:listId/tasks/:taskId
 * Purpose: Get a specific task in a list
 */

app.get('/lists/:listId/tasks/:taskId', (req, res) =>{
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) =>{
        res.send(task);
    })
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Creates a new tasks in a specific list
 */
app.post('/lists/:listId/tasks', authenticate, (req,res) => {
    // here we create a tasks in a specific list (by Id)

    // here I am making sure that the id of the list is valid, and that the users id is valid to the user_id that is linked to the list id
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if(list){
            // list object is valid, so the currently authenticated user can create tasks for the list
            return true;
        }
        // else the list object is invalid, so we return false
        return false;
    }).then((canCreateTask) => {
        if (canCreateTask) {

            let newTask = new Task({
                title: req.body.title,
                _listId: req.params.listId
            });
        
            newTask.save().then((newTaskDoc) =>{
                res.send(newTaskDoc);
            })
        } else {
            res.sendStatus(404);
        }
    })

    
});


/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update specific task inside a list
 */

app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
    // Update Task based on task id

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) =>{
        if(list){
            // list object is valid, so the currently authenticated user can update tasks for the list
            return true;
        }
        // else the list object is invalid, so we return false
        return false;
    }).then((canUpdateTask) => {
        if(canUpdateTask) {
            // The currently authenticated user can update tasks
            Task.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                $set: req.body
                }
            ).then(() =>{
                res.send({message: 'Updated!'});
            })
        } else {
            res.send('Update Oopsie');
            res.sendStatus(404);
        }
    })

});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task
 */

app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) =>{
        if(list){
            // list object is valid, so the currently authenticated user can delete tasks for the list
            return true;
        }
        // else the list object is invalid, so we return false
        return false;
    }).then((canDeleteTask) => {

        if(canDeleteTask) {

            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedTaskDoc) => {
                res.send(removedTaskDoc);
            })
        } else {
            res.send('Delete Oopsie');
            res.sendStatus(404);
        }
    })
});

// TASK ROUTES END

/* USER ROUTES START */ 

/*
    POST /users
    Purpose: Sign up
*/
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) =>{
        // Session has been made, the refreshToken has been returned.
        // now we generate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            return {accessToken, refreshToken};
        });
    }).then((authTokens) => {
        res
        .header('x-refresh-token', authTokens.refreshToken)
        .header('x-access-token', authTokens.accessToken)
        .send(newUser);
    }).catch((e) =>{
        res.status(400).send('Error getting access', e);
    })
});

/*
    POST /users/login
    Purpose: Login
*/
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session has been made, the refreshToken has been returned.
            // now we generate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                return {accessToken, refreshToken};
            });
        }).then((authTokens) => {
            res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(user);
        }).catch((e) =>{
            res.status(400).send('Error in logging in!', e);
        })
    })
});

/**
 * GET /users/me/access-token
 * Purpose: Generate and return an access token
 */

app.get('/users/me/access-token', verifySession, (req, res) => {
    // Now we know the the user is valid and we have their id and userObject as well
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => { 
        res.status(400).send('Access token generation error', e);
    });
});


/* HELPER METHODS */

let deleteTasksFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() =>{
        console.log("Tasks from " + _listId + " were deleted!")
    })
}


/* ROUTE HANDLERS END */

app.listen(3000, ()=> {
    console.log("Server is listening on 3000");
});


/* SSL BEGIN */

const https = require('https');
const fs = require('fs');

const privateKey = fs.readFileSync('ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('ssl/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(443, () => {
    console.log('HTTPS server running on port 443');
  });

/* SSL END */