import dotenv from 'dotenv'; 
import connectDB from './db/index.db.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("error in app ", error);
        throw error;
    })
    app.listen(process.env.PORT || 8001, () => {
        console.log(`app running on port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection error", err);
})
