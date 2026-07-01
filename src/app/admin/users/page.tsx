import { getAllUsers } from "@/actions/admin-users";
import UsersTable from "./users-table";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">All customers, agents, and admins.</p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
