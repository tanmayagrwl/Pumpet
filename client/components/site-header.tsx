"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import Link from "next/link";
import { getProjects } from "@/lib/actions/get-projects";
import { useRouter } from "next/navigation";

function SiteHeader() {
  interface Organization {
    value: string;
    label: string;
  }

  const [organization, setOrganization] = useState<Organization[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getProjects();
      console.log("data from data", data);
      const projects = data.data.sites[0].projects;
      const orgData = projects.map((project: { key: any; name: any }) => ({
        value: project.key,
        label: project.name,
      }));
      setOrganization(orgData);
    };
    fetchData();
  }, []);

  console.log("this is organization", organization);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [admin, setAdmin] = useState<boolean>(false);
  const router = useRouter();

  const handleLogout = () => {
    for (const c of document.cookie.split(";")) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    }
    router.push("/");
  };

  return (
    <div className="border border-b-gray-300 py-6 flex justify-between px-4">
      <div className="flex gap-x-4">
        <h3 className=" scroll-m-20 text-2xl font-semibold tracking-tight ">
          Pumpet
        </h3>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {value
                ? organization.find(
                    (organization) => organization.value === value,
                  )?.label
                : "Select organization..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search organization..." />
              <CommandList>
                <CommandEmpty>No organization found.</CommandEmpty>
                <CommandGroup>
                  {organization.map((organization) => (
                    <CommandItem
                      key={organization.value}
                      value={organization.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === organization.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {organization.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-x-8 items-center">
        {admin && <div>Analytics</div>}
        <Link href={"/dashboard/marketplace"}>Marketplace</Link>
        <Link href={"/dashboard/activity"}>Activity</Link>
        <Link href={"/dashboard/leaderboard"}>Leaderboard</Link>

        <div className="flex items-center gap-x-3">
          <div className="font-bold">Tanmay Agrawal</div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="bg-primary/50">
                50 Pump Coins
              </DropdownMenuItem>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>
                <Switch
                  checked={admin}
                  onCheckedChange={() => setAdmin(!admin)}
                />
                <Label>Admin</Label>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default SiteHeader;
