import "dotenv/config";
import app from "./src/app.js";
import { connectToDb } from "./src/config/database.js";

const port = process.env.PORT || 3000;

connectToDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    });