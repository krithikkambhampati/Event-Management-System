import { useState } from "react";
import { AVAILABLE_INTERESTS } from "../constants/interests";
import "../styles/InterestModal.css";

function InterestModal({ onClose, onSave, user }) {
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterestChange = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/participants/${user._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selectedInterests })
      });

      if (res.ok) {
        onSave(selectedInterests);
        onClose();
      }
    } catch (err) {
      console.error("Error saving interests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="interest-modal-overlay">
      <div className="interest-modal">
        <div className="interest-modal-header">
          <h2>Select Your Interests</h2>
          <p>Help us personalize your experience</p>
        </div>

        <div className="interest-modal-content">
          <div className="interests-checkbox-grid">
            {AVAILABLE_INTERESTS.map(interest => (
              <label key={interest} className="interest-modal-checkbox">
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(interest)}
                  onChange={() => handleInterestChange(interest)}
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="interest-modal-footer">
          <button
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Skip for now
          </button>
          <button
            className="modal-btn modal-btn-primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Interests"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterestModal;
