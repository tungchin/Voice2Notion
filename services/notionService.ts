import { VoiceNote, NotionConfig } from "../types";

export interface NotionResponse {
  success: boolean;
  message?: string;
}

export const saveToNotion = async (note: VoiceNote, config: NotionConfig): Promise<NotionResponse> => {
  try {
    const baseUrl = 'https://api.notion.com/v1/pages';
    let url = baseUrl;

    const apiKey = config.apiKey.trim();
    const databaseId = config.databaseId.trim();
    const corsProxy = config.corsProxy ? config.corsProxy.trim() : '';

    // Check if proxy is needed but missing (heuristic: running in browser)
    if (!corsProxy && typeof window !== 'undefined') {
        // We will try direct fetch, but it will likely fail.
    }

    if (corsProxy) {
      if (!corsProxy.startsWith('http')) {
          return { success: false, message: "Invalid Proxy URL. It must start with http:// or https://. Please check Settings." };
      }
      // Ensure proxy ends with / to prevent "https://proxy.comhttps://api..." errors
      const proxy = corsProxy.endsWith('/') ? corsProxy : `${corsProxy}/`;
      url = `${proxy}${baseUrl}`;
    }

    // Construct the body.
    const body = {
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: note.summary || "Untitled Note"
              }
            }
          ]
        },
        Category: {
          select: {
            name: note.category
          }
        },
        Tags: {
          multi_select: note.tags.map(tag => ({ name: tag }))
        }
      },
      children: [
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [{ text: { content: `Category: ${note.category} | Tags: ${note.tags.join(', ')}` } }],
            icon: { emoji: "🎙️" },
            color: "gray_background"
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Transcription' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: note.transcription } }]
          }
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'X-Requested-With': 'XMLHttpRequest', 
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        // Read text first to avoid JSON parse errors on empty/html responses
        const errorText = await response.text();
        let errorData: any = {};
        try {
            errorData = JSON.parse(errorText);
        } catch {
            // response was not JSON, use text as message
            errorData = { message: errorText || "No error details provided by server." };
        }
        
        console.error("Notion API Error:", response.status, errorText);
        
        let msg = `Error ${response.status}: ${errorData.message || 'Unknown error'}`;
        
        if (response.status === 404) {
             // Heuristic: check if error message mentions "Invalid host" which implies bad proxy config or ID in proxy field
             if (errorData.message?.includes("Invalid host") || errorText.includes("Invalid host")) {
                 msg = "Configuration Error: It looks like a Database ID was pasted into the Proxy URL field, or the Proxy URL is invalid. Please clear and check Settings.";
             } else {
                 msg = `Notion Database Not Found (404).\n\nTroubleshooting:\n1. Verify Database ID: "${databaseId}" (should be 32 chars).\n2. Permissions: Open the specific Database page in Notion > '...' menu > 'Connections' > Add your Integration.`;
             }
        } else if (response.status === 401) {
          msg = "Unauthorized (401). Please check your Integration Secret Key.";
        } else if (response.status === 400) {
            if (errorData.code === 'invalid_request_url') {
                msg = "Invalid Request URL (400). Please check your Proxy URL setting for extra spaces or invalid characters.";
            } else {
                msg = `Validation Error (400): ${errorData.message}\n\nEnsure 'Category' (Select) and 'Tags' (Multi-select) properties exist in your database.`;
            }
        } else if (response.status === 403) {
            msg = `Forbidden (403). Proxy access may have expired.\n\nPlease visit this URL to re-enable access:\n${corsProxy}corsdemo`;
        }

        return { success: false, message: msg };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving to Notion:", error);
    let message = error instanceof Error ? error.message : "Unknown Network Error";
    
    // Improve clarity for CORS errors
    if (message === "Failed to fetch" || message.toLowerCase().includes("networkerror")) {
        if (!config.corsProxy) {
            message = "Browser Blocked Request (CORS). You MUST configure a CORS Proxy in Settings.";
        } else {
            message = `Network Error (Proxy Blocked).\n\nPlease visit this URL to request temporary access:\n${config.corsProxy}corsdemo`;
        }
    }
    
    return { success: false, message };
  }
};