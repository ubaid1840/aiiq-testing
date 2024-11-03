import axios from "axios";

export const checkServerHealth = async (backend) => {
    try {
        console.log(api)
        const response = await axios.get(`${backend}/health`)
        if (response) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};