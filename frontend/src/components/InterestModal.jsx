import { useState, useEffect } from "react";
import { AVAILABLE_INTERESTS } from "../constants/interests";
import { organizerAPI, participantAPI } from "../services/api";
import "../styles/InterestModal.css";

function InterestModal({ onClose, onSave, user, refreshUser }) {
  const [step, setStep] = useState(1); // Step 1: Interests, Step 2: Follow Organizers
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    setLoadingOrgs(true);
    try {
      const { ok, data } = await organizerAPI.getAll();
      if (ok) {
        setOrganizers(data.organizers || []);
      }
    } catch  {
      // Silently fail — organizers list is optional
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleInterestChange = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleOrganizerToggle = (orgId) => {
    setSelectedOrganizers(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save interests
      const { ok } = await participantAPI.update(user._id, { interests: selectedInterests });

      // Follow selected organizers
      for (const orgId of selectedOrganizers) {
        await organizerAPI.follow(orgId);
      }

      if (ok) {
        // Refresh user data so interests are immediately reflected
        if (refreshUser) await refreshUser();
        onSave(selectedInterests);
        onClose();
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="interest-modal-overlay">
      <div className="interest-modal">
        <div className="interest-modal-header">
          <h2>{step === 1 ? "Select Your Interests" : "Follow Clubs & Organizers"}</h2>
          <p>{step === 1 ? "Help us personalize your experience" : "Stay updated with your favorite clubs"}</p>
          <div className="onboarding-steps">
            <span className={`onboarding-step ${step >= 1 ? "active" : ""}`}>1</span>
            <span className="onboarding-step-line"></span>
            <span className={`onboarding-step ${step >= 2 ? "active" : ""}`}>2</span>
          </div>
        </div>

        <div className="interest-modal-content">
          {step === 1 ? (
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
          ) : (
            <div className="organizer-follow-list">
              {loadingOrgs ? (
                <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Loading organizers...</p>
              ) : organizers.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>No organizers available yet.</p>
              ) : (
                organizers.map(org => (
                  <label key={org._id} className="organizer-follow-item">
                    <input
                      type="checkbox"
                      checked={selectedOrganizers.includes(org._id)}
                      onChange={() => handleOrganizerToggle(org._id)}
                    />
                    <div className="organizer-follow-info">
                      <span className="organizer-follow-name">{org.organizerName}</span>
                      <span className="organizer-follow-category">{org.category}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="interest-modal-footer">
          <p style={{ fontSize: '13px', color: 'var(--text-light)', textAlign: 'center', marginBottom: 'var(--spacing-sm)', width: '100%' }}>
            You can always update your preferences later from your Profile page.
          </p>
          <button
            className="modal-btn modal-btn-secondary"
            onClick={step === 1 ? onClose : async () => { if (refreshUser) await refreshUser(); onSave(selectedInterests); onClose(); }}
            disabled={isLoading}
          >
            Skip {step === 1 ? "for now" : "this step"}
          </button>
          {step === 1 ? (
            <button
              className="modal-btn modal-btn-primary"
              onClick={handleNextStep}
            >
              Next →
            </button>
          ) : (
            <button
              className="modal-btn modal-btn-primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save & Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterestModal;
