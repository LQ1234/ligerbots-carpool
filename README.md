# Ligerbots carpool app
Built on react & webpack for frontend, nodejs & express for backend.
Mysql is the database.

### Developing the frontend
Static files (not touched by webpack) in client/static.
Source code in client/src.
```
cd client
npm run start #Starts the dev server (automatically restarts)
```
### Building the frontend
```
cd client
npm run build #Built files in client/dist (symlink here?)
```

### Running the backend

```
cd server
node app.js #You'll have to restart manually for changes to take effect
```
