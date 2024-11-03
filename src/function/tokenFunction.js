

export default async function handleTokenSave(token, email, url, route) {
    try {
        const requestOptions = {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ email, token, route }),
        };
        const response = await fetch(`${url}/login`, requestOptions);
        const data = await response.json();
        
    } catch (error) {
        console.log(error);
    }


}