import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  if (user) {
    return <Dashboard user={user} setUser={setUser} />;
  }

  if (page === "login") {
    return <Login setPage={setPage} setUser={setUser} />;
  }

  return <Signup setPage={setPage} />;
}

export default App;
