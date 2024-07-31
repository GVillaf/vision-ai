import { useState } from "react";
import '../src/index.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [value, setValue] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const surpriseOptions = [
    'Does the image have a whale?',
    'Is there a bridge in the image?',
    'Does the image show a desert?',
    'Is there a river in the image?',
    'Does the image contain a person?',
    'Is there a rainbow in the image?'
  ];

  const surprise = () => {
    const randomIndex = Math.floor(Math.random() * surpriseOptions.length);
    setValue(surpriseOptions[randomIndex]);
  };

  const uploadImage = async (e) => {
    setResponse("");
    setError("");
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    setImage(e.target.files[0]);

    try {
      const options = {
        method: "POST",
        body: formData,
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, options);
      if (!response.ok) {
        throw new Error("Error uploading image");
      }
      const data = await response.json();
      // console.log("File uploaded successfully:", data);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Something went wrong");
    }
  };

  const analyzeImage = async () => {
    setResponse("");
    setError("");
    setLoading(true);
    if (!image) {
      setError("Please upload an image");
      setLoading(false);
      return;
    }
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: value }),
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/openai`, options);
      if (!response.ok) {
        throw new Error("Error analyzing image");
      }
      const data = await response.text();
      setResponse(data);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setImage(null);
    setValue("");
    setResponse("");
    setError("");
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <img src="/Logo.webp" alt="Logo" className="app-logo" />
      </header>
      <section className="search-section">
        <div className="image-container">
          {image && <img src={URL.createObjectURL(image)} alt="Uploaded preview" />}
        </div>
        {!response && (
          <p className="extra-info">
            <span>
              <label htmlFor="files" className="upload-button">Upload an image</label>
              <input onChange={uploadImage} id="files" accept="image/*" type="file" hidden />
            </span>
            to ask questions about.
          </p>
        )}
        <p>What do you want to know about the image?
          <button className="surprise" onClick={surprise} disabled={response}>Surprise me</button>
        </p>
        <div className="input-container">
          <input
            value={value}
            placeholder="What is in the image..."
            onChange={e => setValue(e.target.value)}
          />
          {(!response && !error && !loading) && <button onClick={analyzeImage}>Ask me</button>}
          {(response || error || loading) && <button onClick={clear}>Clear</button>}
        </div>
        {loading && <div className="spinner"></div>}
        {error && <p>{error}</p>}
        {response && <p className="answer">{response}</p>}
      </section>
    </div>
  );
};

export default App;
