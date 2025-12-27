import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import mqtt from "mqtt";
import "./App.css";

function App() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [client, setClient] = useState(null);
  const [message, setMessage] = useState("test"); // Per il messaggio da inviare

  const testConnection = () => {
    try {
      const mqttClient = mqtt.connect("wss://25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud:8884/mqtt", {
        username: "admin",
        password: "Scorely_test1",
      });

      mqttClient.on("connect", () => {
        console.log("Web App connessa al broker!");
        setIsSuccess(true);
        mqttClient.subscribe("session/ABC123/state");
      });

      mqttClient.on("error", (error) => {
        console.error("Errore connessione:", error);
        setErrorMessage(error.message);
        setIsSuccess(false);
      });

      mqttClient.on("message", (topic, message) => {
        const data = JSON.parse(message.toString());
        console.log("Nuovo stato:", data);
      });

      setClient(mqttClient);
    } catch (exc) {
      setErrorMessage(exc.message);
      setIsSuccess(false);
    }
  };

  // ✅ Funzione per inviare messaggi
  const sendMessage = () => {
    if (client && isSuccess) {
      // Pubblica un messaggio semplice
      client.publish("session/ABC123/command", message);
      console.log("Messaggio inviato:", message);
      setMessage(""); // Svuota il campo
    } else {
      alert("Connettiti prima al broker!");
    }
  };

  // ✅ Invia un oggetto JSON
  const sendJsonMessage = () => {
    if (client && isSuccess) {
      const data = {
        action: "toggle",
        timestamp: Date.now(),
        value: message
      };
      client.publish("session/ABC123/command", JSON.stringify(data));
      console.log("JSON inviato:", data);
    } else {
      alert("Connettiti prima al broker!");
    }
  };

  useEffect(() => {
    return () => {
      if (client) {
        client.end();
      }
    };
  }, [client]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={testConnection} disabled={isSuccess}>
          {isSuccess ? "Connesso ✓" : "Connetti"}
        </button>
        
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        
        {/* ✅ Form per inviare messaggi */}
        {isSuccess && (
          <div style={{ marginTop: '20px' }}>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              style={{ padding: '8px', marginRight: '10px' }}
            />
            <button onClick={sendMessage}>
              Invia Testo
            </button>
            <button onClick={sendJsonMessage} style={{ marginLeft: '10px' }}>
              Invia JSON
            </button>
          </div>
        )}
        
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;