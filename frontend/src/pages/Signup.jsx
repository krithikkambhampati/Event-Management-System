import { useState } from "react";

function Signup({ setPage }) {
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
      alert("Signup successful");
      setPage("login");
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
        <br />
        <input name="contactNumber" placeholder="Contact Number" onChange={handleChange} required />
        <br />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <br />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <br />
        <button type="submit">Signup</button>
      </form>

      <button onClick={() => setPage("login")}>
        Already have an account?
      </button>
    </div>
  );
}

export default Signup;
