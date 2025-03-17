import { useEffect, useState } from "react";
import { fetchAPIStatus } from "./api/wifi";

function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchAPIStatus().then(setMessage).catch(console.error);
    }, []);

    return <h1>{message || "Loading..."}</h1>;
}

export default App;
