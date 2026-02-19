import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import InterestModal from "../components/InterestModal";

function Dashboard() {
  const { user, setUser } = useAuth();
  const [showInterestModal, setShowInterestModal] = useState(false);
  const hasShownModal = useRef(false);

  useEffect(() => {
    // Show modal only once if user has no interests
    if (user && user.interests && user.interests.length === 0 && !hasShownModal.current) {
      hasShownModal.current = true;
      setShowInterestModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInterestModalClose = () => {
    setShowInterestModal(false);
  };

  const handleInterestSave = (interests) => {
    setUser({
      ...user,
      interests
    });
    setShowInterestModal(false);
  };

  return (
    <div>
      <h2>Welcome {user.fName}</h2>

      {showInterestModal && (
        <InterestModal
          onClose={handleInterestModalClose}
          onSave={handleInterestSave}
          user={user}
        />
      )}
    </div>
  );
}


export default Dashboard;
