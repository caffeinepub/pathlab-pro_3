import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type UserRole = "Admin" | "Receptionist" | "Lab Technician" | "Pathologist";
type UserStatus = "Active" | "Inactive";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

const ROLES: UserRole[] = [
  "Admin",
  "Receptionist",
  "Lab Technician",
  "Pathologist",
];

const ROLE_BADGE: Record<UserRole, string> = {
  Admin: "bg-purple-100 text-purple-700 border-purple-200",
  Receptionist: "bg-blue-100 text-blue-700 border-blue-200",
  "Lab Technician": "bg-amber-100 text-amber-700 border-amber-200",
  Pathologist: "bg-green-100 text-green-700 border-green-200",
};

const INITIAL_USERS: User[] = [
  {
    id: "USR-001",
    name: "Dr. Sanjay Mehta",
    email: "sanjay@pathlabpro.com",
    role: "Pathologist",
    status: "Active",
    lastLogin: "2026-03-28 09:15",
  },
  {
    id: "USR-002",
    name: "Anil Verma",
    email: "anil@pathlabpro.com",
    role: "Lab Technician",
    status: "Active",
    lastLogin: "2026-03-28 08:30",
  },
  {
    id: "USR-003",
    name: "Renu Gupta",
    email: "renu@pathlabpro.com",
    role: "Receptionist",
    status: "Active",
    lastLogin: "2026-03-28 08:00",
  },
  {
    id: "USR-004",
    name: "Admin User",
    email: "admin@pathlabpro.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2026-03-27 18:45",
  },
  {
    id: "USR-005",
    name: "Meena Pillai",
    email: "meena@pathlabpro.com",
    role: "Lab Technician",
    status: "Inactive",
    lastLogin: "2026-03-15 11:20",
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Receptionist");

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const id = `USR-${String(users.length + 1).padStart(3, "0")}`;
    setUsers((prev) => [
      ...prev,
      {
        id,
        name: newName,
        email: newEmail,
        role: newRole,
        status: "Active",
        lastLogin: "Never",
      },
    ]);
    setNewName("");
    setNewEmail("");
    setNewRole("Receptionist");
    setAddOpen(false);
    toast.success(`User ${newName} added successfully`);
  };

  const handleRoleChange = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u,
      ),
    );
  };

  return (
    <div className="space-y-6" data-ocid="users.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage staff accounts and roles
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground"
          data-ocid="users.open_modal_button"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="p-0">
          <Table data-ocid="users.table">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, idx) => (
                <TableRow key={user.id} data-ocid={`users.row.${idx + 1}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(v) =>
                          handleRoleChange(user.id, v as UserRole)
                        }
                      >
                        <SelectTrigger
                          className="h-7 w-40 text-xs"
                          data-ocid={`users.role.select.${idx + 1}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border font-medium ${ROLE_BADGE[user.role]}`}
                      >
                        {user.role.charAt(0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleToggleStatus(user.id)}
                      data-ocid={`users.toggle.button.${idx + 1}`}
                    >
                      {user.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm" data-ocid="users.dialog">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1"
                placeholder="Dr. Name"
                data-ocid="users.name.input"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1"
                placeholder="email@lab.com"
                data-ocid="users.email.input"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as UserRole)}
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="users.new_role.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="users.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!newName.trim() || !newEmail.trim()}
              data-ocid="users.submit_button"
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
