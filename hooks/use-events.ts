"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

async function getEvents(token: string): Promise<Event[]> {
  const response = await fetch(`${API_BASE_URL}/events`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  return response.json();
}

export function useEvents() {
  const { getToken } = useAuth();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');
      return getEvents(token);
    },
  });

  return { events, isLoading, error };
}