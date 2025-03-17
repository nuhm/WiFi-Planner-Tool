import axios from "axios";

export const fetchAPIStatus = async () => {
    try {
        const response = await axios.get("http://localhost:8000/");
        console.log("API Response:", response.data);
        return response.data.message;
    } catch (error) {
        console.error("API Error:", error);
        return "Error fetching API";
    }
};
