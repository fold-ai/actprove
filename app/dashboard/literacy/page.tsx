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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { GraduationCap, UserPlus } from "lucide-react";
import { format } from "date-fns";

export default function LiteracyPage() {
  const summary = trpc.literacy.summary.useQuery();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const invite = trpc.literacy.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent");
      setName("");
      setEmail("");
      setJobTitle("");
      utils.literacy.summary.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remind = trpc.literacy.remind.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
  });

  if (summary.isLoading) return <Skeleton className="h-96" />;
  const s = summary.data!;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">AI literacy (Article 4)</h2>
          <p className="text-sm text-muted-foreground">
            Mandatory since February 2025 — document that staff understand their
            AI responsibilities.
          </p>
        </div>
        <Badge
          className={
            s.status === "Compliant"
              ? "bg-risk-minimal text-white"
              : "bg-risk-limited text-white"
          }
        >
          {s.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-2xl font-bold">{s.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-2xl font-bold">{s.percent}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-sm font-bold">
              {s.latestAck ? format(new Date(s.latestAck), "dd MMM") : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Last ack.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Invite an employee
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Job title</Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <Button
            disabled={!name || !email || invite.isPending}
            onClick={() =>
              invite.mutate({ name, email, jobTitle: jobTitle || undefined })
            }
          >
            Send
          </Button>
        </CardContent>
      </Card>

      {s.records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <GraduationCap className="h-8 w-8 text-brand-navy" />
            No employees invited yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.email}</TableCell>
                  <TableCell className="text-sm">{r.jobTitle ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === "completed" ? "default" : "outline"}
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.acknowledgedAt
                      ? format(new Date(r.acknowledgedAt), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {r.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remind.mutate({ id: r.id })}
                      >
                        Remind
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
