/**
 * @fileoverview Email the support inbox when users create or reply to tickets.
 * @module lib/support/notify-admin-support-ticket
 * @note Uses the service-role client so notifications work for cookie and Bearer auth paths.
 */

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { sendEmail, SUPPORT_EMAIL, SUPPORT_EMAIL_FROM } from "@/utils/email";
import { escapeHtml } from "@/utils/escape-html";

/**
 * @brief Sends an email to the support inbox for a new ticket or user reply.
 * @param ticketId Support ticket UUID.
 * @param _messageId Triggering message UUID (reserved for future deep-links).
 * @returns Resolves when send completes or fails soft (never throws to callers).
 */
export async function sendSupportTicketEmailNotificationToAdmin(
  ticketId: string,
  _messageId: string
): Promise<void> {
  try {
    const serviceSupabase = await createSupabaseServiceRole();
    if (!serviceSupabase) {
      console.error(
        "[notify-admin-support-ticket] Service role client unavailable"
      );
      return;
    }

    // Get ticket details (service role so API/native creates work without cookie session)
    const { data: ticket, error: ticketError } = await serviceSupabase
      .from("support_tickets")
      .select("id, ticket_number, subject, user_id, status, ticket_type")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("Error fetching ticket for email:", ticketError);
      return;
    }

    // Get user email and name
    let userEmail: string | null = null;
    let userName: string | null = null;
    try {
      const {
        data: { user },
      } = await serviceSupabase.auth.admin.getUserById(ticket.user_id);
      userEmail = user?.email || null;

      // Get user name from profile
      const { data: profile } = await serviceSupabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", ticket.user_id)
        .single();

      if (profile?.first_name || profile?.last_name) {
        userName =
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          null;
      }
    } catch (error) {
      console.error("Error fetching user for email:", error);
      return;
    }

    if (!userEmail) {
      console.error("No email found for ticket owner");
      return;
    }

    // Get all messages for the ticket
    const { data: messages, error: messagesError } = await serviceSupabase
      .from("support_messages")
      .select(
        `
        id,
        content,
        is_admin,
        created_at,
        user_id
      `
      )
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages for email:", messagesError);
      return;
    }

    // Get attachments for all messages
    const messageIds = messages?.map((m) => m.id) || [];
    const { data: attachments, error: attachmentsError } = await serviceSupabase
      .from("support_attachments")
      .select("*")
      .in("message_id", messageIds);

    if (attachmentsError) {
      console.error("Error fetching attachments for email:", attachmentsError);
    }

    // Get user emails for all messages
    const userIds = [...new Set(messages?.map((m) => m.user_id) || [])];
    const userEmailsMap = new Map<string, string | null>();

    for (const userId of userIds) {
      try {
        const {
          data: { user },
        } = await serviceSupabase.auth.admin.getUserById(userId);
        userEmailsMap.set(userId, user?.email || null);
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        userEmailsMap.set(userId, null);
      }
    }

    // Helper function to download and convert image to base64
    const getImageBase64 = async (
      storagePath: string,
      fileType: string
    ): Promise<string | null> => {
      try {
        const bucketName = "support-attachments";

        // Remove bucket prefix if present in storage_path
        let downloadPath = storagePath;
        if (storagePath.startsWith("support-attachments/")) {
          downloadPath = storagePath.replace("support-attachments/", "");
        }

        const { data, error } = await serviceSupabase.storage
          .from(bucketName)
          .download(downloadPath);

        if (error || !data) {
          console.error(`Error downloading image ${downloadPath}:`, error);
          return null;
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const contentType = fileType || "image/png";
        const dataUri = `data:${contentType};base64,${base64}`;

        return dataUri;
      } catch (error) {
        console.error(
          `Error converting image to base64 ${storagePath}:`,
          error
        );
        return null;
      }
    };

    // Build message chain HTML with embedded images
    const messageChainHtml = await Promise.all(
      (messages || []).map(async (msg, index) => {
        const senderEmail = userEmailsMap.get(msg.user_id) || "Unknown";
        const isAdmin = msg.is_admin;
        const senderName = isAdmin ? "Support Team" : userName || senderEmail;
        const messageDate = new Date(msg.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        // Get attachments for this message
        const messageAttachments = (attachments || []).filter(
          (att) => att.message_id === msg.id
        );

        // Build image HTML for embedded images
        let imagesHtml = "";
        for (const att of messageAttachments) {
          if (att.attachment_type === "image" && att.storage_path) {
            const base64Image = await getImageBase64(
              att.storage_path,
              att.file_type || "image/png"
            );
            if (base64Image) {
              const safeFileName = escapeHtml(att.file_name ?? "attachment");
              imagesHtml += `
                <div style="margin-top: 10px; margin-bottom: 10px;">
                  <img src="${base64Image}" alt="${safeFileName}" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #ddd; display: block;" />
                </div>
              `;
            }
          }
        }

        const safeSenderName = escapeHtml(senderName);
        const safeMessageDate = escapeHtml(messageDate);
        const safeContent = escapeHtml(msg.content).replace(/\n/g, "<br>");
        return `
          <div style="margin-bottom: 20px; padding: 15px; background-color: ${
            isAdmin ? "#f0f7ff" : "#f9f9f9"
          }; border-left: 3px solid ${
          isAdmin ? "#4a90e2" : "#ccc"
        }; border-radius: 4px;">
            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">
              ${safeSenderName} ${
          isAdmin
            ? '<span style="color: #4a90e2; font-size: 0.85em;">(Support)</span>'
            : ""
        }
            </div>
            <div style="font-size: 0.85em; color: #666; margin-bottom: 10px;">
              ${safeMessageDate}
            </div>
            <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">
              ${safeContent}
            </div>
            ${imagesHtml}
          </div>
        `;
      })
    );

    const messageChainHtmlString = messageChainHtml.join("");

    // Determine if this is a new ticket or a response
    const isNewTicket = (messages || []).length === 1;
    const ticketType = (ticket.ticket_type || "support") as string;
    const typeLabel = ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
    const emailTitle = isNewTicket
      ? `New ${typeLabel} Ticket`
      : `New Response to ${typeLabel} Ticket`;
    const emailSubject = isNewTicket
      ? `New ${typeLabel} Ticket: ${ticket.ticket_number} - ${ticket.subject}`
      : `New User Response: ${ticket.ticket_number} - ${ticket.subject}`;
    const emailIntro = isNewTicket
      ? `A new <strong>${escapeHtml(typeLabel)}</strong> ticket has been created: <strong>${
          escapeHtml(ticket.ticket_number)
        }</strong>: "${escapeHtml(ticket.subject)}".`
      : `A user has responded to support ticket <strong>${
          escapeHtml(ticket.ticket_number)
        }</strong>: "${escapeHtml(ticket.subject)}".`;

    // Generate admin ticket view URL - opens ticket modal
    const baseUrl = "https://www.cymasphere.com";
    const ticketUrl = `${baseUrl}/admin/support-tickets?ticket=${ticketId}`;

    const safeEmailTitle = escapeHtml(emailTitle);
    const safeUserName = escapeHtml(userName ?? userEmail ?? "Unknown");
    const safeUserEmail = escapeHtml(userEmail);
    const safeTicketStatus = escapeHtml(ticket.status);

    // Create email HTML (all user- and ticket-derived content escaped)
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeEmailTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f7f7; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%); padding: 30px 24px; text-align: center;">
                            <img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/logos//cymasphere-logo.png" alt="Cymasphere" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 24px;">
                            <h1 style="font-size: 1.5rem; color: #333; margin: 0 0 20px 0; font-weight: 600;">
                                ${safeEmailTitle}
                            </h1>
                            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                                ${emailIntro}
                            </p>
                            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                                <strong>User:</strong> ${safeUserName}<br>
                                <strong>Email:</strong> ${safeUserEmail}<br>
                                <strong>Type:</strong> ${escapeHtml(typeLabel)}<br>
                                <strong>Status:</strong> ${safeTicketStatus}
                            </p>
                            
                            <!-- Message Chain -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                                <h2 style="font-size: 1.1rem; color: #333; margin: 0 0 20px 0; font-weight: 600;">
                                    Conversation History
                                </h2>
                                ${messageChainHtmlString}
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${ticketUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 1rem;">
                                    View & Respond to Ticket
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 0.9em;">
                                You can also copy and paste this link into your browser:<br>
                                <a href="${ticketUrl}" style="color: #6c63ff; word-break: break-all;">${ticketUrl}</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 24px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center; font-size: 0.85em; color: #666;">
                            <p style="margin: 0 0 10px 0;">
                                This is an automated notification from Cymasphere Support.
                            </p>
                            <p style="margin: 0;">
                                <a href="${baseUrl}" style="color: #6c63ff; text-decoration: none;">Visit our website</a> | 
                                <a href="${baseUrl}/admin/support-tickets" style="color: #6c63ff; text-decoration: none;">View all tickets</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    // Create plain text version
    const emailText = `
${emailTitle}

${isNewTicket
  ? `A new support ticket has been created: ${ticket.ticket_number}: "${
      ticket.subject
    }".`
  : `A user has responded to support ticket ${ticket.ticket_number}: "${
      ticket.subject
    }".`}

User: ${userName || userEmail}
Email: ${userEmail}
Type: ${typeLabel}
Status: ${ticket.status}

Conversation History:
${
  messages
    ?.map((msg, index) => {
      const senderEmail = userEmailsMap.get(msg.user_id) || "Unknown";
      const isAdmin = msg.is_admin;
      const senderName = isAdmin ? "Support Team" : userName || senderEmail;
      const messageDate = new Date(msg.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      return `\n${senderName}${isAdmin ? " (Support)" : ""} - ${messageDate}\n${
        msg.content
      }\n`;
    })
    .join("\n---\n") || ""
}

View and respond to the ticket:
${ticketUrl}

This is an automated notification from Cymasphere Support.
    `;

    // Send email to admin
    const emailResult = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      from: SUPPORT_EMAIL_FROM,
      replyTo: userEmail,
    });

    if (emailResult.success) {
      console.log(
        `✅ Support ticket email notification sent to admin for ticket ${ticket.ticket_number}`
      );
    } else {
      console.error(
        `❌ Failed to send support ticket email notification to admin: ${emailResult.error}`
      );
    }
  } catch (error) {
    console.error("Error in sendSupportTicketEmailNotificationToAdmin:", error);
    // Don't throw - email failure shouldn't break message creation
  }
}

