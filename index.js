const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// Middle Ware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://ask-and-recommend.web.app",
        "https://ask-and-recommend.firebaseapp.com"
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


// Custom MiddleWare
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send({ massage: 'unauthorized access' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ massage: 'unauthorized access' });
        }

        req.user = decoded;
        next();
    })
}
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cckud.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const queryHive = client.db("QueryHive").collection("queries");
        const recommendationCollections = client.db("QueryHive").collection("recommendations");

        // Auth Related APIs
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '5h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ success: true });
        });

        // Logout Auth
        app.post('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ success: true });
        })

        // Insert a query
        app.post('/queries', async (req, res) => {
            const query = req.body;
            const result = await queryHive.insertOne(query);
            res.send(result);
        });

        // Get all queries APIs
        app.get('/queries', async (req, res) => {
            const cursor = queryHive.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get a query by id
        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryHive.findOne(query);
            res.send(result);
        });

        // Get a query by email
        app.get('/queries/email/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };

            // console.log('cok cok cookies', req.cookies);
            // console.log(email);
            // console.log(req.user?.email);

            if (req.user?.email !== req.params.email) {
                return res.status(403).send({ massage: 'forbidden access' });
            }

            const result = await queryHive.find(query).toArray();
            res.send(result);
        });

        // Get the 6 most recent queries
        app.get('/recent-queries', async (req, res) => {
            const cursor = queryHive.find({}).sort({ createdAt: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        // Delete a query by id
        app.delete('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryHive.deleteOne(query);
            res.send(result);
        });

        // Update a query by id
        app.patch('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedQuery = req.body;
            const query = {
                $set: {
                    productName: updatedQuery.productName,
                    productBrand: updatedQuery.productBrand,
                    productImageURL: updatedQuery.productImageURL,
                    queryTitle: updatedQuery.queryTitle,
                    boycottingReason: updatedQuery.boycottingReason,
                    createdAt: updatedQuery.updateTime,
                }
            }
            const result = await queryHive.updateOne(filter, query, options);
            res.send(result);
        });


        // get all recommendations
        app.get('/recommendations', async (req, res) => {
            const cursor = recommendationCollections.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        // get a recommendation by email
        app.get('/recommendations/email/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { recommenderEmail: email };
            // console.log('cok cok cookies', req.cookies);
            if (req.user?.email !== email) {
                return res.status(403).send({ massage: 'forbidden access' });
            }
            const result = await recommendationCollections.find(query).toArray();
            res.send(result);
        });

        // Insert a recommendation and increment the count
        app.post('/recommendations', async (req, res) => {
            const recommendation = req.body;
            const queryId = recommendation.queryId;

            const result = await recommendationCollections.insertOne(recommendation);

            if (result.insertedId) {
                const filter = { _id: new ObjectId(queryId) };
                const update = { $inc: { recommendationCount: 1 } };

                await queryHive.updateOne(filter, update);
            }

            res.send(result);
        });

        // Delete a recommendation by id and decrement the count
        app.delete('/recommendations/:id', async (req, res) => {
            const id = req.params.id;

            // Find the recommendation to get the queryId
            const recommendation = await recommendationCollections.findOne({ _id: new ObjectId(id) });

            if (recommendation) {
                const queryId = recommendation.queryId;

                // Delete the recommendation
                const result = await recommendationCollections.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 1) {
                    // Decrement the recommendation count in the related query
                    await queryHive.updateOne(
                        { _id: new ObjectId(queryId) },
                        { $inc: { recommendationCount: -1 } }
                    );
                }

                res.send(result);
            }
        });

        // Fetch all recommendations for all queries of a specific user
        app.get('/recommendations/user/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log('cok cok cookies', req.cookies);
            if (req.user?.email !== email) {
                return res.status(403).send({ massage: 'forbidden access' });
            }
            // Find all queries created by the user
            const userQueries = await queryHive.find({ userEmail: email }).toArray();

            // Extract all query IDs
            const queryIds = userQueries.map(query => query._id.toString());

            // Find recommendations for the user's queries
            const recommendations = await recommendationCollections.find({ queryId: { $in: queryIds } }).toArray();

            res.send(recommendations);
        });

        // Fetch all recommendations for a specific queryId
        app.get('/queries/:queryId/recommendations', verifyToken, async (req, res) => {
            const queryId = req.params.queryId;
            const result = await recommendationCollections.find({ queryId: queryId }).toArray();
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
    res.send('QueryHive Server is Running');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});