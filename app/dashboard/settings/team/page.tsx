"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { format } from "date-fns";

export default function TeamPage() {
  const list = trpc.team.list.useQuery();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent");
      setEmail("");
      utils.team.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.team.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const revoke = trpc.team.revokeInvite.useMutation({
    onSuccess: () => utils.team.list.invalidate(),
  });

  if (list.isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-xl font-bold">Team</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Invite a teammate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!email || invite.isPending}
              onClick={() => invite.mutate({ email, role: role as never })}
            >
              Send invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data!.members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.fullName ?? "—"}
                </TableCell>
                <TableCell className="text-sm">{m.email}</TableCell>
                <TableCell>
                  {m.role === "owner" ? (
                    <Badge>Owner</Badge>
                  ) : (
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        updateRole.mutate({ userId: m.id, role: v as never })
                      }
                    >
                      <SelectTrigger className="h-7 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(m.createdAt), "dd MMM yyyy")}
                </TableCell>
              </TableRow>
            ))}
            {list.data!.invites.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-sm">{inv.email}</TableCell>
                <TableCell className="capitalize">{inv.role}</TableCell>
                <TableCell>
                  <Badge variant="outline">Invited</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revoke.mutate({ id: inv.id })}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
