"use client"
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getIssues } from "@/lib/actions/get-issues";

interface TicketProps {
  tickets: {
    id: string;
    name: string;
    summary: string;
    status: string;
    priority: string;
    statusColor: string;
    priorityColor: string;
  }[];
}


const Ticket: React.FC<TicketProps> = ({ tickets }) => {

  useEffect(() => {
    const fetchData = async () => {
      const data = await getIssues();
      console.log("data from effect hook", data);
    };
    fetchData();
  });
  if (!tickets.length) {
    return <p>No tickets available</p>;
  }

  return (
    <div className="flex flex-grow gap-5">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="min-w-[400px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="p-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {ticket.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {ticket.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Status:</p>
              <span className={`text-sm font-medium text-gray-700`}>
                {ticket.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Priority:</p>
              <span className={`text-sm font-medium text-gray-700`}>
                {ticket.priority}
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button className="text-gray-600 text-sm hover:text-gray-800">
              View
            </button>
            <button className="text-gray-600 text-sm hover:text-gray-800">
              Edit
            </button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Sample ticket data
const sampleTickets = [
  {
    id: "1",
    name: "Ticket #101",
    summary: "Fix login issue on the portal",
    status: "In Progress",
    priority: "High",
    statusColor: "#FFA500", // orange
    priorityColor: "#FF0000", // red
  },
  {
    id: "2",
    name: "Ticket #102",
    summary: "Update user profile page",
    status: "Completed",
    priority: "Medium",
    statusColor: "#008000", // green
    priorityColor: "#FFFF00", // yellow
  },
  {
    id: "3",
    name: "Ticket #103",
    summary: "Optimize database queries",
    status: "Pending",
    priority: "Low",
    statusColor: "#FF4500", // orange-red
    priorityColor: "#ADD8E6", // light blue
  },
];

// Rendering the Ticket component with sample data
const App = () => {
  return (
    <div className="p-5">
      <Ticket tickets={sampleTickets} />
    </div>
  );
};

export default App;
