import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import OrganizerProfile from "../pages/OrganizerProfile";
import MainLayout from "../layout/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import OrganizerDashboard from "../pages/OrganizerDashboard";
import CreateOrganizer from "../pages/CreateOrganizer";
import OrganizerList from "../pages/OrganizerList";
import CreateEvent from "../pages/CreateEvent";
import EventDetails from "../pages/EventDetails";
import ParticipationHistory from "../pages/ParticipationHistory";
import BrowseEvents from "../pages/BrowseEvents";
import BrowseOrganizers from "../pages/BrowseOrganizers";
import EventRegistrations from "../pages/EventRegistrations";

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
				path="/profile"
				element={
					<ProtectedRoute allowedRoles={["PARTICIPANT"]}>
						<MainLayout>
							<Profile />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/browse-events"
				element={
					<ProtectedRoute allowedRoles={["PARTICIPANT"]}>
						<MainLayout>
							<BrowseEvents />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/browse-organizers"
				element={
					<ProtectedRoute allowedRoles={["PARTICIPANT"]}>
						<MainLayout>
							<BrowseOrganizers />
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
				path="/admin/organizers"
				element={
					<ProtectedRoute allowedRoles={["ADMIN"]}>
						<MainLayout>
							<OrganizerList />
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
			<Route
				path="/organizer/profile"
				element={
					<ProtectedRoute allowedRoles={["ORGANIZER"]}>
						<MainLayout>
							<OrganizerProfile />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/organizer/create-event"
				element={
					<ProtectedRoute allowedRoles={["ORGANIZER"]}>
						<MainLayout>
							<CreateEvent />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/organizer/events/:eventId"
				element={
					<ProtectedRoute allowedRoles={["ORGANIZER"]}>
						<MainLayout>
							<EventDetails />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/events/:eventId"
				element={
					<ProtectedRoute allowedRoles={["PARTICIPANT"]}>
						<MainLayout>
							<EventDetails />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/participation-history"
				element={
					<ProtectedRoute allowedRoles={["PARTICIPANT"]}>
						<MainLayout>
							<ParticipationHistory />
						</MainLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/organizer/events/:eventId/registrations"
				element={
					<ProtectedRoute allowedRoles={["ORGANIZER"]}>
						<MainLayout>
							<EventRegistrations />
						</MainLayout>
					</ProtectedRoute>
				}
			/>


		</Routes>
	);
}

export default AppRoutes;
