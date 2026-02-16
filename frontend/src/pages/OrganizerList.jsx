import { Link } from "react-router-dom";

function OrganizersList() {
  return (
    <div>
      <h3>Organizers</h3>

      <Link to="/admin/organizers/create">
        <button>Create Organizer</button>
      </Link>

      {/* Later we will list organizers here */}
    </div>
  );
}

export default OrganizersList;
