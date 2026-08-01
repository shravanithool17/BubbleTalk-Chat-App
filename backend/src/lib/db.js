import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Mongodb Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default connectDB;