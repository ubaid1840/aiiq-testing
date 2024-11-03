import { app, auth } from "@/config/firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { DecryptCookie, EncryptCookie } from "./cookiesFunctions";
import handleTokenSave from "./tokenFunction";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { UserContext } from "@/store/context/UserContext";
import handleGetAllRoutes from "./getRoutes";


export default function useCheckSession() {
    const router = useRouter();
    const pathname = usePathname()
    const { state: UserState, setUser } = useContext(UserContext)

    const checkSession = async (list1) => {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, async user => {
                if (user) {
                    
                    const db = getFirestore(app, 'aiiq-engine');
                    await getDocs(query(collection(db, 'users'), where('email', '==', user.email)))
                        .then(async (snapshot) => {
                            let list = []
                            snapshot.forEach((docs) => {
                                list.push(docs.data())
                            })
                            if (list.length > 0) {
                                setUser(list[0]);
                                const filteredArray = list1.filter((item) => pathname.toLowerCase().includes(item?.name.toLowerCase()));

                                if (list[0].role == 'superadmin') {
                                    resolve({
                                        url: filteredArray[0]?.value,
                                        allRoutes: [...list1],
                                        token: user.accessToken,
                                        email: user.email
                                    })
                                }
                                else {
                                    if (list[0].role !== 'superadmin' && pathname.includes('routemanagement')) {
                                        router.push("/")
                                        resolve(null)
                                    } else {
                                        const newList = list1.filter(platform => {
                                            const approvedKey = `${platform.name}-approved`;
                                            return list[0][approvedKey];
                                        });
                                        if (list[0][`${filteredArray[0].name}-approved`] == true) {
                                            if (list[0][`${filteredArray[0].name}-role`] == 'user' && pathname.includes('usermanagement')) {
                                                router.push("/")
                                                resolve(null)
                                            } else {
                                                resolve({
                                                    url: filteredArray[0]?.value,
                                                    allRoutes: [...newList],
                                                    token: user.accessToken,
                                                    email: user.email
                                                })
                                            }
                                        } else {
                                            router.push('/')
                                            resolve(null)
                                        }
                                    }

                                }
                            } else {
                                router.push('/')
                                resolve(null)
                            }

                        }).catch(() => {
                            router.push('/')
                            resolve(null)
                        })

                } else {
                    router.push('/login')
                }
            })
            return () => {
                unsubscribe()
            }
        })
    };

    return checkSession;
}