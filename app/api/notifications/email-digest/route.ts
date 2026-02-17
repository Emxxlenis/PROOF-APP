import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const { userId, frequency = "daily" } = await request.json();

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

    // Get user preferences
    const { data: preferences } = await supabase
      .from("email_digest_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const includeNewComments = preferences?.include_new_comments ?? true;
    const includeNewFollowers = preferences?.include_new_followers ?? true;
    const includeTrendingPosts = preferences?.include_trending_posts ?? true;
    const includeMentorAlerts = preferences?.include_mentor_alerts ?? true;

    // Get user data
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Calculate time range based on frequency
    const now = new Date();
    const hoursAgo = frequency === "daily" ? 24 : 168; // 24h for daily, 168h (7 days) for weekly
    const since = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const digest: any = {};

    // Get new comments
    if (includeNewComments) {
      const { data: comments } = await supabase
        .from("community_comments")
        .select(`
          *,
          post:community_posts!community_comments_post_id_fkey (
            id,
            content,
            author:users!community_posts_author_id_fkey (full_name)
          )
        `)
        .gt("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      digest.newComments = comments || [];
    }

    // Get new followers (if followers table exists)
    if (includeNewFollowers) {
      // TODO: Implement when followers table is created
      digest.newFollowers = [];
    }

    // Get trending posts
    if (includeTrendingPosts) {
      const { data: posts } = await supabase
        .from("community_posts")
        .select(`
          *,
          author:users!community_posts_author_id_fkey (full_name, avatar_url)
        `)
        .eq("status", "published")
        .order("likes_count", { ascending: false })
        .limit(5);

      digest.trendingPosts = posts || [];
    }

    // Get mentor alerts
    if (includeMentorAlerts) {
      const { data: alerts } = await supabase
        .from("inactivity_alerts")
        .select(`
          *,
          project:startups!inactivity_alerts_startup_id_fkey (name)
        `)
        .eq("user_id", userId)
        .in("severity", ["critical", "high"])
        .is("email_sent_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      digest.mentorAlerts = alerts || [];
    }

    // Generate email HTML
    const emailHtml = generateDigestEmail(user, digest, frequency);

    return NextResponse.json({
      success: true,
      digest,
      email: {
        to: user.email,
        subject: `Resumen ${frequency === "daily" ? "diario" : "semanal"} - Proof`,
        html: emailHtml,
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/notifications/email-digest');
  }
}

function generateDigestEmail(user: any, digest: any, frequency: string): string {
  const period = frequency === "daily" ? "hoy" : "esta semana";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #208791; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #208791; }
        .item { background: white; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resumen ${frequency === "daily" ? "Diario" : "Semanal"}</h1>
        </div>
        <div class="content">
          <p>Hola ${user.full_name || user.email},</p>
          <p>Aquí está tu resumen de actividad ${period}:</p>
          
          ${digest.newComments?.length > 0 ? `
            <div class="section">
              <div class="section-title">💬 Nuevos Comentarios (${digest.newComments.length})</div>
              ${digest.newComments.map((comment: any) => `
                <div class="item">
                  <strong>${comment.post?.author?.full_name || "Usuario"}</strong> comentó en tu post:<br>
                  "${comment.post?.content?.substring(0, 100)}..."
                </div>
              `).join("")}
            </div>
          ` : ""}
          
          ${digest.trendingPosts?.length > 0 ? `
            <div class="section">
              <div class="section-title">🔥 Posts Trending</div>
              ${digest.trendingPosts.map((post: any) => `
                <div class="item">
                  <strong>${post.author?.full_name || "Usuario"}</strong>: ${post.content?.substring(0, 150)}...
                </div>
              `).join("")}
            </div>
          ` : ""}
          
          ${digest.mentorAlerts?.length > 0 ? `
            <div class="section">
              <div class="section-title">⚠️ Alertas de Mentoría</div>
              ${digest.mentorAlerts.map((alert: any) => `
                <div class="item">
                  <strong>${alert.project?.name || "Proyecto"}</strong>: ${alert.severity} - Requiere atención
                </div>
              `).join("")}
            </div>
          ` : ""}
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
               style="background: #208791; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ver en Proof →
            </a>
          </p>
        </div>
        <div class="footer">
          <p>Proof - Where Execution Speaks</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings">Gestionar preferencias</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}


