function Dashboard({ user, setUser }) {
  return (
    <div>
      <h2>Welcome {user}</h2>
      <button onClick={() => setUser(null)}>Logout</button>
    </div>
  );
}

export default Dashboard;
