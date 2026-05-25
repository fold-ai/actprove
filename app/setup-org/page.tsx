"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EU_EEA_COUNTRIES } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { toast } from "sonner";

export default function SetupOrgPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const setup = trpc.org.setup.useMutation({
    onSuccess: () => {
      toast.success("Organization created");
      router.push("/onboarding");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <Logo />
          <CardTitle>Set up your organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
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
          <Button
            className="w-full"
            disabled={!company || !country || setup.isPending}
            onClick={() => setup.mutate({ companyName: company, country })}
          >
            {setup.isPending ? "Creating…" : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
