import ReferenceManager from "./Storage/ReferenceManager";
import FirebaseProvider from "./Storage/Backends/FirebaseBackend";
import { ContextManager } from "./Objects/EngineManager";

require('dotenv').config();

async function test() {
    let provider: FirebaseProvider = new FirebaseProvider();
    let manager: ReferenceManager = new ReferenceManager([provider])
    manager.use("firebase");

    await provider.authenticationProvider.authenticate({ payload: { email: process.env.USERNAME, password: process.env.PASSWORD } });

    let cm: ContextManager = new ContextManager(manager);
    console.log(await cm.page("tasks", "7hpKpCATp7dB6DfOAR5f").get());


    //console.log((await cm.collection("tasks").get()))
}

test();

export { ReferenceManager };

