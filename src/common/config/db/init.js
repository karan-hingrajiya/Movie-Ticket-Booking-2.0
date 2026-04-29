import { getDB } from "../db.js";

const initDB = async () => {
    const db = getDB();

    const existingCollections = await db
    .listCollections({ name: "users" })
    .toArray();

    if (existingCollections.length === 0) {
        await db.createCollection("users", {
        validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "password"],
            properties: {
            name: {
                bsonType: "string",
                minLength: 2,
                maxLength: 100,
            },
            email: {
                bsonType: "string",
            },
            password: {
                bsonType: "string",
                minLength: 6,
            },
            role: {
                enum: ["user", "admin"],
            },
            isVerified: {
                bsonType: "bool",
            },
            verificationToken: {
                bsonType: ["string", "null", "undefined"],
            },
            refreshToken: {
                bsonType: ["string", "null"],
            },
            resetPasswordToken: {
                bsonType: ["string", "null"],
            },
            resetPasswordExpires: {
                bsonType: ["date", "null"],
            },
            createdAt: {
                bsonType: "date",
            },
            updatedAt: {
                bsonType: "date",
                },
            },
            },
        },
        });
    }

    await db.collection("users").createIndex({email : 1}, {unique: true});

    console.log("DB init completed!!!")
};

export default initDB;
