import * as mongodb from 'mongodb';
import config from './dbConfig.json' with { type: "json" };

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new mongodb.MongoClient(url);
const db = client.db("cs260");

(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
  })().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  });

const userCollection = db.collection('users');
const tokenCollection = db.collection('tokens');
const roomCollection = db.collection('rooms');
const credentialCollection = db.collection('credentials');
const messageCollection = db.collection('messages');

export async function addRoom(room) {
    const result = await roomCollection.insertOne(room);
    return result;
}

export async function getRoomByID(roomID) {
    const query = { _id: roomID };
    const cursor = roomCollection.find(query).limit(1);
    return await cursor.next();
}


const PAGE_SIZE = 9
import { Sort, Filter } from '../services/room-services.js'
import { Page } from '../models/models.js';
import { getRoomCount } from '../wsockets/socket-pool.js';
export async function getPage(page, sortType, filterType, filterVal) {

    const query = {};

    if(filterVal) {
        switch(filterType) {
            case Filter.USER:
                query.username = {
                    $regex: new RegExp(filterVal, 'i'),
                };
                break;
            case Filter.ROOM:
                query.title = {
                    $regex: new RegExp(filterVal, 'i'),
                };
                break;
        }
    }

    const total = (await roomCollection
        .aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "ownerID",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    ownerID: 1,
                    owner: { $arrayElemAt: ["$owner", 0]},
                    title: 1,
                    description: 1,
                    timeStamp: 1,
                }
            },
            {
                $project: {
                    title: 1,
                    username: {
                        $getField: {
                            field: "username",
                            input: "$owner"
                        }
                    }
                }
            },
            {
                $match: query
            }, 
            {
                $count: "total"
            }

        ]).next()) ?? {total: 0};
    
    
    let cursor = roomCollection
    .aggregate([
        {
            $lookup: {
                from: "users",
                localField: "ownerID",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            profile: 1,
                            description: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                owner: { $arrayElemAt: ["$owner", 0]},
                title: 1,
                description: 1,
                timeStamp: 1,
            }
        },
        {
            $project: {
                owner: 1,
                title: 1,
                description: 1,
                timeStamp: 1,
                username: {
                    $getField: {
                        field: "username",
                        input: "$owner"
                    }
                }
            }
        },
        {
            $match: query
        },
        {
            $project: {
                owner: 1,
                title: 1,
                description: 1,
                timeStamp: 1,
            }
        }
    ]);

    try {
        
        const num_pages = Math.ceil(total.total/PAGE_SIZE);

        if(page !== 0 && page >= total) {
            page = total-1;
        } 
        
        switch(sortType) {
            case Sort.TIME_STAMP:
                cursor = cursor.sort({timeStamp:1});
                cursor = cursor
                    .skip(PAGE_SIZE*page)
                    .limit(PAGE_SIZE);

                return new Page(await cursor.toArray(), page, num_pages);

            case Sort.POPULARITY:
                const rooms = await cursor.toArray();
                rooms.sort((a,b)=>getRoomCount(b._id) - getRoomCount(a._id));
                return new Page(rooms.slice(PAGE_SIZE*page, PAGE_SIZE*(page+1)), page, num_pages);
        }
    } catch(e) {
        console.log(e);
    } finally {
        cursor.close();
    }
}

export async function getMessageThreadByRoomID(roomID) {
    const cursor = messageCollection.aggregate([
        {
            $match: {threadID: roomID}
        },
        {
            $lookup: {
                from: "users",
                localField: "ownerID",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            profile: 1,
                            description: 1
                        }
                    }
                ]
            }    
        },
        {
            $project: {
                owner: { $arrayElemAt: ["$owner", 0]},
                content: 1,
                threadID: 1,
                timeStamp: 1,
            }  
        }
    ])
        .sort({timeStamp: 1});

    try {
        return await cursor.toArray();
    } finally {
        cursor.close();
    }
}

export async function addMessage(message) {
    const result = await messageCollection.insertOne(message);
    return result;
}

export async function addToken(token) {
    const result = await tokenCollection.insertOne(token);
    return result;
}

export async function getToken(token) {
    const query = { _id: token };
    const cursor = await tokenCollection.find(query);
    try {
        if (await cursor.hasNext()) {
            return await cursor.next();
        }

        return null;
    } finally {
        cursor.close();
    }
}

export async function getTokenByID(token) {
    const query = { userID: token };
    const cursor = await tokenCollection.find(query);
    try {
        if (await cursor.hasNext()) {
            return await cursor.next();
        }

        return null;
    } finally {
        cursor.close();
    }
}

export async function deleteToken(token) {
    const query = { userID: token };
    const result = await tokenCollection.deleteMany(query);
    return result;
}

export async function addUser(user) {
    const result = await userCollection.insertOne(user);
    return result;
}

export async function getUserByID(userID) {
    const query = { _id: userID };
    const cursor = userCollection.find(query).limit(1);
    return await cursor.next();
}

export async function getUserByUsername(username) {
    const query = { username: new RegExp("^"+username+"$", "i")};
    const cursor = userCollection.find(query).limit(1);
    
    return await cursor.next();
}

export async function doesUserWithUsernameExist(username) {
    const query = { username: new RegExp("^"+username+"$", "i") };
    const cursor = userCollection.find(query).limit(1);
    try {
        return await cursor.hasNext();
    } finally {
        cursor.close();
    }
}

export async function doesUserWithEmailExist(email) {
    const query = { email: new RegExp("^"+email+"$", "i")};
    const cursor = userCollection.find(query).limit(1);
    try {
        return await cursor.hasNext();
    } finally {
        cursor.close();
    }
}

export async function updateUserProfile(userID, profile) {
    return await userCollection.updateOne(
        { _id: userID },
        {
            $set: {profile: profile}
        }
    );
}

export async function updateUserBio(userID, bio) {
    return await userCollection.updateOne(
        { _id: userID },
        {
            $set: {description: bio}
        }
    );
}

export async function addCredential(credential) {
    const result = await credentialCollection.insertOne(credential);
    return result;
}

export async function getCredentialByUserID(userID) {
    const query = { _id: userID };
    const cursor = credentialCollection.find(query);
    try {
        if (await cursor.hasNext()) {
            return await cursor.next();
        }

        return null;
    } finally {
        cursor.close();
    }
}

export async function getAllRoomIDs() {
    let cursor = roomCollection
        .find()
        .project({_id: 1});

    try {
        return await cursor.toArray();   
    } finally {
        cursor.close();
    }
}