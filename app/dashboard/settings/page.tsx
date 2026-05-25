"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EU_EEA_COUNTRIES, INDUSTRIES } from "@/lib/constants";
import { toast } from "sonner";
import {
  CreditCard,
  Users,
  Shield,
  SlidersHorizontal,
  KeyRound,
  Globe,
  Building2,
  Network,
} from "lucide-react";

export default function SettingsPage() {
  const current = trpc.org.current.useQuery();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (current.data?.org) {
      const o = current.data.org;
      setName(o.name);
      setCountry(o.country);
      setIndustry(o.industry ?? "");
      setWebsite(o.website ?? "");
    }
  }, [current.data]);

  const update = trpc.org.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Saved");
      current.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (current.isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EU_EEA_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                update.mutate({
                  name,
                  country,
                  industry: industry || undefined,
                  website: website || undefined,
                })
              }
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/dashboard/settings/billing", icon: CreditCard, label: "Billing & plan" },
          { href: "/dashboard/settings/team", icon: Users, label: "Team members" },
          { href: "/dashboard/trust-page", icon: Shield, label: "Trust Page" },
          { href: "/dashboard/settings/sector-module", icon: SlidersHorizontal, label: "Sector & risk rules" },
          { href: "/dashboard/settings/api", icon: KeyRound, label: "API & webhooks" },
          { href: "/dashboard/settings/preferences", icon: Globe, label: "Preferences" },
          { href: "/dashboard/settings/enterprise", icon: Building2, label: "Enterprise" },
          { href: "/dashboard/group", icon: Network, label: "Group overview" },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-5">
                <l.icon className="h-5 w-5 text-brand-navy" />
                <span className="font-medium">{l.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
