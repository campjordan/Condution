//"use strict";

// Initialize Firebase Application
// TODO TODO TODO !!!! Change this on deploy

let usingFirebase;
let sqliteDB;
let firebaseDB, fsRef;

const initStorage = (fbPointer, useFirebase) => {
    // Firebase App (the core Firebase SDK) is always required and
    // must be listed before other Firebase SDKs
    // const firebase = require("firebase/app");

    usingFirebase = useFirebase;
    if (usingFirebase) {
        const obj = require("./../secrets.json");
        fbPointer.initializeApp(obj.dbkeys.debug);
        [ firebaseDB, fsRef ] = [fbPointer.firestore(), fbPointer.firestore];
        firebaseDB.enablePersistence({synchronizeTabs: true}).catch(console.error);
    } else {
        const sqlite3 = require('sqlite3').verbose();   // see https://www.sqlitetutorial.net/sqlite-nodejs/connect/
        const dbPath = './condution.db'; // TODO: use capacitor storage api
        sqliteDB = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {   // TODO: close the database on app close
            if (err) {
                sqliteDB = new sqlite3.Database(dbPath, sqlite3.OPEN_CREATE, console.error);
                // TODO: next up: insert test data into database, migrate firebase structure to sql, then write reference object to simulate firebase object
            }
            console.log('Connected to the condution hard storage database.');
        });
        console.log(sqliteDB);
    }
};

const [cRef, flush] = (() => {
    //const { Plugins } = require('@capacitor/core');
    //const { Network } = Plugins;

    let cache = new Map();
    let unsubscribeCallbacks = new Map();

    function flush() {
        /*
         * Nukes the cache
         *
         * Used to log people out
         *
         * @return none
         *
         */
        cache = new Map();
        unsubscribeCallbacks = new Map();
    }

    function getFirebaseRef(path) {
        /*
         * Get a database reference.
         *
         * @param   path        A valid path array, see below.
         * @return  reference   The generated reference
         *
         * Examples of valid path arrays:
         *  [`collection/${docName}`] => DocumentReference
         *  ["collection", "docName"] => DocumentReference
         *  ["collection", "docName", "collection"] => CollectionReference
         *  ["collection", ["query", "params"], ["more", "params"]] => Query
         *  ["collection", ["query", "params"], "docname"] => DocumentReference
         */
        let ref = firebaseDB;
        // special handling for first collection from root
        console.assert(typeof path[0] === 'string');
        if (path[0].includes('/'))
            ref = ref.collectionGroup(path[0]);
        else
            ref = ref.collection(path[0]);
        // generic handling
        for (let nav of path.slice(1)) {
            if (typeof nav === 'string') {
                if (ref instanceof fsRef.DocumentReference) {
                    ref = ref.collection(nav);
                } else if (ref instanceof fsRef.Query) {
                    ref = ref.doc(nav);
                } else {
                    throw new Error("Unknown reference", ref.toString());
                }
            } else if (Array.isArray(nav)) {                // query, TODO shouldn't need to query
                if (ref instanceof fsRef.Query) {
                    ref = ref.where(...nav);
                } else {
                    throw new Error("Cannot query with", nav.toString());
                }
                console.assert(ref instanceof fsRef.Query)
            } else {
                throw new Error("Cannot parse", nav.toString());
            }
        }
        return ref;
    }

    async function cachedRead(path) {   // TODO: make this also use hard storage, dupe for cachedSet
        /*
         * Get a snapshot from the cache.
         *
         * @param   path    The valid path to the reference
         * @return  any     The result of calling `.get()` on the database reference
         *
         * Logic:
         *  If the path is cached, return from cache.
         *  Else, register a snapshot listener to update the cache
         *      and return the newly cached value.
         */
        const TODOstring = JSON.stringify(path);        //  strigify to hash array
        if (!cache.has(TODOstring)) {                   //  if path string isn't cached
            // TODO: comment this out someday \/
            const ref = getFirebaseRef(path);           //  get the reference from the database
            cache.set(TODOstring, ref.get());           //  save result in cache
            unsubscribeCallbacks.set(TODOstring,        //  TODO: comment this code, someday
                ref.onSnapshot({
                    error: console.trace,
                    next: (snap) => {
                        cache.set(TODOstring, snap);
                    }
                })
            );
        }
        return await cache.get(TODOstring);
    }

    async function storageRead(path) { TODO(); }

    //async function storageSet(path, value) {
        /*
         * Set a value in the storage.
         *
         * @param   path    The valid path to reference
         * @param   value   The value to set it to
         * @return  none
         */
    //    const TODOstring = JSON.stringify(path);    // stringify array, please change someday
    //    // update storage
    //    if (decideWhetherToUseHardStorage())
    //
    //    // maintain the cache
    //    if (!cache.has(TODOstring)) {
    //        cache.set();
    //    }
    //    const ref = getFirebaseRef(path);
    //    ref.set(value);
    //    cache.set(stringPath, value)
    //}

    function cacheRef(...path) {
        /*
         * Get a reference wrapper that forces cache hits.
         * This function will be exposed to the outside world.
         *
         * @param   path    A valid path array.
         * @return  wrapper A wrapper object around the expected reference.
         */
        //console.log(getFirebaseRef(path));
        return Object.assign(
            getFirebaseRef(path),               //  default methods from firebase reference
            { get: () => cachedRead(path) }     //  read on get, read from cache if available
        );
    }
    function TODO() { console.error('bad news bears'); }
    function storageRef(...path) {
        /*
         * Get a reference wrapper that acts as a database blackbox.
         *
         * @param   path    A valid path array.
         * @return  wrapper A wrapper object around the expected reference.
         */
        //console.log(ref.add, ref.doc, ref.docs);
        return {
            id: TODO,
            add: TODO,
            doc: TODO,
            docs: TODO, // TODO: docs.filter
            get: () => storageRead(path),
            set: TODO,
            update: TODO
        };
    }

    if (usingFirebase) { // TODO: how to get bool out of promise???
        return [cacheRef, flush];
    } else { console.log('using hard storage');
        return [storageRef, flush];
    }
})();

module.exports = {__init__:initStorage, cRef, flush};

