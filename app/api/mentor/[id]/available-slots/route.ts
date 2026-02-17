import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mentorId = params.id;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    // Get mentor's Google Calendar sync
    const { data: calendarSync } = await supabase
      .from("google_calendar_sync")
      .select("*")
      .eq("user_id", mentorId)
      .eq("is_active", true)
      .single();

    if (!calendarSync) {
      // Return default slots if no calendar sync
      const defaultSlots = generateDefaultSlots();
      return NextResponse.json({
        slots: defaultSlots,
        source: "default",
      });
    }

    // Fetch available slots from Google Calendar
    const slots = await fetchGoogleCalendarSlots(calendarSync);

    return NextResponse.json({
      slots,
      source: "google_calendar",
    });
  } catch (error: any) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener slots disponibles" },
      { status: 500 }
    );
  }
}

async function fetchGoogleCalendarSlots(calendarSync: any): Promise<any[]> {
  try {
    // TODO: Implement Google Calendar API integration
    // This would use the access_token to fetch free/busy times
    // For MVP, return default slots
    
    // Example implementation:
    // const response = await fetch(
    //   `https://www.googleapis.com/calendar/v3/freebusy`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${calendarSync.access_token}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       timeMin: new Date().toISOString(),
    //       timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    //       items: [{ id: calendarSync.calendar_id }],
    //     }),
    //   }
    // );
    
    return generateDefaultSlots();
  } catch (error) {
    console.error("Error fetching from Google Calendar:", error);
    return generateDefaultSlots();
  }
}

function generateDefaultSlots(): any[] {
  const slots = [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + (1 - now.getDay())); // Monday
  startOfWeek.setHours(9, 0, 0, 0);

  // Generate slots for next 2 weeks, Monday-Friday, 9am-5pm
  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 5; day++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + week * 7 + day);
      
      if (date < now) continue;

      for (let hour = 9; hour < 17; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);
        
        if (slotTime < now) continue;

        slots.push({
          start: slotTime.toISOString(),
          end: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
          available: true,
        });
      }
    }
  }

  return slots;
}


