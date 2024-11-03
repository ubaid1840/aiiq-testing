import { app } from "@/config/firebase";
import { collection, getDocs, getFirestore } from "firebase/firestore"


export default async function handleGetAllRoutes () {
return new Promise(async (resolve, reject) => {
    const db = getFirestore(app, 'aiiq-engine');
    await getDocs(collection(db, 'routes')).then((allroutes) => {
        let list1 = []
        allroutes.forEach((docs) => {
            list1.push(docs.data())
        })
        resolve(list1)
    }).catch(()=>{
        resolve([])
    })
})

}