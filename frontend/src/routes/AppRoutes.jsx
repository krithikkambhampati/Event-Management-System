import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import MainLayout from "../layout/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import OrganizerDashboard from "../pages/OrganizerDashboard";
import CreateOrganizer from "../pages/CreateOrganizer";

function AppRoutes() {
	const { user, loading } = useAuth();

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" />} />

			<Route
				path="/login"
				element={
					user ? (
						user.role === "ADMIN" ? (
							<Navigate to="/admin" />
						) : user.role === "ORGANIZER" ? ( 
							<Navigate to="/organizer" /> 
						) : (
							<Navigate to="/dashboard" />
						)
					) : (
						<Login />
					)
				}
			/>
			<Route
				path="/signup"
				element={
					user ? (
						<Navigate to={user.role === "ADMIN" ? "/admin" : "/dashboard"} />
					) : (
						<Signup />
					)
				}
			/>

			<Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

			<Route
				path="/dashboard"
				element={
					<ProtectedRoute allowedRoles={["PARTICIPANT"]}>
						<MainLayout>
							<Dashboard />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin"
				element={
					<ProtectedRoute allowedRoles={["ADMIN"]}>
						<MainLayout>
							<AdminDashboard />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin/create-organizer"
				element={
					<ProtectedRoute allowedRoles={["ADMIN"]}>
						<MainLayout>
							<CreateOrganizer />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/organizer"
				element={
					<ProtectedRoute allowedRoles={["ORGANIZER"]}>
						<MainLayout>
							<OrganizerDashboard />
						</MainLayout>
					</ProtectedRoute>
				}
			/>


		</Routes>
	);
}

export default AppRoutes;
