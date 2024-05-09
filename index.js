const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u69fsfj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const serviceCollection = client
            .db("carDB")
            .collection("serviceCollection");

        const bookedServiceCollection = client
            .db("carDB")
            .collection("bookedCollection");

        // ! Auth related api

        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: "1h",
            });
            res.cookie("token", token, {
                httpOnly: true,
                
            }).send({ success: true });
        });

        app.get("/services", async (req, res) => {
            const result = await serviceCollection.find().toArray();
            res.send(result);
        });
        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { _id: 1, title: 1, image: 1, price: 1 },
            };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        });

        app.post("/bookedService", async (req, res) => {
            const service = req.body;
            const result = await bookedServiceCollection.insertOne(service);
            res.send(result);
        });
        app.get("/bookedService", async (req, res) => {
            console.log("tttokkken:", req.cookies.token);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await bookedServiceCollection.find(query).toArray();
            res.send(result);
        });
        app.delete("/bookedService/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await bookedServiceCollection.deleteOne(query);
            res.send(result);
        });
        app.patch("/bookingService/:id", async (req, res) => {
            const id = req.params.id;
            const updatedBooking = req.body;
            const query = { _id: new ObjectId(id) };
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status,
                },
            };

            const result = await bookedServiceCollection.updateOne(
                query,
                updateDoc
            );
            res.send(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("server is running");
});

app.listen(port, () => {
    console.log(`server is running at port ${port}`);
});
