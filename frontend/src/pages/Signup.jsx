import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fName: "",
    lName: "",
    email: "",
    password: "",
    collegeName: "",
    contactNumber: "",
    participantType: "IIIT"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/participants/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      navigate("/login");
    } else {
      alert(data.message);
    }
  };

  return (
    <div>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
        <input name="fName" placeholder="First Name" onChange={handleChange} required />
        <br />
        <input name="lName" placeholder="Last Name" onChange={handleChange} required />
        <br />
        <input name="collegeName" placeholder="College Name" onChange={handleChange} required />
        <div>
          <label>
            <input
              type="radio"
              name="participantType"
              value="IIIT"
              checked={formData.participantType === "IIIT"}
              onChange={handleChange}
            />
            IIIT
          </label>

          <label>
            <input
              type="radio"
              name="participantType"
              value="NON_IIIT"
              checked={formData.participantType === "NON_IIIT"}
              onChange={handleChange}
            />
              Non-IIIT
            </label>
        </div>
        <br />

        <br />
        <input name="contactNumber" placeholder="Contact Number" onChange={handleChange} required />
        <br />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <br />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <br />
        <button type="submit">Signup</button>
      </form>

      <button onClick={() => navigate("/login")}>
        Already have an account?
      </button>
    </div>
  );
}

export default Signup;
