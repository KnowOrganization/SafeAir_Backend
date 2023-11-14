const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(cors());
const port = 4000;

// import firebase-admin package
// import { admin , auth} from "firebase-admin";
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require('firebase-admin/database');


const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// import service account file (helps to know the firebase project details)
const serviceAccount = require("./safeair-firebase-adminsdk.json");
const { object } = require("webidl-conversions");
const { log } = require("console");

// Intialize the firebase-admin project/account
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://safeair-b0c14-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = getDatabase();
const ref = db.ref('locations');

app.listen(port, () => console.log(`Dolphin app listening on port ${port}!`));

app.use(cors());
var jsonParser = bodyParser.json();

const uri =
	"mongodb+srv://mohammadsami:Sami65739mongodb@safeaircluster.lqn01pu.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

client.connect();
client.db("SafeAir").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");

// mongoose.connect(
//     "mongodb+srv://mohammadsami:Sami65739mongodb@safeaircluster.lqn01pu.mongodb.net/?retryWrites=true&w=majority",
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     }
// );

// const myDB = mongoose.db("SafeAir");
// const myColl = myDB.collection("LoginData");

// const loginSchema = new mongoose.Schema({
//     "email": {
//       "type": "String"
//     },
//     "sessions": {
//       "type": [
//         {
//             "date": {
//                 "type": "String"
//             },
//             "daySessions": {
//                 "type": [
//                     {
//                         "logInTime" : {
//                             "type": "String"
//                         },
//                         "logOutTime" : {
//                             "type": "String"
//                         },
//                         "sessionNumber" : {
//                             "type": "Number"
//                         }
//                     }
//                 ]
//             }
//         }
//       ]
//     }
//   });

//   const LoginData = mongoose.model('LoginData', loginSchema);

// const sessionSchema = new mongoose.Schema({
//     loginTime: Date,
//     logoutTime: Date
//   });

//   const userSchema = new mongoose.Schema({
//     email: String,
//     sessions: [sessionSchema]
//   });

//   const logSchema = new mongoose.Schema({
//     date: Date,
//     users: [userSchema]
//   });

//   const Log = mongoose.model('LoginData', logSchema);

// Add Login data to the database
app.post("/addLoginData", jsonParser, async (req, res) => {
	const loginData = req.body;
	console.log(loginData);

	const myDB = client.db("SafeAir_LOGIN_DATA");
	const myColl = myDB.collection(loginData.email);
	const sessionToAdd = {
		sessionNumber: loginData.sessionNumber,
		logInTime: loginData.logInTime,
		// logOutTime: loginData.logOutTime,
		logInLocation: [loginData.logInLat, loginData.logInLng],
		// logOutLocation: [loginData.logOutLat, loginData.logOutLng],
	};
	// myColl.findOne({ date: loginData.date, "sessions.sessionNumber" : loginData.sessionNumber }, function (err, result) {
	//     if (err) {
	//         console.log(err);
	//     } else {
	//         if (result) {
	//             console.log("Session already exists");
	//             // update this session
	//             const query = { date: loginData.date, "sessions.sessionNumber" : loginData.sessionNumber };
	//             const update = {
	//                 $set: {
	//                     "sessions.$.logOutTime": loginData.logOutTime,
	//                 },
	//             };
	//             const options = { upsert: true };
	//         }
	//     }
	// });
	const query = { date: loginData.date };
	const update = {
		$push: {
			sessions: sessionToAdd,
		},
	};
	const options = { upsert: true };
	await myColl.updateOne(query, update, options);
	res.send("success   ");
});

// Add Logout data to the database
app.post("/addLogoutData", jsonParser, async (req, res) => {
	const logoutData = req.body;
	console.log(logoutData);
	const myDB = client.db("SafeAir_LOGIN_DATA");
	const myColl = myDB.collection(logoutData.email);
	const sessionToAdd = {
		sessionNumber: logoutData.sessionNumber,
		logInTime: logoutData.logInTime,
		logOutTime: logoutData.logOutTime,
		logInLocation: [logoutData.logInLat, logoutData.logInLng],
		logOutLocation: [logoutData.logOutLat, logoutData.logOutLng],
	};
	const query = {
        date: logoutData.date,
		"sessions.sessionNumber": logoutData.sessionNumber,
	};
	const update = {
		$set: {
            "sessions.$": sessionToAdd,
        }
	};
	// const options = { upsert: true };
	await myColl.updateMany(query, update);
	res.send("success   ");
});

// get the login data from the database from all collections and return it and also add name of collection in the json object

app.get("/getLoginData", async (req, res) => {
	const myDB = client.db("SafeAir_LOGIN_DATA");
	const collections = await myDB.listCollections().toArray();
	const loginData = [];
	for (let i = 0; i < collections.length; i++) {
		const collection = collections[i];
		const myColl = myDB.collection(collection.name);
		const data = await myColl.find().toArray();
		const object = {
			user: collection.name,
			data: data,
		};
		loginData.push(object);
	}
	res.send(loginData);
});

app.get("/status", (req, res) => {
	res.send("ckeck Status");
});

// Create a new user account
app.post("/createUser", jsonParser, async (req, res) => {
	const userData = req.body;
	console.log(userData);
	getAuth()
		.createUser({
			email: userData.email,
			emailVerified: false,
			phoneNumber: userData.phoneNumber,
			password: userData.password,
			displayName: userData.displayName,
			disabled: false,
		})
		.then((userRecord) => {
			// See the UserRecord reference doc for the contents of userRecord.
			console.log("Successfully created new user:", userRecord.uid);
			res.send(
				JSON.stringify({
					error: false,
					message: "Successfully created new user:" + userRecord.uid,
				})
			);
		})
		.catch((error) => {
			console.log("Error creating new user:", error);
			res.send(
				JSON.stringify({
					error: true,
					message: error.message,
				})
			);
		});
});

// Get all the users
app.get("/getAllUsers", async (req, res) => {
	const listUsers = await admin.auth().listUsers();
	res.send(listUsers);
});

// Get a user by uid
app.get("/getUser/:uid", async (req, res) => {
	const uid = req.params.uid;
	const user = await admin.auth().getUser(uid);
	res.send(user);
});

// Update a user by uid
app.put("/updateUser/:uid", jsonParser, async (req, res) => {
	const uid = req.params.uid;
	const userData = req.body;
	const user = await admin.auth().updateUser(uid, userData);
	res.send(user);
});

// Delete a user by uid
app.delete("/deleteUser/:uid", async (req, res) => {
	const uid = req.params.uid;
	const user = await admin.auth().deleteUser(uid);
	await ref.child(uid).remove();
	res.send(user);
});
