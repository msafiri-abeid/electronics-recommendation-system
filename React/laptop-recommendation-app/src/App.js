import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [manufacturer, setManufacturer] = useState('');
  const [modelName, setModelName] = useState('');
  const [purpose, setPurpose] = useState(''); // Change to purpose
  const [recommendations, setRecommendations] = useState([]);
  const [options, setOptions] = useState({ manufacturers: [], model_names: {}, categories: [] });
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    const fetchOptions = async () => {
      const response = await fetch('http://127.0.0.1:8000/api/options/');
      const data = await response.json();
      setOptions(data);
    };

    fetchOptions();
  }, []);

  const handleManufacturerChange = (e) => {
    setManufacturer(e.target.value);
    setModelName(''); // Reset model name when manufacturer changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const category = mapPurposeToCategory(purpose);
      const response = await fetch('http://127.0.0.1:8000/api/recommend/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer,
          model_name: modelName,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setShowDetails({});
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleDetails = (index) => {
    setShowDetails((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const formatPrice = (price) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const mapPurposeToCategory = (purpose) => {
    const purposeToCategoryMap = {
      'Business': 'Ultrabook',
      'Productivity': 'Ultrabook',
      'Gaming': 'Gaming',
      'Design': 'Workstation',
      'Engineering': 'Workstation',
      'Content Creation': 'Workstation',
      'light productivity': '2 in 1 Convertible',
      'entertainment': '2 in 1 Convertible',
      'web-based tasks': 'Notebook',
    };

    return purposeToCategoryMap[purpose] || '';
  };

  return (
    <div className="App">
      <h1>Laptop Recommender</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Manufacturer:
          <select value={manufacturer} onChange={handleManufacturerChange}>
            <option value="">Select Manufacturer</option>
            {options.manufacturers.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Model Name:
          <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
            <option value="">Select Model Name</option>
            {manufacturer && options.model_names[manufacturer] && options.model_names[manufacturer].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Purpose:
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="">Select Purpose</option>
            <option value="Business">Business</option>
            <option value="Productivity">Productivity</option>
            <option value="Gaming">Gaming</option>
            <option value="Design">Design</option>
            <option value="Engineering">Engineering</option>
            <option value="Content Creation">Content Creation</option>
            <option value="light productivity">Light Productivity</option>
            <option value="entertainment">Entertainment</option>
            <option value="web-based tasks">Web-based Tasks</option>
          </select>
        </label>
        <button type="submit">Get Recommendations</button>
      </form>
      {recommendations.length > 0 && (
        <div>
          <h2>Recommendations:</h2>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>
                {rec.name}
                <button onClick={() => toggleDetails(index)}>
                  {showDetails[index] ? 'Hide Details' : 'Show Details'}
                </button>
                {showDetails[index] && (
                  <div className="details">
                    <p><strong>Screen Size:</strong> {rec.screen_size}</p>
                    <p><strong>Screen:</strong> {rec.screen}</p>
                    <p><strong>RAM:</strong> {rec.ram}</p>
                    <p><strong>Storage:</strong> {rec.storage}</p>
                    <p><strong>GPU:</strong> {rec.gpu}</p>
                    <p className="price">Price: {formatPrice(rec.price_tzs)} Tsh</p>
                    <p className="disclaimer">* Price may vary</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
